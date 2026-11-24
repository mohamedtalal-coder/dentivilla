"use server";

import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";
import type { AppointmentStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertSlotAvailable, BookingError, createReference, findConflict, lockBookings } from "@/lib/booking";
import { TIMEZONE } from "@/lib/site";
import { deleteMediaIfUnused } from "@/lib/media";
import {
  computePhoneBlindIndex,
  decryptOptional,
  encryptField,
  encryptOptional,
} from "@/lib/encryption";
import {
  availabilitySettingsSchema,
  caseSchema,
  createAdminAppointmentSchema,
  faqSchema,
  offerSchema,
  patientUpdateSchema,
  siteImageSlotSchema,
  addSiteImageItemSchema,
  reorderSiteImageItemsSchema,
  siteSettingsSchema,
  siteCopySchema,
  treatmentSchema,
  updateAppointmentTreatmentSchema,
  blockedPeriodSchema,
  extraSlotSchema,
  rescheduleSchema,
  workingHoursSchema,
} from "@/lib/validations";
import { CORE_IMAGE_SLOTS } from "@/lib/site-images";
import { SITE_COPY_KEYS } from "@/lib/site-copy";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
}

function revalidateAdmin() {
  revalidatePath("/admin", "layout");
}

/** Wraps an admin mutation: auth check + uniform error reporting. */
async function run(fn: () => Promise<string | void>): Promise<ActionResult> {
  try {
    await requireAdmin();
    const message = await fn();
    revalidateAdmin();
    return { ok: true, message: message || undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "انتهت الجلسة. سجّل الدخول مرة أخرى." };
    }
    if (error instanceof BookingError || error instanceof UserFacingError) {
      return { ok: false, error: error.message };
    }
    if (error && typeof error === "object" && "issues" in error) {
      const issues = (error as { issues: { message: string }[] }).issues;
      return { ok: false, error: issues[0]?.message ?? "بيانات غير صالحة" };
    }
    if (error instanceof Error && /Appointment_no_overlap|23P01/.test(error.message)) {
      return { ok: false, error: "يتعارض هذا الوقت مع موعد آخر محجوز." };
    }
    console.error("[admin] action failed:", error instanceof Error ? error.message : "operation error");
    return { ok: false, error: "تعذر تنفيذ العملية. حاول مرة أخرى." };
  }
}

class UserFacingError extends Error {}

/** datetime-local value entered by the clinic is Cairo wall-clock time. */
const cairoLocal = (value: string) => fromZonedTime(`${value}:00`, TIMEZONE);

const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  REJECTED: [],
  CANCELLED: [],
  COMPLETED: [],
};

export async function setAppointmentStatus(id: string, status: AppointmentStatus, adminNotes?: string) {
  return run(async () => {
    await prisma.$transaction(async (tx) => {
      await lockBookings(tx);
      const current = await tx.appointment.findUnique({ where: { id } });
      if (!current) throw new UserFacingError("الموعد غير موجود");
      if (!TRANSITIONS[current.status].includes(status)) {
        throw new UserFacingError("لا يمكن تغيير حالة هذا الموعد بهذه الطريقة");
      }
      if (status === "CONFIRMED") {
        const conflict = await findConflict(current.startsAt, current.endsAt, current.id, tx);
        if (conflict) throw new UserFacingError(`لا يمكن التأكيد: ${conflict}`);
      }
      const note = adminNotes?.trim();
      const existingDecrypted = decryptOptional(current.adminNotes);
      const combined = note ? [existingDecrypted, note].filter(Boolean).join("\n") : existingDecrypted;
      await tx.appointment.update({
        where: { id },
        data: {
          status,
          adminNotes: encryptOptional(combined),
        },
      });
    });
    return "تم تحديث حالة الموعد بنجاح";
  });
}

