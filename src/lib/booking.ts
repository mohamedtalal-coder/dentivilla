import { randomInt } from "node:crypto";
import type { AppointmentStatus, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cairoYmd, formatCairoTime } from "@/lib/datetime";
import {
  addDaysYmd,
  computeDaySlots,
  countSlotsByDay,
  dataRangeForDays,
  lastBookableYmd,
  overlaps,
  type AvailabilityData,
  type Interval,
  type SlotOptions,
} from "@/lib/availability";
import type { PublicSlot } from "@/lib/booking-types";

export type { PublicSlot } from "@/lib/booking-types";

export const HOLDING_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED"];

type Db = PrismaClient | Prisma.TransactionClient;

export class BookingError extends Error {
  constructor(
    message: string,
    readonly code: "SLOT_TAKEN" | "SLOT_INVALID" | "NOT_FOUND" | "CONFIG",
  ) {
    super(message);
  }
}

/** Serialises all booking writes. A dental clinic's write volume makes a single lock the simplest correct choice. */
const BOOKING_LOCK_KEY = 74_201_771;

export async function lockBookings(tx: Prisma.TransactionClient) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BOOKING_LOCK_KEY})`;
}

/** Loads everything the engine needs for a UTC range (already padded by the caller). */
export async function loadAvailabilityData(
  range: Interval,
  db: Db = prisma,
  ignoreAppointmentId?: string,
): Promise<AvailabilityData> {
  const [settings, workingHours, blocked, extra, busy] = await Promise.all([
    db.availabilitySettings.findUnique({ where: { id: "default" } }),
    db.workingHours.findMany(),
    db.blockedPeriod.findMany({
      where: { startsAt: { lt: range.end }, endsAt: { gt: range.start } },
      select: { startsAt: true, endsAt: true },
    }),
    db.extraSlot.findMany({
      where: { startsAt: { lt: range.end }, endsAt: { gt: range.start } },
      select: { startsAt: true, endsAt: true },
    }),
    db.appointment.findMany({
      where: {
        status: { in: HOLDING_STATUSES },
        startsAt: { lt: range.end },
        endsAt: { gt: range.start },
        ...(ignoreAppointmentId ? { id: { not: ignoreAppointmentId } } : {}),
      },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  if (!settings) throw new BookingError("إعدادات المواعيد غير موجودة", "CONFIG");

  return {
    rules: settings,
    workingHours,
    blocked: blocked.map((b) => ({ start: b.startsAt, end: b.endsAt })),
    extra: extra.map((e) => ({ start: e.startsAt, end: e.endsAt })),
    busy: busy.map((a) => ({ start: a.startsAt, end: a.endsAt })),
  };
}

async function bufferPadding(db: Db) {
  const settings = await db.availabilitySettings.findUnique({ where: { id: "default" } });
  return (settings?.bufferMinutes ?? 0) + 24 * 60;
}

function toPublic(slot: Interval): PublicSlot {
  return { startsAt: slot.start.toISOString(), endsAt: slot.end.toISOString(), label: formatCairoTime(slot.start) };
}

export async function listPublicSlots(ymd: string, durationMinutes: number, options?: Partial<SlotOptions>) {
  const data = await loadAvailabilityData(dataRangeForDays(ymd, ymd, await bufferPadding(prisma)));
  return computeDaySlots(ymd, durationMinutes, data, { now: new Date(), ...options }).map(toPublic);
}

/** Per-day slot counts for a calendar month, clipped to [today, last bookable day]. */
export async function monthAvailability(month: string, durationMinutes: number) {
  const now = new Date();
  const settings = await prisma.availabilitySettings.findUnique({ where: { id: "default" } });
  if (!settings) throw new BookingError("إعدادات المواعيد غير موجودة", "CONFIG");

  const today = cairoYmd(now);
  const lastDate = lastBookableYmd(settings, now);
  const monthStart = `${month}-01`;
  const monthEnd = addDaysYmd(addDaysYmd(monthStart, 31).slice(0, 7) + "-01", -1);
  const from = monthStart < today ? today : monthStart;
  const to = monthEnd > lastDate ? lastDate : monthEnd;

  if (from > to) return { today, lastDate, days: {} as Record<string, number> };

  const data = await loadAvailabilityData(dataRangeForDays(from, to, settings.bufferMinutes + 24 * 60));
  return { today, lastDate, days: countSlotsByDay(from, to, durationMinutes, data, { now }) };
}

/**
 * Throws BookingError unless [startsAt, startsAt + duration) is a currently
 * offered slot. Pass the transaction client to evaluate under the booking lock.
 */
export async function assertSlotAvailable(
  startsAt: Date,
  durationMinutes: number,
  options: { db?: Db; ignoreAppointmentId?: string; admin?: boolean } = {},
) {
  const db = options.db ?? prisma;
  const ymd = cairoYmd(startsAt);
  const data = await loadAvailabilityData(
    dataRangeForDays(ymd, ymd, await bufferPadding(db)),
    db,
    options.ignoreAppointmentId,
  );
  const slotOptions: SlotOptions = { now: new Date(), ignoreLead: options.admin, ignoreHorizon: options.admin };
  const offered = computeDaySlots(ymd, durationMinutes, data, slotOptions);
  if (offered.some((slot) => slot.start.getTime() === startsAt.getTime())) return;

  // Explain why, so the patient gets a useful message.
  const end = new Date(startsAt.getTime() + durationMinutes * 60_000);
  const taken = data.busy.some((busy) =>
    overlaps({ start: startsAt, end }, {
      start: new Date(busy.start.getTime() - data.rules.bufferMinutes * 60_000),
      end: new Date(busy.end.getTime() + data.rules.bufferMinutes * 60_000),
    }),
  );
  if (taken) throw new BookingError("عذراً، حُجز هذا الوقت للتو. اختر وقتاً آخر.", "SLOT_TAKEN");
  throw new BookingError("هذا الوقت لم يعد متاحاً للحجز. اختر وقتاً آخر.", "SLOT_INVALID");
}

/** Conflict check for confirming an existing request: overlap (with buffer) or blocked time only. */
export async function findConflict(
  startsAt: Date,
  endsAt: Date,
  ignoreAppointmentId: string,
  db: Db = prisma,
): Promise<string | null> {
  const settings = await db.availabilitySettings.findUnique({ where: { id: "default" } });
  const buffer = (settings?.bufferMinutes ?? 0) * 60_000;
  const clash = await db.appointment.findFirst({
    where: {
      id: { not: ignoreAppointmentId },
      status: { in: HOLDING_STATUSES },
      startsAt: { lt: new Date(endsAt.getTime() + buffer) },
      endsAt: { gt: new Date(startsAt.getTime() - buffer) },
    },
    select: { reference: true },
  });
  if (clash) return `يتعارض مع الموعد ${clash.reference}`;
  const blocked = await db.blockedPeriod.findFirst({
    where: { startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
    select: { reason: true },
  });
  if (blocked) return `يقع في فترة محجوبة (${blocked.reason})`;
  return null;
}

export type NewBooking = {
  treatment: { id: string; durationMinutes: number };
  startsAt: Date;
  teeth: string[];
  fullName: string;
  phone: string;
  whatsapp?: string;
  notes?: string;
  medicalConditions: string[];
};

/**
 * Creates a PENDING appointment atomically: takes the booking lock, re-checks
 * the slot against live data, upserts the patient and inserts the appointment.
 * Throws BookingError("SLOT_TAKEN" | "SLOT_INVALID") when the time is no longer offered.
 */
export async function createPendingAppointment(input: NewBooking, db: PrismaClient = prisma) {
  const endsAt = new Date(input.startsAt.getTime() + input.treatment.durationMinutes * 60_000);
  return db.$transaction(async (tx) => {
    await lockBookings(tx);
    await assertSlotAvailable(input.startsAt, input.treatment.durationMinutes, { db: tx });

    const patient = await tx.patient.upsert({
      where: { phone: input.phone },
      update: { fullName: input.fullName, notes: null },
      create: { fullName: input.fullName, phone: input.phone },
    });

    return tx.appointment.create({
      data: {
        reference: createReference(),
        patientId: patient.id,
        treatmentId: input.treatment.id,
        teeth: input.teeth,
        startsAt: input.startsAt,
        endsAt,
        status: "PENDING",
        patientNotes: input.notes || null,
        medicalConditions: input.medicalConditions,
      },
    });
  });
}

const REFERENCE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O/1/I

export function createReference() {
  let code = "";
  for (let i = 0; i < 6; i += 1) code += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return `DV-${code}`;
}
