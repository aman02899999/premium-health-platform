// Encryption for saved blood reports (AES-256-GCM). The key comes from LAB_DATA_KEY: 32 random
// bytes, base64. Without it, members can still analyse a report but nothing is saved.
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

export const KEY_VERSION = 1;

export function labKey(env: Record<string, string | undefined> = process.env): Buffer | null {
  const raw = env.LAB_DATA_KEY?.trim();
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  return key.length === 32 ? key : null;
}

/** base64(iv | tag | ciphertext) */
export function seal(key: Buffer, data: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64");
}

/** The sealed value, or null when it was tampered with or sealed with another key. */
export function open<T>(key: Buffer, sealed: string): T | null {
  try {
    const buf = Buffer.from(sealed, "base64");
    const decipher = createDecipheriv("aes-256-gcm", key, buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8")) as T;
  } catch {
    return null;
  }
}