export async function rescheduleAppointment(id: string, startsAtIso: string) {
  return run(async () => {
    const data = rescheduleSchema.parse({ id, startsAt: startsAtIso });
    await prisma.$transaction(async (tx) => {
      await lockBookings(tx);
      const current = await tx.appointment.findUnique({ where: { id: data.id }, include: { treatment: true } });
      if (!current) throw new UserFacingError("الموعد غير موجود");
      if (current.status !== "PENDING" && current.status !== "CONFIRMED") {
        throw new UserFacingError("يمكن إعادة جدولة المواعيد المعلقة أو المؤكدة فقط");
      }
      const startsAt = new Date(data.startsAt);
      await assertSlotAvailable(startsAt, current.treatment.durationMinutes, {
        db: tx,
        ignoreAppointmentId: current.id,
        admin: true,
      });
      await tx.appointment.update({
        where: { id: current.id },
        data: { startsAt, endsAt: new Date(startsAt.getTime() + current.treatment.durationMinutes * 60_000) },
      });
    });
    return "تمت إعادة جدولة الموعد بنجاح";
  });
}

/** Updates the reservation type (treatment) and teeth for an existing appointment */
export async function updateAppointmentTreatment(id: string, treatmentId: string, teeth: string[] = []) {
  return run(async () => {
    const data = updateAppointmentTreatmentSchema.parse({ id, treatmentId, teeth });
    await prisma.$transaction(async (tx) => {
      await lockBookings(tx);
      const current = await tx.appointment.findUnique({
        where: { id: data.id },
        include: { treatment: true },
      });
      if (!current) throw new UserFacingError("الموعد غير موجود");

      const newTreatment = await tx.treatment.findUnique({ where: { id: data.treatmentId } });
      if (!newTreatment) throw new UserFacingError("نوع العلاج غير موجود");

      const newEndsAt = new Date(current.startsAt.getTime() + newTreatment.durationMinutes * 60_000);

      // Check conflict if appointment is active
      if (current.status === "CONFIRMED" || current.status === "PENDING") {
        const conflict = await findConflict(current.startsAt, newEndsAt, current.id, tx);
        if (conflict) {
          throw new UserFacingError(`يتعارض توقيت الموعد الجديد مع: ${conflict}`);
        }
      }

      await tx.appointment.update({
        where: { id: current.id },
        data: {
          treatmentId: newTreatment.id,
          teeth: data.teeth,
          endsAt: newEndsAt,
        },
      });
    });

    revalidatePath("/admin");
    revalidatePath("/admin/appointments");
    revalidatePath(`/admin/appointments/${id}`);
    revalidatePath("/admin/calendar");
    return "تم تحديث العلاج والأسنان المحددة بنجاح";
  });
}

/** Creates a new appointment directly from the admin dashboard */
export async function createAdminAppointment(input: unknown) {
  return run(async () => {
    const data = createAdminAppointmentSchema.parse(input);
    const startsAt = new Date(data.startsAt);
    if (isNaN(startsAt.getTime())) {
      throw new UserFacingError("تاريخ ووقت الموعد غير صالح");
    }

    const appointment = await prisma.$transaction(async (tx) => {
      await lockBookings(tx);
      const treatment = await tx.treatment.findUnique({ where: { id: data.treatmentId } });
      if (!treatment) throw new UserFacingError("العلاج المحدد غير موجود");

      const endsAt = new Date(startsAt.getTime() + treatment.durationMinutes * 60_000);

      // Check conflict
      const conflict = await findConflict(startsAt, endsAt, "new-admin-booking", tx);
      if (conflict) throw new UserFacingError(`تعذر تسجيل الموعد لوجود تعارض: ${conflict}`);

      const phoneBlindIndex = computePhoneBlindIndex(data.phone);
      const encryptedPhone = encryptField(data.phone);
      const encryptedFullName = encryptField(data.fullName);
      const encryptedWhatsapp = encryptOptional(data.whatsapp);
      const encryptedNotes = encryptOptional(data.patientNotes);
      const encryptedAdminNotes = encryptOptional(data.adminNotes ?? "حجز مباشر عبر لوحة الإدارة");

      const patient = await tx.patient.upsert({
        where: { phoneBlindIndex },
        update: {
          fullName: encryptedFullName,
          phone: encryptedPhone,
          whatsapp: encryptedWhatsapp,
        },
        create: {
          fullName: encryptedFullName,
          phone: encryptedPhone,
          phoneBlindIndex,
          whatsapp: encryptedWhatsapp,
        },
      });

      return tx.appointment.create({
        data: {
          reference: createReference(),
          patientId: patient.id,
          treatmentId: treatment.id,
          teeth: data.teeth,
          startsAt,
          endsAt,
          status: data.status,
          patientNotes: encryptedNotes,
          adminNotes: encryptedAdminNotes,
        },
      });
    });

    revalidatePath("/admin");
    revalidatePath("/admin/appointments");
    revalidatePath("/admin/calendar");
    revalidatePath("/admin/patients");
    return `تم تسجيل الموعد بنجاح، رقم المرجع: ${appointment.reference}`;
  });
}

