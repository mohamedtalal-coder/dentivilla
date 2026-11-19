/**
 * Safe, idempotent migration script to encrypt existing patient records
 * and populate HMAC-SHA-256 blind indexes for exact phone lookup.
 *
 * Usage:
 *   npx tsx scripts/migrate-patient-encryption.ts
 *   npx tsx scripts/migrate-patient-encryption.ts --dry-run
 *   npx tsx scripts/migrate-patient-encryption.ts --rollback (reverts ciphertexts to plaintext)
 */
import { prisma } from "../src/lib/prisma";
import {
  computePhoneBlindIndex,
  decryptField,
  decryptOptional,
  encryptField,
  isEncrypted,
} from "../src/lib/encryption";

const isDryRun = process.argv.includes("--dry-run");
const isRollback = process.argv.includes("--rollback");

async function runMigration() {
  console.log("=================================================");
  console.log(" Dentivilla Patient Data Encryption Migration");
  console.log("=================================================");
  if (isDryRun) console.log(">>> MODE: DRY-RUN (No database writes will occur)");
  if (isRollback) console.log(">>> MODE: ROLLBACK (Decrypting back to plaintext)");

  // 1. Process Patient Records
  const patients = await prisma.patient.findMany();
  console.log(`\nFound ${patients.length} patient records to inspect.`);

  let patientsMigrated = 0;
  let patientsSkipped = 0;

  for (const patient of patients) {
    if (isRollback) {
      const decryptedName = decryptField(patient.fullName);
      const decryptedPhone = decryptField(patient.phone);
      const decryptedWhatsapp = decryptOptional(patient.whatsapp);
      const decryptedNotes = decryptOptional(patient.notes);

      if (!isDryRun) {
        await prisma.patient.update({
          where: { id: patient.id },
          data: {
            fullName: decryptedName,
            phone: decryptedPhone,
            whatsapp: decryptedWhatsapp,
            notes: decryptedNotes,
          },
        });
      }
      patientsMigrated += 1;
      continue;
    }

    const needsEncryption =
      !isEncrypted(patient.fullName) ||
      !isEncrypted(patient.phone) ||
      (patient.whatsapp && !isEncrypted(patient.whatsapp)) ||
      (patient.notes && !isEncrypted(patient.notes)) ||
      !patient.phoneBlindIndex;

    if (!needsEncryption) {
      patientsSkipped += 1;
      continue;
    }

    // Determine plaintext phone to compute blind index
    const plaintextPhone = isEncrypted(patient.phone)
      ? decryptField(patient.phone)
      : patient.phone;

    const blindIndex = computePhoneBlindIndex(plaintextPhone);
    const encryptedFullName = isEncrypted(patient.fullName)
      ? patient.fullName
      : encryptField(patient.fullName);
    const encryptedPhone = isEncrypted(patient.phone)
      ? patient.phone
      : encryptField(patient.phone);
    const encryptedWhatsapp = patient.whatsapp
      ? (isEncrypted(patient.whatsapp) ? patient.whatsapp : encryptField(patient.whatsapp))
      : null;
    const encryptedNotes = patient.notes
      ? (isEncrypted(patient.notes) ? patient.notes : encryptField(patient.notes))
      : null;

    if (!isDryRun) {
      await prisma.patient.update({
        where: { id: patient.id },
        data: {
          fullName: encryptedFullName,
          phone: encryptedPhone,
          phoneBlindIndex: blindIndex,
          whatsapp: encryptedWhatsapp,
          notes: encryptedNotes,
        },
      });
    }

    patientsMigrated += 1;
  }

  console.log(`Patients processed: ${patientsMigrated} updated, ${patientsSkipped} already encrypted/up-to-date.`);

  // 2. Process Appointment Records (Clinical Notes & Conditions)
  const appointments = await prisma.appointment.findMany();
  console.log(`\nFound ${appointments.length} appointment records to inspect.`);

  let appointmentsMigrated = 0;
  let appointmentsSkipped = 0;

  for (const appt of appointments) {
    if (isRollback) {
      const decPatientNotes = decryptOptional(appt.patientNotes);
      const decAdminNotes = decryptOptional(appt.adminNotes);
      const decConditions = appt.medicalConditions.map((c) => (isEncrypted(c) ? decryptField(c) : c));

      if (!isDryRun) {
        await prisma.appointment.update({
          where: { id: appt.id },
          data: {
            patientNotes: decPatientNotes,
            adminNotes: decAdminNotes,
            medicalConditions: decConditions,
          },
        });
      }
      appointmentsMigrated += 1;
      continue;
    }

    const needsApptEncryption =
      (appt.patientNotes && !isEncrypted(appt.patientNotes)) ||
      (appt.adminNotes && !isEncrypted(appt.adminNotes)) ||
      appt.medicalConditions.some((c) => !isEncrypted(c));

    if (!needsApptEncryption) {
      appointmentsSkipped += 1;
      continue;
    }

    const encPatientNotes = appt.patientNotes
      ? (isEncrypted(appt.patientNotes) ? appt.patientNotes : encryptField(appt.patientNotes))
      : null;
    const encAdminNotes = appt.adminNotes
      ? (isEncrypted(appt.adminNotes) ? appt.adminNotes : encryptField(appt.adminNotes))
      : null;
    const encConditions = appt.medicalConditions.map((c) => (isEncrypted(c) ? c : encryptField(c)));

    if (!isDryRun) {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: {
          patientNotes: encPatientNotes,
          adminNotes: encAdminNotes,
          medicalConditions: encConditions,
        },
      });
    }

    appointmentsMigrated += 1;
  }

  console.log(`Appointments processed: ${appointmentsMigrated} updated, ${appointmentsSkipped} already encrypted.`);
  console.log("\n=================================================");
  console.log(" Migration completed successfully!");
  console.log("=================================================");
}

runMigration()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
