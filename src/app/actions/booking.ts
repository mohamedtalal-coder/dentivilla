"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { BookingError, createPendingAppointment } from "@/lib/booking";
import type { BookingResult } from "@/lib/booking-types";
import { bookingLookupSchema, bookingSchema } from "@/lib/validations";

export type { BookingResult } from "@/lib/booking-types";

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

/** Postgres exclusion_violation from the Appointment_no_overlap constraint. */
const isOverlapViolation = (error: unknown) =>
  error instanceof Error && /Appointment_no_overlap|23P01|exclusion constraint/i.test(error.message);

export async function submitBooking(input: unknown): Promise<BookingResult> {
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
      console.error("submitBooking failed", error);
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
  const parsed = bookingLookupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير مكتملة" };
  }

  const appointment = await prisma.appointment.findFirst({
    where: { reference: parsed.data.reference, patient: { phone: parsed.data.phone } },
    include: { treatment: true },
  });

  // Same message whether the reference or the phone is wrong, so references can't be probed.
  if (!appointment) return { ok: false, error: "لا يوجد طلب بهذا الرقم المرجعي ورقم الهاتف." };

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