export async function updatePatient(id: string, input: unknown) {
  return run(async () => {
    const data = patientUpdateSchema.parse(input);
    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) throw new UserFacingError("المريض غير موجود");

    const newBlindIndex = computePhoneBlindIndex(data.phone);
    const phoneTaken = await prisma.patient.findUnique({ where: { phoneBlindIndex: newBlindIndex } });
    if (phoneTaken && phoneTaken.id !== id) {
      throw new UserFacingError("رقم الهاتف مسجل بالفعل لمريض آخر.");
    }

    await prisma.patient.update({
      where: { id },
      data: {
        fullName: encryptField(data.fullName),
        phone: encryptField(data.phone),
        phoneBlindIndex: newBlindIndex,
        notes: null, // Privacy rule: ensure extraneous notes are stripped
      },
    });

    revalidatePath("/admin/patients");
    revalidatePath(`/admin/patients/${id}`);
    return "تم تحديث بيانات المريض بنجاح";
  });
}

export async function savePatientNotes(id: string, notes: string) {
  return run(async () => {
    if (notes.length > 2000) throw new UserFacingError("الملاحظات طويلة جداً");
    await prisma.patient.update({ where: { id }, data: { notes: null } });
    return "تم حفظ الملاحظات بنجاح";
  });
}

export async function saveAvailabilitySettings(input: unknown) {
  return run(async () => {
    const data = availabilitySettingsSchema.parse(input);
    await prisma.availabilitySettings.update({ where: { id: "default" }, data });
    return "تم حفظ الإعدادات بنجاح";
  });
}

export async function saveWorkingHours(input: unknown) {
  return run(async () => {
    const data = workingHoursSchema.parse(input);
    await prisma.workingHours.upsert({ where: { weekday: data.weekday }, update: data, create: data });
    revalidatePath("/", "layout"); // footer shows the hours
    return "تم حفظ ساعات العمل بنجاح";
  });
}

export async function addBlockedPeriod(input: unknown) {
  return run(async () => {
    const data = blockedPeriodSchema.parse(input);
    const startsAt = cairoLocal(data.startsAt);
    const endsAt = cairoLocal(data.endsAt);
    const held = await prisma.appointment.count({
      where: { status: { in: ["PENDING", "CONFIRMED"] }, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
    });
    await prisma.blockedPeriod.create({ data: { startsAt, endsAt, reason: data.reason } });
    return held
      ? `تم حفظ الفترة المحجوبة. تنبيه: هناك ${held} موعد نشط خلال هذه الفترة — يرجى مراجعتها وإعادة جدولتها.`
      : "تم حفظ الفترة المحجوبة بنجاح";
  });
}

export async function removeBlockedPeriod(id: string) {
  return run(async () => {
    await prisma.blockedPeriod.delete({ where: { id } });
    return "تم إلغاء الفترة المحجوبة";
  });
}

export async function addExtraSlot(input: unknown) {
  return run(async () => {
    const data = extraSlotSchema.parse(input);
    await prisma.extraSlot.create({
      data: { startsAt: cairoLocal(data.startsAt), endsAt: cairoLocal(data.endsAt), note: data.note || null },
    });
    return "تمت إضافة الوقت الإضافي بنجاح";
  });
}

export async function removeExtraSlot(id: string) {
  return run(async () => {
    await prisma.extraSlot.delete({ where: { id } });
    return "تم إلغاء الوقت الإضافي";
  });
}

/* ------------------------------ site settings ------------------------------ */

export async function saveSiteSettings(input: unknown) {
  return run(async () => {
    const data = siteSettingsSchema.parse(input);
    await prisma.siteSettings.upsert({ where: { id: "default" }, update: data, create: { id: "default", ...data } });
    revalidatePath("/", "layout"); // footer, contact page and WhatsApp buttons everywhere
    return "تم حفظ بيانات التواصل بنجاح";
  });
}

export async function saveSiteCopy(input: unknown) {
  return run(async () => {
    const data = siteCopySchema.parse(input);
    const copy: Record<string, string> = {};
    for (const key of SITE_COPY_KEYS) {
      const value = data[key];
      if (typeof value === "string" && value.trim()) copy[key] = value.trim();
    }
    await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: { copy },
      create: { id: "default", copy },
    });
    revalidatePath("/", "layout");
    revalidatePath("/admin/images");
    return "تم حفظ نصوص الموقع بنجاح";
  });
}

