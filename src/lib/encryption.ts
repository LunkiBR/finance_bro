import crypto from "crypto";

// ─── Configuration ──────────────────────────────────────────────────────────

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag
const SEPARATOR = ":";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-char hex string (32 bytes). " +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(hex, "hex");
}

// ─── Core encrypt / decrypt ─────────────────────────────────────────────────

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(SEPARATOR);
}

export function decrypt(encryptedStr: string): string {
  const key = getKey();
  const parts = encryptedStr.split(SEPARATOR);
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format — expected iv:authTag:ciphertext");
  }
  const [ivB64, authTagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

// ─── Numeric helpers ────────────────────────────────────────────────────────

export function encryptNumber(value: number): string {
  return encrypt(String(value));
}

export function decryptNumber(encryptedStr: string): number {
  return parseFloat(decrypt(encryptedStr));
}

// ─── Detection ──────────────────────────────────────────────────────────────

const B64_CHAR = "[A-Za-z0-9+/=]";
const ENCRYPTED_REGEX = new RegExp(
  `^${B64_CHAR}+:${B64_CHAR}+:${B64_CHAR}+$`
);

export function isEncrypted(value: unknown): boolean {
  if (typeof value !== "string" || !value) return false;
  if (!ENCRYPTED_REGEX.test(value)) return false;
  const parts = value.split(SEPARATOR);
  if (parts.length !== 3) return false;
  // IV should decode to 12 bytes, auth tag to 16 bytes
  try {
    const ivLen = Buffer.from(parts[0], "base64").length;
    const tagLen = Buffer.from(parts[1], "base64").length;
    return ivLen === IV_LENGTH && tagLen === AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}

// ─── Safe decrypt (handles plaintext gracefully during migration) ───────────

export function safeDecrypt(value: string | null | undefined): string {
  if (value == null) return "";
  if (!isEncrypted(value)) return value; // plaintext passthrough
  return decrypt(value);
}

export function safeDecryptNumber(value: string | null | undefined): number {
  if (value == null) return 0;
  if (!isEncrypted(value)) return parseFloat(value) || 0;
  return decryptNumber(value);
}

// ─── Deterministic hash (for unique indexes on encrypted fields) ────────────

export function deterministicHash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

// ─── Batch helpers ──────────────────────────────────────────────────────────

/** Encrypted field map per table */
export const ENCRYPTED_FIELDS = {
  ff_transactions: {
    text: ["description", "beneficiary"] as const,
    numeric: ["amount"] as const,
  },
  ff_budgets: {
    numeric: ["limitAmount", "spentAmount"] as const,
  },
  ff_goals: {
    text: ["name"] as const,
    numeric: ["targetAmount", "currentAmount"] as const,
  },
  ff_chat_messages: {
    text: ["content"] as const,
    json: ["chartSpec"] as const,
  },
  ff_payee_mappings: {
    text: ["beneficiaryNormalized", "beneficiaryDisplay"] as const,
  },
  ff_payee_notes: {
    text: ["note"] as const,
  },
  ff_user_profile: {
    text: ["nome", "aiNotes", "objetivoPrincipal"] as const,
    numeric: ["rendaMensal", "dividaMensal"] as const,
  },
  ff_ai_summaries: {
    text: ["content"] as const,
  },
  ff_alerts: {
    text: ["message"] as const,
  },
} as const;

type AnyRecord = Record<string, unknown>;

/** Encrypt specified text and numeric fields on an object (mutates a copy) */
export function encryptFields<T extends AnyRecord>(
  obj: T,
  spec: { text?: readonly string[]; numeric?: readonly string[]; json?: readonly string[] }
): T {
  const result = { ...obj };
  for (const field of spec.text ?? []) {
    const val = result[field];
    if (typeof val === "string" && val && !isEncrypted(val)) {
      (result as AnyRecord)[field] = encrypt(val);
    }
  }
  for (const field of spec.numeric ?? []) {
    const val = result[field];
    if (val != null && !isEncrypted(String(val))) {
      (result as AnyRecord)[field] = encryptNumber(Number(val));
    }
  }
  for (const field of spec.json ?? []) {
    const val = result[field];
    if (val != null) {
      const str = typeof val === "string" ? val : JSON.stringify(val);
      if (!isEncrypted(str)) {
        (result as AnyRecord)[field] = encrypt(str);
      }
    }
  }
  return result;
}

/** Decrypt specified text and numeric fields on an object (mutates a copy) */
export function decryptFields<T extends AnyRecord>(
  obj: T,
  spec: { text?: readonly string[]; numeric?: readonly string[]; json?: readonly string[] }
): T {
  const result = { ...obj };
  for (const field of spec.text ?? []) {
    const val = result[field];
    if (typeof val === "string") {
      (result as AnyRecord)[field] = safeDecrypt(val);
    }
  }
  for (const field of spec.numeric ?? []) {
    const val = result[field];
    if (val != null) {
      (result as AnyRecord)[field] = safeDecryptNumber(String(val));
    }
  }
  for (const field of spec.json ?? []) {
    const val = result[field];
    if (typeof val === "string" && isEncrypted(val)) {
      try {
        (result as AnyRecord)[field] = JSON.parse(decrypt(val));
      } catch {
        (result as AnyRecord)[field] = val;
      }
    }
  }
  return result;
}

/** Decrypt an array of rows */
export function decryptRows<T extends AnyRecord>(
  rows: T[],
  spec: { text?: readonly string[]; numeric?: readonly string[]; json?: readonly string[] }
): T[] {
  return rows.map((row) => decryptFields(row, spec));
}
