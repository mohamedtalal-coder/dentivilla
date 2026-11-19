import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  computePhoneBlindIndex,
  DecryptionError,
  decryptAppointment,
  decryptField,
  decryptOptional,
  decryptPatient,
  encryptField,
  encryptOptional,
  isEncrypted,
  resetKeyStoreCache,
  SecurityConfigurationError,
} from "../src/lib/encryption";
import { checkRateLimit } from "../src/lib/rate-limit";

const TEST_KEY_1 = "a5051309233080aed83139613f34bc36472b40fe444c91e64e896fc3a421346b";
const TEST_KEY_0 = "11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff";
const TEST_BLIND_KEY = "686bc363eaba48cfce53ffd036d5a3f44e7629521937b701ce93c03171d57ac9";

describe("Application-Level Patient Data Encryption (AES-256-GCM)", () => {
  beforeEach(() => {
    process.env.PATIENT_DATA_ENCRYPTION_KEY = TEST_KEY_1;
    process.env.PATIENT_DATA_BLIND_INDEX_KEY = TEST_BLIND_KEY;
    delete process.env.PATIENT_DATA_ENCRYPTION_KEYS_PREVIOUS;
    resetKeyStoreCache();
  });

  it("encrypts and decrypts Arabic patient names accurately", () => {
    const original = "د. محمد ياسر الجبالي";
    const encrypted = encryptField(original);

    assert.ok(isEncrypted(encrypted), "Result should match the encrypted envelope format");
    assert.notEqual(encrypted, original, "Encrypted output must not match plaintext");
    assert.ok(!encrypted.includes("محمد"), "Encrypted text must not contain plaintext Arabic characters");

    const decrypted = decryptField(encrypted);
    assert.equal(decrypted, original, "Decrypted text must match original plaintext");
  });

  it("produces different ciphertexts for the same plaintext due to random IV/nonce", () => {
    const text = "01012345678";
    const enc1 = encryptField(text);
    const enc2 = encryptField(text);

    assert.notEqual(enc1, enc2, "Each encryption must use a unique IV and produce different ciphertext");
    assert.equal(decryptField(enc1), text);
    assert.equal(decryptField(enc2), text);
  });

  it("rejects tampered ciphertext and authentication tags with DecryptionError", () => {
    const text = "بيانات طبية حساسة";
    const encrypted = encryptField(text);
    const parts = encrypted.split(":");

    // Tamper with the ciphertext (last part: parts[5])
    const tamperedData = parts[5].slice(0, -2) + (parts[5].endsWith("A") ? "B" : "A");
    const tamperedPayload = [...parts.slice(0, 5), tamperedData].join(":");

    assert.throws(
      () => decryptField(tamperedPayload),
      (err: unknown) => err instanceof DecryptionError,
      "Tampered ciphertext must fail authentication and throw DecryptionError",
    );

    // Tamper with the auth tag (parts[4])
    const tamperedTag = parts[4].slice(0, -2) + (parts[4].endsWith("Z") ? "X" : "Z");
    const tamperedTagPayload = [parts[0], parts[1], parts[2], parts[3], tamperedTag, parts[5]].join(":");

    assert.throws(
      () => decryptField(tamperedTagPayload),
      (err: unknown) => err instanceof DecryptionError,
      "Tampered auth tag must fail authentication and throw DecryptionError",
    );
  });

  it("fails safely if PATIENT_DATA_ENCRYPTION_KEY is missing or invalid", () => {
    delete process.env.PATIENT_DATA_ENCRYPTION_KEY;
    resetKeyStoreCache();

    assert.throws(
      () => encryptField("test"),
      (err: unknown) => err instanceof SecurityConfigurationError,
      "Missing encryption key must throw SecurityConfigurationError",
    );

    // Invalid length key (less than 32 bytes)
    process.env.PATIENT_DATA_ENCRYPTION_KEY = "too-short-key";
    resetKeyStoreCache();

    assert.throws(
      () => encryptField("test"),
      (err: unknown) => err instanceof SecurityConfigurationError,
      "Invalid length key must throw SecurityConfigurationError",
    );
  });

  it("supports future key rotation using key identifiers and previous keys", () => {
    // Encrypt with key k0
    process.env.PATIENT_DATA_ENCRYPTION_KEY = `k0:${TEST_KEY_0}`;
    resetKeyStoreCache();
    const legacyEncrypted = encryptField("سجل قديم قبل تدوير المفاتيح");
    assert.ok(legacyEncrypted.startsWith("enc:v1:k0:"));

    // Rotate active key to k1, keeping k0 in previous keys
    process.env.PATIENT_DATA_ENCRYPTION_KEY = `k1:${TEST_KEY_1}`;
    process.env.PATIENT_DATA_ENCRYPTION_KEYS_PREVIOUS = `k0:${TEST_KEY_0}`;
    resetKeyStoreCache();

    // Must be able to decrypt the record created with previous key k0
    const decryptedLegacy = decryptField(legacyEncrypted);
    assert.equal(decryptedLegacy, "سجل قديم قبل تدوير المفاتيح");

    // New encryptions must use the new active key k1
    const newEncrypted = encryptField("سجل جديد");
    assert.ok(newEncrypted.startsWith("enc:v1:k1:"));
    assert.equal(decryptField(newEncrypted), "سجل جديد");
  });

  it("computes deterministic keyed HMAC-SHA-256 blind index for normalized phone numbers", () => {
    const raw1 = "01012345678";
    const raw2 = "+20 10 1234 5678";
    const raw3 = "٠١٠١٢٣٤٥٦٧٨"; // Arabic-Indic digits

    const index1 = computePhoneBlindIndex(raw1);
    const index2 = computePhoneBlindIndex(raw2);
    const index3 = computePhoneBlindIndex(raw3);

    // All variations of the same phone number must yield the exact same blind index
    assert.equal(index1, index2);
    assert.equal(index1, index3);
    assert.equal(index1.length, 64, "HMAC-SHA-256 hex digest should be 64 characters");

    // A different phone number must yield a completely different blind index
    const otherIndex = computePhoneBlindIndex("01198765432");
    assert.notEqual(index1, otherIndex);
  });

  it("decrypts patient and appointment structures cleanly", () => {
    const patient = {
      fullName: encryptField("أحمد علي"),
      phone: encryptField("01012345678"),
      whatsapp: encryptField("01012345678"),
      notes: null,
    };

    const decryptedP = decryptPatient(patient);
    assert.equal(decryptedP.fullName, "أحمد علي");
    assert.equal(decryptedP.phone, "01012345678");
    assert.equal(decryptedP.whatsapp, "01012345678");

    const appointment = {
      patientNotes: encryptField("ألم مستمر في الضرس الخلفي"),
      adminNotes: encryptField("تم حجز موعد متابعة"),
      medicalConditions: [encryptField("hypertension"), encryptField("aspirin")],
    };

    const decryptedA = decryptAppointment(appointment);
    assert.equal(decryptedA.patientNotes, "ألم مستمر في الضرس الخلفي");
    assert.equal(decryptedA.adminNotes, "تم حجز موعد متابعة");
    assert.deepEqual(decryptedA.medicalConditions, ["hypertension", "aspirin"]);
  });

  it("does not double-encrypt already encrypted ciphertext", () => {
    const original = "مريض تجريبي";
    const enc1 = encryptField(original);
    const enc2 = encryptField(enc1);

    assert.equal(enc1, enc2, "Calling encryptField on already encrypted text must return it untouched");
    assert.equal(decryptField(enc2), original);
  });

  it("safely handles null and empty optional fields", () => {
    assert.equal(encryptOptional(null), null);
    assert.equal(encryptOptional(undefined), null);
    assert.equal(encryptOptional(""), null);

    assert.equal(decryptOptional(null), null);
    assert.equal(decryptOptional(undefined), null);
    assert.equal(decryptOptional(""), null);
  });

  it("enforces sliding-window rate limiting per client key", () => {
    const testKey = `test-ip-${Date.now()}`;

    // Limit to 3 calls per 60 seconds
    const r1 = checkRateLimit(testKey, 3, 60);
    assert.equal(r1.allowed, true);
    assert.equal(r1.remaining, 2);

    const r2 = checkRateLimit(testKey, 3, 60);
    assert.equal(r2.allowed, true);
    assert.equal(r2.remaining, 1);

    const r3 = checkRateLimit(testKey, 3, 60);
    assert.equal(r3.allowed, true);
    assert.equal(r3.remaining, 0);

    // 4th call must be blocked
    const r4 = checkRateLimit(testKey, 3, 60);
    assert.equal(r4.allowed, false);
    assert.equal(r4.remaining, 0);
    assert.ok(r4.resetSeconds > 0);
  });
});