/* --------------------------- before / after cases --------------------------- */

function revalidateCases() {
  revalidatePath("/");
  revalidatePath("/cases");
  revalidatePath("/admin/cases");
}

export async function createCase(input: unknown) {
  return run(async () => {
    const data = caseSchema.parse(input);
    const media = await prisma.media.count({ where: { id: { in: [data.beforeMediaId, data.afterMediaId] } } });
    if (media !== 2) throw new UserFacingError("تعذر العثور على الصور المرفوعة. أعد المحاولة.");
    const last = await prisma.beforeAfterCase.aggregate({ _max: { sortOrder: true } });
    const count = await prisma.beforeAfterCase.count({ where: { featured: true } });
    await prisma.beforeAfterCase.create({
      data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 1, featured: count === 0 && data.published },
    });
    revalidateCases();
    return data.published ? "تمت إضافة الحالة ونشرها بنجاح" : "تم حفظ الحالة كمسودة";
  });
}

export async function updateCase(id: string, input: unknown) {
  return run(async () => {
    const data = caseSchema.parse(input);
    const current = await prisma.beforeAfterCase.findUnique({ where: { id } });
    if (!current) throw new UserFacingError("الحالة غير موجودة");
    await prisma.beforeAfterCase.update({
      where: { id },
      data: { ...data, featured: data.published ? current.featured : false },
    });
    await deleteMediaIfUnused([current.beforeMediaId, current.afterMediaId]);
    revalidateCases();
    return "تم حفظ التعديلات بنجاح";
  });
}

export async function setCasePublished(id: string, published: boolean) {
  return run(async () => {
    const current = await prisma.beforeAfterCase.findUnique({ where: { id } });
    if (!current) throw new UserFacingError("الحالة غير موجودة");
    if (published && !current.consentOnFile) {
      throw new UserFacingError("يرجى تأكيد موافقة المريض قبل النشر");
    }
    await prisma.beforeAfterCase.update({
      where: { id },
      data: { published, featured: published ? current.featured : false },
    });
    revalidateCases();
    return published ? "تم نشر الحالة" : "تم إخفاء الحالة من الموقع";
  });
}

/** Exactly one featured case appears on the homepage. */
export async function setCaseFeatured(id: string) {
  return run(async () => {
    const current = await prisma.beforeAfterCase.findUnique({ where: { id } });
    if (!current?.published) throw new UserFacingError("يرجى نشر الحالة أولاً");
    await prisma.$transaction([
      prisma.beforeAfterCase.updateMany({ where: { featured: true }, data: { featured: false } }),
      prisma.beforeAfterCase.update({ where: { id }, data: { featured: true } }),
    ]);
    revalidateCases();
    return "تم تعيين الحالة كحالة رئيسية مميزة بالصفحة الرئيسية";
  });
}

export async function moveCase(id: string, direction: "up" | "down") {
  return run(async () => {
    const all = await prisma.beforeAfterCase.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    const index = all.findIndex((c) => c.id === id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= all.length) return;
    const ordered = [...all];
    [ordered[index], ordered[swapWith]] = [ordered[swapWith], ordered[index]];
    await prisma.$transaction(
      ordered.map((c, i) => prisma.beforeAfterCase.update({ where: { id: c.id }, data: { sortOrder: i + 1 } })),
    );
    revalidateCases();
  });
}

export async function deleteCase(id: string) {
  return run(async () => {
    const current = await prisma.beforeAfterCase.delete({ where: { id } }).catch(() => null);
    if (!current) throw new UserFacingError("الحالة غير موجودة");
    await deleteMediaIfUnused([current.beforeMediaId, current.afterMediaId]);
    if (current.featured) {
      const next = await prisma.beforeAfterCase.findFirst({ where: { published: true }, orderBy: { sortOrder: "asc" } });
      if (next) await prisma.beforeAfterCase.update({ where: { id: next.id }, data: { featured: true } });
    }
    revalidateCases();
    return "تم حذف الحالة وصورها بنجاح";
  });
}

