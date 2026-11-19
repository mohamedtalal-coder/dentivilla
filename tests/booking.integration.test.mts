/**
 * Database integration tests for the booking engine.
 * Run against a disposable database only:
 *   TEST_DATABASE_URL=postgresql://…/dentivilla_test npm run test:integration
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

const url = process.env.TEST_DATABASE_URL;
if (!url || !/_test(\?|$)/.test(new URL(url).pathname + new URL(url).search)) {
  throw new Error("Set TEST_DATABASE_URL to a database whose name ends in _test (refusing to touch real data).");
}
process.env.DATABASE_URL = url;

const { prisma } = await import("../src/lib/prisma");
const booking = await import("../src/lib/booking");
const { addDaysYmd } = await import("../src/lib/availability");
const { cairoYmd } = await import("../src/lib/datetime");
const { computePhoneBlindIndex, encryptField } = await import("../src/lib/encryption");

const PHONE_PREFIX = "0109"; // test patients: 0109XXXXXXX
const testBlindIndexes = [
  ...Array.from({ length: 100 }, (_, n) => computePhoneBlindIndex(`${PHONE_PREFIX}${String(1000000 + n).slice(-7)}`)),
  computePhoneBlindIndex(`${PHONE_PREFIX}9999999`),
];
let treatment: { id: string; durationMinutes: number };
let day: string;

async function cleanup() {
  await prisma.appointment.deleteMany({ where: { patient: { phoneBlindIndex: { in: testBlindIndexes } } } });
  await prisma.patient.deleteMany({ where: { phoneBlindIndex: { in: testBlindIndexes } } });
  await prisma.blockedPeriod.deleteMany({ where: { reason: "integration-test" } });
}

const newBooking = (startsAt: Date, n: number) => ({
  treatment,
  startsAt,
  teeth: [],
  fullName: `Integration ${n}`,
  phone: `${PHONE_PREFIX}${String(1000000 + n).slice(-7)}`,
  medicalConditions: [],
});

before(async () => {
  await cleanup();
  const consult = await prisma.treatment.findUniqueOrThrow({ where: { slug: "consultation" } });
  treatment = { id: consult.id, durationMinutes: consult.durationMinutes };
  // first future day (≥ 5 days out) that has at least 4 slots
  for (let i = 5; i < 25; i += 1) {
    const ymd = addDaysYmd(cairoYmd(new Date()), i);
    if ((await booking.listPublicSlots(ymd, treatment.durationMinutes)).length >= 4) {
      day = ymd;
      break;
    }
  }
  assert.ok(day, "no bookable day found in test data");
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("booking engine against PostgreSQL", () => {
  it("concurrent requests for the same slot: exactly one succeeds", async () => {
    const [slot] = await booking.listPublicSlots(day, treatment.durationMinutes);
    const startsAt = new Date(slot.startsAt);
    const outcomes = await Promise.allSettled(
      Array.from({ length: 8 }, (_, n) => booking.createPendingAppointment(newBooking(startsAt, n))),
    );
    const ok = outcomes.filter((o) => o.status === "fulfilled");
    const rejected = outcomes.filter((o): o is PromiseRejectedResult => o.status === "rejected");
    assert.equal(ok.length, 1, `expected 1 success, got ${ok.length}`);
    for (const r of rejected) {
      assert.ok(r.reason instanceof booking.BookingError, String(r.reason));
      assert.equal(r.reason.code, "SLOT_TAKEN");
    }
    const after = await booking.listPublicSlots(day, treatment.durationMinutes);
    assert.ok(!after.some((s) => s.startsAt === slot.startsAt), "booked slot still offered");
  });

  it("the buffer is enforced: neighbouring starts inside it are no longer offered or bookable", async () => {
    const settings = await prisma.availabilitySettings.findUniqueOrThrow({ where: { id: "default" } });
    const held = await prisma.appointment.findFirstOrThrow({
      where: { patient: { phoneBlindIndex: { in: testBlindIndexes } }, status: "PENDING" },
    });
    const offered = await booking.listPublicSlots(day, treatment.durationMinutes);
    const bufferMs = settings.bufferMinutes * 60_000;
    for (const s of offered) {
      const start = new Date(s.startsAt).getTime();
      const end = new Date(s.endsAt).getTime();
      const clear = end + bufferMs <= held.startsAt.getTime() || start >= held.endsAt.getTime() + bufferMs;
      assert.ok(clear, `slot ${s.label} violates the ${settings.bufferMinutes}-minute buffer`);
    }
    // try to force a start that ends right when the held one begins (inside the buffer when buffer > 0)
    if (settings.bufferMinutes > 0) {
      const tooClose = new Date(held.startsAt.getTime() - treatment.durationMinutes * 60_000);
      await assert.rejects(booking.createPendingAppointment(newBooking(tooClose, 50)), (e: unknown) => {
        return e instanceof booking.BookingError;
      });
    }
  });

  it("blocked periods remove slots and reject direct booking attempts", async () => {
    const slots = await booking.listPublicSlots(day, treatment.durationMinutes);
    const target = slots[slots.length - 1];
    await prisma.blockedPeriod.create({
      data: { startsAt: new Date(target.startsAt), endsAt: new Date(target.endsAt), reason: "integration-test" },
    });
    const afterBlock = await booking.listPublicSlots(day, treatment.durationMinutes);
    assert.ok(!afterBlock.some((s) => s.startsAt === target.startsAt), "blocked slot still offered");
    await assert.rejects(booking.createPendingAppointment(newBooking(new Date(target.startsAt), 60)), (e: unknown) => {
      return e instanceof booking.BookingError && e.code === "SLOT_INVALID";
    });
  });

  it("off-grid and out-of-hours start times are rejected", async () => {
    const [slot] = await booking.listPublicSlots(day, treatment.durationMinutes);
    const offGrid = new Date(new Date(slot.startsAt).getTime() + 7 * 60_000);
    await assert.rejects(booking.createPendingAppointment(newBooking(offGrid, 70)), booking.BookingError);
    const midnight = new Date(`${day}T00:00:00+02:00`);
    await assert.rejects(booking.createPendingAppointment(newBooking(midnight, 71)), booking.BookingError);
  });

  it("cancelling a held appointment frees its time again", async () => {
    const held = await prisma.appointment.findFirstOrThrow({
      where: { patient: { phoneBlindIndex: { in: testBlindIndexes } }, status: "PENDING" },
    });
    await prisma.appointment.update({ where: { id: held.id }, data: { status: "CANCELLED" } });
    const slots = await booking.listPublicSlots(day, treatment.durationMinutes);
    assert.ok(slots.some((s) => s.startsAt === held.startsAt.toISOString()), "cancelled time not offered again");
  });

  it("the database itself refuses overlapping held appointments (exclusion constraint)", async () => {
    const phone99 = `${PHONE_PREFIX}9999999`;
    const patient = await prisma.patient.create({
      data: {
        fullName: encryptField("Constraint"),
        phone: encryptField(phone99),
        phoneBlindIndex: computePhoneBlindIndex(phone99),
      },
    });
    const start = new Date(`${addDaysYmd(day, 1)}T09:00:00Z`);
    const base = {
      patientId: patient.id,
      treatmentId: treatment.id,
      startsAt: start,
      endsAt: new Date(start.getTime() + 60 * 60_000),
      status: "CONFIRMED" as const,
    };
    await prisma.appointment.create({ data: { ...base, reference: booking.createReference() } });
    await assert.rejects(
      prisma.appointment.create({
        data: { ...base, reference: booking.createReference(), startsAt: new Date(start.getTime() + 30 * 60_000) },
      }),
      /Appointment_no_overlap|exclusion/i,
    );
    // …but a cancelled/rejected record may share the time
    await prisma.appointment.create({ data: { ...base, reference: booking.createReference(), status: "CANCELLED" } });
  });
});
