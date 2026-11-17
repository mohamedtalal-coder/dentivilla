-- Idempotent copy of the raw-SQL guarantees from 20261116220030_booking_integrity.
-- Used when an existing database is baselined (it was created with `db push`,
-- which cannot create these constraints). Safe to run any number of times.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_no_overlap') THEN
    ALTER TABLE "Appointment"
      ADD CONSTRAINT "Appointment_no_overlap"
      EXCLUDE USING gist (tsrange("startsAt", "endsAt", '[)') WITH &&)
      WHERE ("status" IN ('PENDING', 'CONFIRMED'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_valid_range') THEN
    ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_valid_range" CHECK ("endsAt" > "startsAt");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BlockedPeriod_valid_range') THEN
    ALTER TABLE "BlockedPeriod" ADD CONSTRAINT "BlockedPeriod_valid_range" CHECK ("endsAt" > "startsAt");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExtraSlot_valid_range') THEN
    ALTER TABLE "ExtraSlot" ADD CONSTRAINT "ExtraSlot_valid_range" CHECK ("endsAt" > "startsAt");
  END IF;
END $$;