/* --------------------------------- offers --------------------------------- */

function revalidateOffers() {
  revalidatePath("/");
  revalidatePath("/admin/offers");
}

export async function createOffer(input: unknown) {
  return run(async () => {
    const data = offerSchema.parse(input);
    const last = await prisma.offer.aggregate({ _max: { sortOrder: true } });
    await prisma.offer.create({
      data: {
        ...data,
        treatmentSlug: data.treatmentSlug || null,
        sortOrder: (last._max.sortOrder ?? 0) + 1,
      },
    });
    revalidateOffers();
    return "تمت إضافة العرض بنجاح";
  });
}

export async function updateOffer(id: string, input: unknown) {
  return run(async () => {
    const data = offerSchema.parse(input);
    const current = await prisma.offer.findUnique({ where: { id } });
    if (!current) throw new UserFacingError("العرض غير موجود");
    await prisma.offer.update({
      where: { id },
      data: {
        ...data,
        treatmentSlug: data.treatmentSlug || null,
      },
    });
    revalidateOffers();
    return "تم تحديث العرض بنجاح";
  });
}

export async function toggleOfferActive(id: string, active: boolean) {
  return run(async () => {
    const current = await prisma.offer.findUnique({ where: { id } });
    if (!current) throw new UserFacingError("العرض غير موجود");
    await prisma.offer.update({
      where: { id },
      data: { active },
    });
    revalidateOffers();
    return active ? "تم تفعيل العرض" : "تم تعطيل العرض";
  });
}

export async function deleteOffer(id: string) {
  return run(async () => {
    const current = await prisma.offer.delete({ where: { id } }).catch(() => null);
    if (!current) throw new UserFacingError("العرض غير موجود");
    revalidateOffers();
    return "تم حذف العرض بنجاح";
  });
}

export async function moveOffer(id: string, direction: "up" | "down") {
  return run(async () => {
    const all = await prisma.offer.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    const index = all.findIndex((o) => o.id === id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= all.length) return;
    const ordered = [...all];
    [ordered[index], ordered[swapWith]] = [ordered[swapWith], ordered[index]];
    await prisma.$transaction(
      ordered.map((o, i) => prisma.offer.update({ where: { id: o.id }, data: { sortOrder: i + 1 } })),
    );
    revalidateOffers();
  });
}


/* ---------------------------------- faqs ---------------------------------- */

function revalidateFaqs() {
  revalidatePath("/");
  revalidatePath("/admin/faq");
}

export async function createFaq(input: unknown) {
  return run(async () => {
    const data = faqSchema.parse(input);
    const last = await prisma.faq.aggregate({ _max: { sortOrder: true } });
    await prisma.faq.create({
      data: {
        ...data,
        sortOrder: (last._max.sortOrder ?? 0) + 1,
      },
    });
    revalidateFaqs();
    return "تمت إضافة السؤال بنجاح";
  });
}

export async function updateFaq(id: string, input: unknown) {
  return run(async () => {
    const data = faqSchema.parse(input);
    const current = await prisma.faq.findUnique({ where: { id } });
    if (!current) throw new UserFacingError("السؤال غير موجود");
    await prisma.faq.update({
      where: { id },
      data,
    });
    revalidateFaqs();
    return "تم تحديث السؤال بنجاح";
  });
}

export async function toggleFaqPublished(id: string, published: boolean) {
  return run(async () => {
    const current = await prisma.faq.findUnique({ where: { id } });
    if (!current) throw new UserFacingError("السؤال غير موجود");
    await prisma.faq.update({
      where: { id },
      data: { published },
    });
    revalidateFaqs();
    return published ? "تم نشر السؤال" : "تم إخفاء السؤال";
  });
}

export async function deleteFaq(id: string) {
  return run(async () => {
    const current = await prisma.faq.delete({ where: { id } }).catch(() => null);
    if (!current) throw new UserFacingError("السؤال غير موجود");
    revalidateFaqs();
    return "تم حذف السؤال بنجاح";
  });
}

