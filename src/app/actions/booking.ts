"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { BookingError, createPendingAppointment } from "@/lib/booking";
import type { BookingResult } from "@/lib/booking-types";
import { computePhoneBlindIndex } from "@/lib/encryption";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";
import { bookingLookupSchema, bookingSchema } from "@/lib/validations";

export type { BookingResult } from "@/lib/booking-types";

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

/** Postgres exclusion_violation from the Appointment_no_overlap constraint. */
const isOverlapViolation = (error: unknown) =>
  error instanceof Error && /Appointment_no_overlap|23P01|exclusion constraint/i.test(error.message);

export async function submitBooking(input: unknown): Promise<BookingResult> {
  // 1. Rate limiting: max 5 booking attempts per 10 minutes per IP
  try {
    const headersList = await headers();
    const ip = extractClientIp(headersList);
    const rate = checkRateLimit(`submitBooking:${ip}`, 5, 600);
    if (!rate.allowed) {
      return {
        ok: false,
        code: "SERVER",
        error: `تم تجاوز الحد المسموح به للمحاولات. يرجى الانتظار ${Math.ceil(rate.resetSeconds / 60)} دقيقة والمحاولة لاحقاً.`,
      };
    }
  } catch {
    // If headers cannot be inspected (e.g. in test runner), proceed safely
  }

  // 2. Strict input validation
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      code: "VALIDATION",
      error: issue?.message ?? "بيانات غير مكتملة",
      field: issue?.path.join("."),
    };
  }
  const data = parsed.data;

  const treatment = await prisma.treatment.findUnique({ where: { id: data.treatmentId } });
  if (!treatment) return { ok: false, code: "NOT_FOUND", error: "نوع الزيارة غير موجود. حدّث الصفحة وحاول مرة أخرى." };
  if (treatment.requiresTeeth && data.teeth.length === 0) {
    return { ok: false, code: "VALIDATION", error: "حدد السن أو الأسنان المعنية.", field: "teeth" };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const appointment = await createPendingAppointment({
        treatment,
        startsAt: new Date(data.startsAt),
        teeth: data.teeth,
        fullName: data.fullName,
        phone: data.phone,
        whatsapp: data.whatsapp,
        notes: data.notes,
        medicalConditions: data.medicalConditions,
      });

      revalidatePath("/admin");
      revalidatePath("/admin/appointments");
      return { ok: true, reference: appointment.reference, startsAt: appointment.startsAt.toISOString() };
    } catch (error) {
      if (error instanceof BookingError) {
        const code = error.code === "SLOT_TAKEN" || error.code === "SLOT_INVALID" ? error.code : "SERVER";
        return { ok: false, code, error: error.message };
      }
      if (isOverlapViolation(error)) {
        return { ok: false, code: "SLOT_TAKEN", error: "عذراً، حُجز هذا الوقت للتو. اختر وقتاً آخر." };
      }
      if (isUniqueViolation(error)) continue; // reference collision — try a new one

      // Security: never log patient PII or raw error dumps that might leak patient info
      console.error(
        "[booking] submitBooking attempt failed:",
        error instanceof Error ? error.message : "database error",
      );
      return { ok: false, code: "SERVER", error: "تعذر إتمام الحجز الآن. حاول مرة أخرى بعد قليل." };
    }
  }
  return { ok: false, code: "SERVER", error: "تعذر إتمام الحجز الآن. حاول مرة أخرى بعد قليل." };
}

export type LookupResult =
  | {
      ok: true;
      appointment: {
        reference: string;
        status: string;
        treatment: string;
        startsAt: string;
        teeth: string[];
      };
    }
  | { ok: false; error: string };

export async function lookupBooking(input: unknown): Promise<LookupResult> {
  // 1. Rate limiting: max 10 lookup attempts per 5 minutes per IP to prevent probing
  try {
    const headersList = await headers();
    const ip = extractClientIp(headersList);
    const rate = checkRateLimit(`lookupBooking:${ip}`, 10, 300);
    if (!rate.allowed) {
      return {
        ok: false,
        error: `تم تجاوز عدد محاولات الاستعلام المسموح بها. يرجى الانتظار ${Math.ceil(rate.resetSeconds / 60)} دقيقة.`,
      };
    }
  } catch {
    // If headers cannot be inspected (e.g. test runner), proceed safely
  }

  // 2. Strict input validation
  const parsed = bookingLookupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير مكتملة" };
  }

  // 3. Search using keyed HMAC blind index (zero plaintext phone exposure or unindexed queries)
  const phoneBlindIndex = computePhoneBlindIndex(parsed.data.phone);

  const appointment = await prisma.appointment.findFirst({
    where: {
      reference: parsed.data.reference,
      patient: { phoneBlindIndex },
    },
    include: { treatment: true },
  });

  // Same constant-time uniform message whether the reference or the phone is wrong, so references can't be probed.
  if (!appointment) return { ok: false, error: "لا يوجد طلب بهذا الرقم المرجعي ورقم الهاتف." };

  // Minimal necessary information disclosure: never return patient name, notes, or full medical history
  return {
    ok: true,
    appointment: {
      reference: appointment.reference,
      status: appointment.status,
      treatment: appointment.treatment.nameAr,
      startsAt: appointment.startsAt.toISOString(),
      teeth: appointment.teeth,
    },
  };
}
