import { describe, it, expect, beforeEach } from "vitest";
import {
  createApiKey,
  findKeyByRaw,
  generateRawKey,
  hashApiKey,
  isKeyOwnedBy,
  listApiKeys,
  listOwnedKeys,
  revokeApiKey,
  revokeOwnedApiKey,
  __resetMemoryKeyStore,
} from "./keys";

beforeEach(() => {
  delete process.env.DATABASE_URL;
  __resetMemoryKeyStore();
});

describe("api key generation", () => {
  it("prefixes keys by environment and carries 256 bits of entropy", () => {
    const live = generateRawKey("live");
    const test = generateRawKey("test");
    expect(live.startsWith("bhg_live_")).toBe(true);
    expect(test.startsWith("bhg_test_")).toBe(true);
    // 32 random bytes base64url-encoded => 43 chars
    expect(live.slice("bhg_live_".length)).toHaveLength(43);
  });

  it("never repeats a key", () => {
    const keys = new Set(Array.from({ length: 200 }, () => generateRawKey()));
    expect(keys.size).toBe(200);
  });

  it("hashes deterministically to a 64-char hex digest", () => {
    const digest = hashApiKey("bhg_live_abc");
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(hashApiKey("bhg_live_abc")).toBe(digest);
    expect(hashApiKey("bhg_live_abd")).not.toBe(digest);
  });
});

describe("api key lifecycle", () => {
  it("returns the plaintext once and never stores it in the record", async () => {
    const { key, record } = await createApiKey({ name: "CI key", ownerId: "user_1", ownerEmail: "Dev@Example.com" });

    expect(key.startsWith("bhg_live_")).toBe(true);
    expect(record.keyPrefix).toBe(key.slice(0, 16));
    expect(record.status).toBe("active");
    expect(record.plan).toBe("free");
    // The public record must not leak the secret in any form.
    expect(JSON.stringify(record)).not.toContain(key);
    expect(record).not.toHaveProperty("keyHash");
  });

  it("finds a key by its plaintext and rejects anything else", async () => {
    const { key, record } = await createApiKey({ ownerId: "user_1" });

    const found = await findKeyByRaw(key);
    expect(found?.keyId).toBe(record.keyId);
    expect(await findKeyByRaw("bhg_live_not-a-real-key")).toBeNull();
    expect(await findKeyByRaw("")).toBeNull();
    // A near-miss (one character changed) must not match.
    expect(await findKeyByRaw(key.slice(0, -1) + (key.endsWith("A") ? "B" : "A"))).toBeNull();
  });

  it("revokes a key without deleting its history", async () => {
    const { key, record } = await createApiKey({ ownerId: "user_1" });

    expect(await revokeApiKey(record.keyId)).toBe(true);
    // Revoked, not gone — the record still resolves so the API can explain the 401.
    expect((await findKeyByRaw(key))?.status).toBe("revoked");
    // Revoking twice is a no-op.
    expect(await revokeApiKey(record.keyId)).toBe(false);
  });

  it("options: honours a requested plan, rejects unknown plans, and supports test keys", async () => {
    const paid = await createApiKey({ plan: "pro" });
    expect(paid.record.plan).toBe("pro");

    const bogus = await createApiKey({ plan: "definitely-not-a-plan" });
    expect(bogus.record.plan).toBe("free");

    const staging = await createApiKey({ environment: "test" });
    expect(staging.key.startsWith("bhg_test_")).toBe(true);
    expect(staging.record.environment).toBe("test");
  });
});

describe("ownership scoping", () => {
  it("lists only the owner's keys, and never everything when no owner is given", async () => {
    await createApiKey({ ownerId: "user_1", name: "one" });
    await createApiKey({ ownerId: "user_2", name: "two" });

    const mine = await listApiKeys({ ownerId: "user_1" });
    expect(mine).toHaveLength(1);
    expect(mine[0].name).toBe("one");

    // A missing session must not dump every key.
    expect(await listApiKeys({})).toHaveLength(0);
    expect(await listOwnedKeys(null, null)).toHaveLength(0);
  });

  it("matches by email when no user id is available", async () => {
    await createApiKey({ ownerEmail: "Owner@Example.com" });
    const byEmail = await listOwnedKeys(null, "owner@example.com");
    expect(byEmail).toHaveLength(1);
  });

  it("refuses to revoke a key belonging to another account", async () => {
    const { record } = await createApiKey({ ownerId: "user_1", ownerEmail: "a@example.com" });

    expect(await isKeyOwnedBy(record.keyId, { ownerId: "user_2", ownerEmail: "b@example.com" })).toBe(false);
    expect(await revokeOwnedApiKey(record.keyId, { ownerId: "user_2", ownerEmail: "b@example.com" })).toBe("not_found");
    expect(await revokeOwnedApiKey(record.keyId, { ownerId: null, ownerEmail: null })).toBe("not_found");

    // Still active after the attempted cross-account revocation.
    expect(await isKeyOwnedBy(record.keyId, { ownerId: "user_1" })).toBe(true);
  });

  it("revokes for the true owner and reports an already-revoked key", async () => {
    const { record } = await createApiKey({ ownerId: "user_1" });

    expect(await revokeOwnedApiKey(record.keyId, { ownerId: "user_1" })).toBe("revoked");
    expect(await revokeOwnedApiKey(record.keyId, { ownerId: "user_1" })).toBe("already_revoked");
  });

  it("reports a key id that does not exist", async () => {
    expect(await revokeOwnedApiKey("key_does_not_exist", { ownerId: "user_1" })).toBe("not_found");
    expect(await isKeyOwnedBy("key_does_not_exist", { ownerId: "user_1" })).toBe(false);
  });
});