export async function moveFaq(id: string, direction: "up" | "down") {
  return run(async () => {
    const all = await prisma.faq.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    const index = all.findIndex((f) => f.id === id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= all.length) return;
    const ordered = [...all];
    [ordered[index], ordered[swapWith]] = [ordered[swapWith], ordered[index]];
    await prisma.$transaction(
      ordered.map((f, i) => prisma.faq.update({ where: { id: f.id }, data: { sortOrder: i + 1 } })),
    );
    revalidateFaqs();
  });
}

function revalidateTreatments() {
  revalidatePath("/treatments", "page");
  revalidatePath("/", "page");
  revalidatePath("/booking", "page");
  revalidatePath("/admin/treatments", "page");
}

export async function createTreatment(input: unknown) {
  return run(async () => {
    const data = treatmentSchema.parse(input);
    const existing = await prisma.treatment.findUnique({ where: { slug: data.slug } });
    if (existing) throw new UserFacingError("هذا المعرف (Slug) مستخدم بالفعل لعلاج آخر");
    const count = await prisma.treatment.count();
    await prisma.treatment.create({
      data: {
        ...data,
        sortOrder: count + 1,
      },
    });
    revalidateTreatments();
    return "تمت إضافة العلاج بنجاح";
  });
}

export async function updateTreatment(id: string, input: unknown) {
  return run(async () => {
    const data = treatmentSchema.parse(input);
    const existingSlug = await prisma.treatment.findFirst({
      where: { slug: data.slug, NOT: { id } },
    });
    if (existingSlug) throw new UserFacingError("هذا المعرف (Slug) مستخدم بالفعل لعلاج آخر");
    const current = await prisma.treatment.update({
      where: { id },
      data,
    }).catch(() => null);
    if (!current) throw new UserFacingError("العلاج غير موجود");
    revalidateTreatments();
    return "تم تحديث العلاج بنجاح";
  });
}

export async function deleteTreatment(id: string) {
  return run(async () => {
    const appointmentsCount = await prisma.appointment.count({ where: { treatmentId: id } });
    if (appointmentsCount > 0) {
      throw new UserFacingError(`لا يمكن حذف العلاج لوجود ${appointmentsCount} موعد مرتبط به في السجلات.`);
    }
    const current = await prisma.treatment.delete({ where: { id } }).catch(() => null);
    if (!current) throw new UserFacingError("العلاج غير موجود");
    revalidateTreatments();
    return "تم حذف العلاج بنجاح";
  });
}

export async function moveTreatment(id: string, direction: "up" | "down") {
  return run(async () => {
    const all = await prisma.treatment.findMany({ orderBy: { sortOrder: "asc" } });
    const index = all.findIndex((t) => t.id === id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= all.length) return;
    const ordered = [...all];
    [ordered[index], ordered[swapWith]] = [ordered[swapWith], ordered[index]];
    await prisma.$transaction(
      ordered.map((t, i) => prisma.treatment.update({ where: { id: t.id }, data: { sortOrder: i + 1 } })),
    );
    revalidateTreatments();
  });
}

function revalidateSiteImages() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/images", "page");
}

export async function updateSiteImageSlot(input: unknown) {
  return run(async () => {
    const { key, mediaId, customUrl } = siteImageSlotSchema.parse(input);
    const slotDef = CORE_IMAGE_SLOTS.find((s) => s.key === key);
    const labelAr = slotDef?.labelAr ?? key;
    const description = slotDef?.locationAr;

    await prisma.siteImage.upsert({
      where: { id: key },
      update: {
        mediaId: mediaId || null,
        customUrl: customUrl || null,
      },
      create: {
        id: key,
        labelAr,
        description,
        mediaId: mediaId || null,
        customUrl: customUrl || null,
      },
    });
    revalidateSiteImages();
    return "تم تحديث صورة الموقع بنجاح";
  });
}

