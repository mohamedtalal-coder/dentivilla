import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";
import { normalizeEgyptianMobile, toLatinDigits } from "@/lib/phone";

export class SecurityConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SecurityConfigurationError";
  }
}

export class DecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DecryptionError";
  }
}

const ENVELOPE_PREFIX = "enc:v1";
const DEFAULT_KEY_ID = "k1";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH_BYTES = 16; // 128 bits authentication tag

type KeyStore = {
  activeKeyId: string;
  keys: Map<string, Buffer>;
  blindIndexKey: Buffer;
};

let cachedKeyStore: KeyStore | null = null;

/**
 * Parses a 32-byte key string (either 64 hex characters or 44/43 base64 characters).
 */
function parseKeyBuffer(rawKey: string, keyName: string): Buffer {
  const trimmed = rawKey.trim();
  let buf: Buffer;

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    buf = Buffer.from(trimmed, "hex");
  } else {
    try {
      buf = Buffer.from(trimmed, "base64");
    } catch {
      throw new SecurityConfigurationError(
        `Invalid format for ${keyName}: Expected 32-byte hex (64 chars) or base64.`,
      );
    }
  }

  if (buf.length !== 32) {
    throw new SecurityConfigurationError(
      `Invalid key length for ${keyName}: Expected 32 bytes (256 bits), got ${buf.length} bytes.`,
    );
  }

  return buf;
}

/**
 * Initializes and validates encryption keys from environment variables.
 * Fails safely and immediately if keys are missing or malformed.
 */
export function getKeyStore(): KeyStore {
  if (cachedKeyStore) return cachedKeyStore;

  const rawEncKey = process.env.PATIENT_DATA_ENCRYPTION_KEY;
  if (!rawEncKey || !rawEncKey.trim()) {
    throw new SecurityConfigurationError(
      "PATIENT_DATA_ENCRYPTION_KEY is required but not configured. Application cannot process patient data.",
    );
  }

  const keys = new Map<string, Buffer>();
  let activeKeyId = DEFAULT_KEY_ID;

  // Active key can optionally be formatted as "keyId:keyString"
  let activeKeyStr = rawEncKey.trim();
  if (activeKeyStr.includes(":")) {
    const [id, ...rest] = activeKeyStr.split(":");
    activeKeyId = id.trim();
    activeKeyStr = rest.join(":");
  }

  const activeKeyBuf = parseKeyBuffer(activeKeyStr, "PATIENT_DATA_ENCRYPTION_KEY");
  keys.set(activeKeyId, activeKeyBuf);

  // Optional previous keys for rotation: "k0:hex...,k_old:hex..."
  const previousKeys = process.env.PATIENT_DATA_ENCRYPTION_KEYS_PREVIOUS;
  if (previousKeys) {
    for (const item of previousKeys.split(",")) {
      const part = item.trim();
      if (!part) continue;
      if (!part.includes(":")) {
        throw new SecurityConfigurationError(
          "PATIENT_DATA_ENCRYPTION_KEYS_PREVIOUS entries must be formatted as 'keyId:keyValue'.",
        );
      }
      const [id, ...rest] = part.split(":");
      const keyBuf = parseKeyBuffer(rest.join(":"), `previous key '${id}'`);
      keys.set(id.trim(), keyBuf);
    }
  }

  // Blind index key for keyed HMAC-SHA-256
  const rawBlindKey = process.env.PATIENT_DATA_BLIND_INDEX_KEY;
  let blindIndexKey: Buffer;
  if (rawBlindKey && rawBlindKey.trim()) {
    blindIndexKey = parseKeyBuffer(rawBlindKey, "PATIENT_DATA_BLIND_INDEX_KEY");
  } else {
    // If not separately provided, cryptographically derive using HKDF-SHA256 from the active master key
    // with a strict domain-separation context info string.
    blindIndexKey = Buffer.from(
      hkdfSync(
        "sha256",
        activeKeyBuf,
        Buffer.from("dentivilla-patient-blind-index-salt-v1", "utf8"),
        Buffer.from("dentivilla-phone-blind-index-v1", "utf8"),
        32,
      ),
    );
  }

  cachedKeyStore = {
    activeKeyId,
    keys,
    blindIndexKey,
  };

  return cachedKeyStore;
}

/**
 * Resets cached keystore (used primarily for unit testing key rotations/errors).
 */
export function resetKeyStoreCache(): void {
  cachedKeyStore = null;
}

/**
 * Checks whether a given string is already encrypted in the versioned envelope format.
 */
export function isEncrypted(value?: string | null): boolean {
  if (!value || typeof value !== "string") return false;
  return value.startsWith(`${ENVELOPE_PREFIX}:`);
}

