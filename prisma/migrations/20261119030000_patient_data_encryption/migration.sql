-- DropIndex
DROP INDEX IF EXISTS "Patient_fullName_idx";

-- DropIndex
DROP INDEX IF EXISTS "Patient_phone_key";

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "phoneBlindIndex" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Patient_phoneBlindIndex_key" ON "Patient"("phoneBlindIndex");

-- CreateIndex
CREATE INDEX "Patient_createdAt_idx" ON "Patient"("createdAt");