export async function addSiteImageItem(input: unknown) {
  return run(async () => {
    const { slotKey, mediaId, customUrl } = addSiteImageItemSchema.parse(input);
    const slotDef = CORE_IMAGE_SLOTS.find((s) => s.key === slotKey);
    const labelAr = slotDef?.labelAr ?? slotKey;
    const description = slotDef?.locationAr;

    // ensure parent SiteImage exists
    await prisma.siteImage.upsert({
      where: { id: slotKey },
      update: {},
      create: {
        id: slotKey,
        labelAr,
        description,
        mediaId: mediaId || null,
        customUrl: customUrl || null,
      },
    });

    const maxSort = await prisma.siteImageItem.findFirst({
      where: { siteImageId: slotKey },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const nextOrder = (maxSort?.sortOrder ?? -1) + 1;

    await prisma.siteImageItem.create({
      data: {
        siteImageId: slotKey,
        mediaId: mediaId || null,
        customUrl: customUrl || null,
        sortOrder: nextOrder,
      },
    });

    // Also update parent SiteImage.mediaId if it was null
    const parent = await prisma.siteImage.findUnique({ where: { id: slotKey } });
    if (!parent?.mediaId && mediaId) {
      await prisma.siteImage.update({
        where: { id: slotKey },
        data: { mediaId, customUrl: null },
      });
    }

    revalidateSiteImages();
    return "تمت إضافة الصورة إلى المعرض بنجاح";
  });
}

export async function deleteSiteImageItem(itemId: string) {
  return run(async () => {
    const item = await prisma.siteImageItem.findUnique({ where: { id: itemId } });
    if (!item) throw new UserFacingError("الصورة غير موجودة.");

    const slotKey = item.siteImageId;
    await prisma.siteImageItem.delete({ where: { id: itemId } });
    if (item.mediaId) {
      await deleteMediaIfUnused([item.mediaId]);
    }

    // Refresh parent SiteImage primary mediaId
    const firstRemaining = await prisma.siteImageItem.findFirst({
      where: { siteImageId: slotKey },
      orderBy: { sortOrder: "asc" },
    });
    await prisma.siteImage.update({
      where: { id: slotKey },
      data: {
        mediaId: firstRemaining?.mediaId ?? null,
        customUrl: firstRemaining?.customUrl ?? null,
      },
    });

    revalidateSiteImages();
    return "تم حذف الصورة من المعرض";
  });
}

export async function reorderSiteImageItems(input: unknown) {
  return run(async () => {
    const { slotKey, itemIds } = reorderSiteImageItemsSchema.parse(input);
    await prisma.$transaction(
      itemIds.map((id, index) =>
        prisma.siteImageItem.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    const firstRemaining = await prisma.siteImageItem.findFirst({
      where: { siteImageId: slotKey },
      orderBy: { sortOrder: "asc" },
    });
    if (firstRemaining) {
      await prisma.siteImage.update({
        where: { id: slotKey },
        data: {
          mediaId: firstRemaining.mediaId ?? null,
          customUrl: firstRemaining.customUrl ?? null,
        },
      });
    }

    revalidateSiteImages();
    return "تم حفظ ترتيب الصور بنجاح";
  });
}

export async function resetSiteImageSlot(key: string) {
  return run(async () => {
    const existing = await prisma.siteImage.findUnique({
      where: { id: key },
      include: { items: true },
    });
    if (existing) {
      const mediaIds: string[] = [];
      if (existing.mediaId) mediaIds.push(existing.mediaId);
      for (const item of existing.items) {
        if (item.mediaId) mediaIds.push(item.mediaId);
      }
      await prisma.siteImage.delete({ where: { id: key } });
      if (mediaIds.length > 0) {
        await deleteMediaIfUnused(mediaIds);
      }
    }
    revalidateSiteImages();
    return "تمت استعادة الصورة الافتراضية بنجاح";
  });
}

export async function deleteMedia(id: string) {
  return run(async () => {
    const usedInCase = await prisma.beforeAfterCase.count({ where: { OR: [{ beforeMediaId: id }, { afterMediaId: id }] } });
    if (usedInCase > 0) throw new UserFacingError("لا يمكن حذف الصورة لأنها مستخدمة في حالات قبل وبعد.");
    const usedInSite = await prisma.siteImage.count({ where: { mediaId: id } });
    const usedInSiteItem = await prisma.siteImageItem.count({ where: { mediaId: id } });
    if (usedInSite > 0 || usedInSiteItem > 0) throw new UserFacingError("لا يمكن حذف الصورة لأنها مستخدمة كصورة رئيسية للموقع أو بالمعرض.");
    await prisma.media.delete({ where: { id } }).catch(() => null);
    revalidateSiteImages();
    return "تم حذف الصورة من مكتبة الوسائط";
  });
}

