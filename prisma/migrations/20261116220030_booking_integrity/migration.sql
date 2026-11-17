-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "medicalConditions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "AvailabilitySettings" ALTER COLUMN "slotMinutes" SET DEFAULT 15;

-- CreateIndex
CREATE INDEX "BlockedPeriod_startsAt_endsAt_idx" ON "BlockedPeriod"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "ExtraSlot_startsAt_endsAt_idx" ON "ExtraSlot"("startsAt", "endsAt");

-- Data-level guarantee: two held appointments (PENDING / CONFIRMED) can never overlap,
-- even if application code or a manual edit tries to create one.
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_no_overlap"
  EXCLUDE USING gist (tsrange("startsAt", "endsAt", '[)') WITH &&)
  WHERE ("status" IN ('PENDING', 'CONFIRMED'));

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_valid_range" CHECK ("endsAt" > "startsAt");
ALTER TABLE "BlockedPeriod"
  ADD CONSTRAINT "BlockedPeriod_valid_range" CHECK ("endsAt" > "startsAt");
ALTER TABLE "ExtraSlot"
  ADD CONSTRAINT "ExtraSlot_valid_range" CHECK ("endsAt" > "startsAt");