/**
 * Encrypts a plaintext string using AES-256-GCM with a unique 96-bit random IV.
 * Returns a versioned envelope string: enc:v1:<keyId>:<iv_b64url>:<tag_b64url>:<ciphertext_b64url>
 */
export function encryptField(plaintext: string): string {
  if (plaintext === "") return "";
  if (isEncrypted(plaintext)) return plaintext;

  const { activeKeyId, keys } = getKeyStore();
  const key = keys.get(activeKeyId);
  if (!key) {
    throw new SecurityConfigurationError(`Active encryption key '${activeKeyId}' not found.`);
  }

  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    ENVELOPE_PREFIX,
    activeKeyId,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

/**
 * Decrypts a versioned AES-256-GCM envelope string.
 * Throws DecryptionError if the ciphertext was tampered with, corrupted, or used an unknown key.
 */
export function decryptField(ciphertext: string): string {
  if (ciphertext === "") return "";
  if (!isEncrypted(ciphertext)) {
    // If not encrypted (e.g. legacy records prior to migration), return as-is
    return ciphertext;
  }

  const parts = ciphertext.split(":");
  // Format: enc:v1:<keyId>:<iv_b64url>:<tag_b64url>:<ciphertext_b64url> (6 colon-delimited tokens)
  if (parts.length !== 6 || parts[0] !== "enc" || parts[1] !== "v1") {
    throw new DecryptionError("Malformed encrypted envelope format.");
  }

  const [, , keyId, ivStr, tagStr, dataStr] = parts;
  const { keys } = getKeyStore();
  const key = keys.get(keyId);
  if (!key) {
    throw new DecryptionError(`Cannot decrypt: Encryption key '${keyId}' is not available.`);
  }

  try {
    const iv = Buffer.from(ivStr, "base64url");
    const authTag = Buffer.from(tagStr, "base64url");
    const data = Buffer.from(dataStr, "base64url");

    if (iv.length !== IV_LENGTH_BYTES || authTag.length !== AUTH_TAG_LENGTH_BYTES) {
      throw new DecryptionError("Invalid IV or authentication tag length.");
    }

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
    return plaintext.toString("utf8");
  } catch (error) {
    if (error instanceof DecryptionError) throw error;
    throw new DecryptionError("Decryption failed: Ciphertext or authentication tag was tampered with.");
  }
}

/**
 * Encrypts an optional string, returning null if input is null or undefined.
 */
export function encryptOptional(value?: string | null): string | null {
  if (value === null || value === undefined || value === "") return null;
  return encryptField(value);
}

/**
 * Decrypts an optional string, returning null if input is null or undefined.
 */
export function decryptOptional(value?: string | null): string | null {
  if (value === null || value === undefined || value === "") return null;
  return decryptField(value);
}

/**
 * Computes a keyed HMAC-SHA-256 blind index for exact phone number search and uniqueness.
 * Always normalizes the phone number first to the canonical Egyptian 11-digit mobile format (01XXXXXXXXX).
 */
export function computePhoneBlindIndex(phone: string): string {
  const normalized = normalizeEgyptianMobile(phone) || toLatinDigits(phone).replace(/\D/g, "");
  const { blindIndexKey } = getKeyStore();

  return createHmac("sha256", blindIndexKey)
    .update(`dentivilla:patient:phone:${normalized}`, "utf8")
    .digest("hex");
}

/**
 * Decrypts a Patient record's sensitive fields.
 */
export function decryptPatient<T extends { fullName: string; phone: string; whatsapp?: string | null; notes?: string | null }>(
  patient: T,
): T {
  return {
    ...patient,
    fullName: decryptField(patient.fullName),
    phone: decryptField(patient.phone),
    whatsapp: decryptOptional(patient.whatsapp),
    notes: decryptOptional(patient.notes),
  };
}

/**
 * Decrypts an Appointment record's sensitive fields.
 */
export function decryptAppointment<
  T extends {
    patientNotes?: string | null;
    adminNotes?: string | null;
    medicalConditions?: string[];
  },
>(appointment: T): T {
  return {
    ...appointment,
    patientNotes: decryptOptional(appointment.patientNotes),
    adminNotes: decryptOptional(appointment.adminNotes),
    medicalConditions: appointment.medicalConditions
      ? appointment.medicalConditions.map((c) => (isEncrypted(c) ? decryptField(c) : c))
      : [],
  };
}

/**
 * Decrypts an Appointment along with its attached Patient record.
 */
export function decryptAppointmentWithPatient<
  T extends {
    patient: { fullName: string; phone: string; whatsapp?: string | null; notes?: string | null };
    patientNotes?: string | null;
    adminNotes?: string | null;
    medicalConditions?: string[];
  },
>(appointment: T): T {
  return {
    ...decryptAppointment(appointment),
    patient: decryptPatient(appointment.patient),
  };
}
