import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";
import { generateDownloadToken, verifyDownloadToken } from "./payment";

/**
 * Regression tests for the download-token security defects:
 *  #1 tokens were forgeable (the embedded secret was never validated)
 *  #2 tokens never expired (ISO timestamp + ":" delimiter truncated the expiry)
 */

const ENV_KEYS = ["DOWNLOAD_TOKEN_SECRET", "NEXTAUTH_SECRET"];
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  process.env.DOWNLOAD_TOKEN_SECRET = "test-download-secret";
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

/** Builds a token the way the OLD, vulnerable implementation did. */
function forgeLegacyToken(orderId: string, productId: string, expiresAtIso: string): string {
  return Buffer.from(`${orderId}:${productId}:${expiresAtIso}:test-download-secret`).toString("base64url");
}

/** Builds a correctly-shaped token but signed with an arbitrary key. */
function signPayload(payload: string, secret: string): string {
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

describe("generateDownloadToken / verifyDownloadToken", () => {
  it("round-trips a freshly issued token and preserves order and product ids", () => {
    const { token, expiresAt } = generateDownloadToken("order_123", "diabetes-guide", 72);
    const result = verifyDownloadToken(token);

    expect(result.valid).toBe(true);
    expect(result.orderId).toBe("order_123");
    expect(result.productId).toBe("diabetes-guide");
    expect(result.expiresAt).toBe(expiresAt);
  });

  it("expires exactly the requested window (default 72h, custom honoured)", () => {
    const { expiresAt } = generateDownloadToken("order_123", "diabetes-guide", 72);
    const hoursFromNow = (new Date(expiresAt).getTime() - Date.now()) / (60 * 60 * 1000);
    expect(hoursFromNow).toBeGreaterThan(71.9);
    expect(hoursFromNow).toBeLessThanOrEqual(72);

    const custom = generateDownloadToken("order_9", "weight-management", 24);
    const customHours = (new Date(custom.expiresAt).getTime() - Date.now()) / (60 * 60 * 1000);
    expect(customHours).toBeGreaterThan(23.9);
    expect(customHours).toBeLessThanOrEqual(24);
  });

  it("REJECTS a forgeable unsigned token in the legacy base64-only format (defect #1)", () => {
    const futureIso = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const forged = forgeLegacyToken("order_attacker", "diabetes-guide", futureIso);

    const result = verifyDownloadToken(forged);

    expect(result.valid).toBe(false);
    expect(result.orderId).toBeUndefined();
    expect(result.productId).toBeUndefined();
  });

  it("REJECTS a token signed with the wrong secret", () => {
    const expiresAtMs = Date.now() + 72 * 60 * 60 * 1000;
    const token = signPayload(`order_1|diabetes-guide|${expiresAtMs}`, "not-the-real-secret");

    const result = verifyDownloadToken(token);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid token signature");
  });

  it("REJECTS a tampered payload that keeps the original signature", () => {
    const { token } = generateDownloadToken("order_1", "diabetes-guide", 72);
    const [encodedPayload, signature] = token.split(".");
    const originalPayload = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const tamperedPayload = originalPayload.replace("diabetes-guide", "weight-management");

    const tampered = `${Buffer.from(tamperedPayload).toString("base64url")}.${signature}`;
    const result = verifyDownloadToken(tampered);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid token signature");
  });

  it("REJECTS an expired token instead of letting it live forever (defect #2)", () => {
    const expiredAtMs = Date.now() - 60 * 1000;
    const token = signPayload(`order_1|diabetes-guide|${expiredAtMs}`, "test-download-secret");

    const result = verifyDownloadToken(token);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Token expired");
  });

  it("REJECTS malformed tokens and survives a missing signature", () => {
    expect(verifyDownloadToken("").valid).toBe(false);
    expect(verifyDownloadToken("not-a-token").valid).toBe(false);
    expect(verifyDownloadToken(Buffer.from("order_1|diabetes-guide|99999999999999").toString("base64url")).valid).toBe(false);
    expect(verifyDownloadToken(`${Buffer.from("order_1|diabetes-guide|99999999999999").toString("base64url")}.`).valid).toBe(false);
  });

  it("falls back to NEXTAUTH_SECRET when DOWNLOAD_TOKEN_SECRET is unset", () => {
    delete process.env.DOWNLOAD_TOKEN_SECRET;
    process.env.NEXTAUTH_SECRET = "nextauth-fallback-secret";

    const { token } = generateDownloadToken("order_42", "millet-combo-pack", 72);
    expect(verifyDownloadToken(token).valid).toBe(true);

    // A token minted with the auth secret must not verify against a different download secret.
    process.env.DOWNLOAD_TOKEN_SECRET = "rotated-download-secret";
    expect(verifyDownloadToken(token).valid).toBe(false);
  });
});
