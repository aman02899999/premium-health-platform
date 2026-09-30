/**
 * API key management for the developer platform.
 *
 * Security properties (see AUDIT.md for the download-token precedent):
 *  - Keys are generated with 256 bits of entropy via crypto.randomBytes.
 *  - Only a SHA-256 hash is persisted; the plaintext key is returned exactly once,
 *    at creation. It cannot be recovered — a lost key must be rotated.
 *  - Lookup hashes the presented key and compares with timingSafeEqual, so
 *    verification does not leak information through timing.
 *  - Revocation is a status flag, never a delete, so usage history stays coherent.
 *
 * Backend: Postgres via Drizzle when DATABASE_URL is configured, otherwise an
 * in-memory store so the whole flow stays demoable in dev (the same
 * gracefull-fallback pattern used by src/lib/monetization/storage.ts).
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { apiKeys } from "@/db/saas-schema";
import { DEFAULT_PLAN_ID, getPlan, isKnownPlan, type PlanId } from "./plans";

export const KEY_PREFIX_LIVE = "bhg_live_";
export const KEY_PREFIX_TEST = "bhg_test_";

export type KeyEnvironment = "live" | "test";

/** Public view of a key — never contains the hash or the plaintext. */
export type ApiKeyPublic = {
  keyId: string;
  name: string;
  plan: PlanId;
  keyPrefix: string;
  status: "active" | "revoked";
  environment: KeyEnvironment;
  requestCount: number;
  lastUsedAt: string | null;
  createdAt: string;
};

export type ApiKeyRecord = ApiKeyPublic & { keyHash: string };

export type CreateKeyInput = {
  name?: string;
  ownerId?: string | null;
  ownerEmail?: string | null;
  plan?: PlanId | string;
  environment?: KeyEnvironment;
  scopes?: string[] | null;
};

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

/** Generates a new plaintext key: bhg_live_ + 43 chars of base64url (256 bits). */
export function generateRawKey(environment: KeyEnvironment = "live"): string {
  const prefix = environment === "test" ? KEY_PREFIX_TEST : KEY_PREFIX_LIVE;
  return `${prefix}${randomBytes(32).toString("base64url")}`;
}

export function generateKeyId(): string {
  return `key_${randomBytes(9).toString("base64url")}`;
}

function publicView(record: ApiKeyRecord): ApiKeyPublic {
  const { keyHash: _omit, ...rest } = record;
  return rest;
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

// ---------------------------------------------------------------- memory store

type MemoryKey = ApiKeyRecord & { id: number; ownerId: string | null; ownerEmail: string | null };

const globalForKeys = globalThis as typeof globalThis & {
  __bhgApiKeys?: Map<string, MemoryKey>;
  __bhgApiKeySeq?: { value: number };
};

function memoryStore(): Map<string, MemoryKey> {
  if (!globalForKeys.__bhgApiKeys) globalForKeys.__bhgApiKeys = new Map();
  return globalForKeys.__bhgApiKeys;
}

function nextMemoryId(): number {
  if (!globalForKeys.__bhgApiKeySeq) globalForKeys.__bhgApiKeySeq = { value: 0 };
  return ++globalForKeys.__bhgApiKeySeq.value;
}

/** Test/maintenance helper — clears the in-memory store. */
export function __resetMemoryKeyStore(): void {
  memoryStore().clear();
  globalForKeys.__bhgApiKeySeq = { value: 0 };
}

// ------------------------------------------------------------------- create

export async function createApiKey(
  input: CreateKeyInput = {}
): Promise<{ key: string; record: ApiKeyPublic }> {
  const environment: KeyEnvironment = input.environment === "test" ? "test" : "live";
  const raw = generateRawKey(environment);
  const plan: PlanId = isKnownPlan(input.plan) ? (String(input.plan).toLowerCase() as PlanId) : DEFAULT_PLAN_ID;
  const now = new Date().toISOString();

  const record: ApiKeyRecord = {
    keyId: generateKeyId(),
    name: (input.name?.trim() || "Default key").slice(0, 120),
    plan,
    keyPrefix: raw.slice(0, 16),
    status: "active",
    environment,
    requestCount: 0,
    lastUsedAt: null,
    createdAt: now,
    keyHash: hashApiKey(raw),
  };

  if (isDbConfigured) {
    await db.insert(apiKeys).values({
      keyId: record.keyId,
      name: record.name,
      ownerId: input.ownerId ?? null,
      ownerEmail: input.ownerEmail?.toLowerCase() ?? null,
      plan: record.plan,
      keyHash: record.keyHash,
      keyPrefix: record.keyPrefix,
      status: "active",
      environment,
      scopes: input.scopes ?? null,
      createdAt: new Date(now),
    });
  } else {
    memoryStore().set(record.keyId, {
      ...record,
      id: nextMemoryId(),
      ownerId: input.ownerId ?? null,
      ownerEmail: input.ownerEmail?.toLowerCase() ?? null,
    });
  }

  return { key: raw, record: publicView(record) };
}

// --------------------------------------------------------------- lookup/verify

export async function findKeyByRaw(raw: string): Promise<ApiKeyRecord | null> {
  if (!raw || typeof raw !== "string") return null;
  const digest = Buffer.from(hashApiKey(raw), "hex");

  if (isDbConfigured) {
    const rows = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, hashApiKey(raw))).limit(1);
    const row = rows[0];
    if (!row) return null;
    if (!safeEqualHex(row.keyHash, raw)) return null;
    return {
      keyId: row.keyId,
      name: row.name,
      plan: (row.plan as PlanId) ?? DEFAULT_PLAN_ID,
      keyPrefix: row.keyPrefix,
      status: row.status === "revoked" ? "revoked" : "active",
      environment: row.environment === "test" ? "test" : "live",
      requestCount: row.requestCount ?? 0,
      lastUsedAt: toIso(row.lastUsedAt),
      createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
      keyHash: row.keyHash,
    };
  }

  for (const candidate of memoryStore().values()) {
    const candidateDigest = Buffer.from(candidate.keyHash, "hex");
    if (candidateDigest.length === digest.length && timingSafeEqual(candidateDigest, digest)) {
      return publicView(candidate) as ApiKeyRecord;
    }
  }
  return null;
}

/** Constant-time comparison of two sha256 hex digests. */
function safeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(hashApiKey(b), "hex");
    return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------- list/read

export async function listApiKeys(owner: { ownerId?: string | null; ownerEmail?: string | null }): Promise<ApiKeyPublic[]> {
  if (isDbConfigured) {
    const rows = owner.ownerId
      ? await db.select().from(apiKeys).where(eq(apiKeys.ownerId, owner.ownerId)).orderBy(desc(apiKeys.createdAt))
      : owner.ownerEmail
        ? await db.select().from(apiKeys).where(eq(apiKeys.ownerEmail, owner.ownerEmail.toLowerCase())).orderBy(desc(apiKeys.createdAt))
        : [];
    return rows.map((row) => ({
      keyId: row.keyId,
      name: row.name,
      plan: (row.plan as PlanId) ?? DEFAULT_PLAN_ID,
      keyPrefix: row.keyPrefix,
      status: row.status === "revoked" ? "revoked" : "active",
      environment: row.environment === "test" ? "test" : "live",
      requestCount: row.requestCount ?? 0,
      lastUsedAt: toIso(row.lastUsedAt),
      createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    }));
  }

  const ownerId = owner.ownerId ?? null;
  const ownerEmail = owner.ownerEmail?.toLowerCase() ?? null;
  if (!ownerId && !ownerEmail) return [];

  return [...memoryStore().values()]
    .filter((k) =>
      ownerId ? k.ownerId === ownerId : ownerEmail !== null && k.ownerEmail === ownerEmail
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((k) => publicView(k));
}

export async function getApiKey(keyId: string): Promise<ApiKeyPublic | null> {
  if (isDbConfigured) {
    const rows = await db.select().from(apiKeys).where(eq(apiKeys.keyId, keyId)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      keyId: row.keyId,
      name: row.name,
      plan: (row.plan as PlanId) ?? DEFAULT_PLAN_ID,
      keyPrefix: row.keyPrefix,
      status: row.status === "revoked" ? "revoked" : "active",
      environment: row.environment === "test" ? "test" : "live",
      requestCount: row.requestCount ?? 0,
      lastUsedAt: toIso(row.lastUsedAt),
      createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    };
  }
  const found = memoryStore().get(keyId);
  return found ? publicView(found) : null;
}

// -------------------------------------------------------------------- revoke

export async function revokeApiKey(keyId: string): Promise<boolean> {
  if (isDbConfigured) {
    const rows = await db
      .update(apiKeys)
      .set({ status: "revoked", revokedAt: new Date() })
      .where(and(eq(apiKeys.keyId, keyId), eq(apiKeys.status, "active")))
      .returning({ keyId: apiKeys.keyId });
    return rows.length > 0;
  }
  const found = memoryStore().get(keyId);
  if (!found || found.status === "revoked") return false;
  found.status = "revoked";
  return true;
}

/**
 * Lists keys owned by an account. Returns [] rather than everything when no
 * owner is supplied, so a missing session can never dump every key.
 */
export async function listOwnedKeys(ownerId: string | null, ownerEmail: string | null): Promise<ApiKeyPublic[]> {
  if (!ownerId && !ownerEmail) return [];
  return listApiKeys({ ownerId, ownerEmail });
}

/**
 * Revokes a key only if it belongs to the given account.
 *
 * Ownership is enforced here rather than in the route so no caller can forget
 * it. A key owned by someone else is indistinguishable from a missing one.
 */
export async function revokeOwnedApiKey(
  keyId: string,
  owner: { ownerId?: string | null; ownerEmail?: string | null }
): Promise<"revoked" | "already_revoked" | "not_found"> {
  const owned = await isKeyOwnedBy(keyId, owner);
  if (!owned) return "not_found";

  const record = await getApiKey(keyId);
  if (!record) return "not_found";
  if (record.status === "revoked") return "already_revoked";

  const revoked = await revokeApiKey(keyId);
  if (revoked) return "revoked";
  // Lost a race with a concurrent revocation — treat as already revoked.
  return "already_revoked";
}

/** True only when the key exists AND belongs to the supplied account. */
export async function isKeyOwnedBy(
  keyId: string,
  owner: { ownerId?: string | null; ownerEmail?: string | null }
): Promise<boolean> {
  const ownerId = owner.ownerId ?? null;
  const ownerEmail = owner.ownerEmail?.toLowerCase() ?? null;
  if (!ownerId && !ownerEmail) return false;

  if (isDbConfigured) {
    const rows = await db
      .select({ ownerId: apiKeys.ownerId, ownerEmail: apiKeys.ownerEmail })
      .from(apiKeys)
      .where(eq(apiKeys.keyId, keyId))
      .limit(1);
    const row = rows[0];
    if (!row) return false;
    if (ownerId && row.ownerId === ownerId) return true;
    return Boolean(ownerEmail && row.ownerEmail?.toLowerCase() === ownerEmail);
  }

  const stored = memoryStore().get(keyId);
  if (!stored) return false;
  if (ownerId && stored.ownerId === ownerId) return true;
  return Boolean(ownerEmail && stored.ownerEmail?.toLowerCase() === ownerEmail);
}

/** Records that a key was used and bumps its lifetime counter. */
export async function touchApiKey(keyId: string): Promise<void> {
  if (isDbConfigured) {
    const rows = await db.select({ count: apiKeys.requestCount }).from(apiKeys).where(eq(apiKeys.keyId, keyId)).limit(1);
    const current = rows[0]?.count ?? 0;
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date(), requestCount: current + 1 })
      .where(eq(apiKeys.keyId, keyId));
    return;
  }
  const found = memoryStore().get(keyId);
  if (found) {
    found.lastUsedAt = new Date().toISOString();
    found.requestCount += 1;
  }
}

/**
 * Applies a plan to every key an account owns — used when an API subscription is
 * activated or cancelled, so entitlement and quota move together.
 *
 * Revoked keys are left untouched: they are historical records, not live credentials.
 * Returns the number of keys changed.
 */
export async function updateOwnedKeysPlan(
  owner: { ownerId?: string | null; ownerEmail?: string | null },
  plan: PlanId | string
): Promise<number> {
  const nextPlan: PlanId = isKnownPlan(plan) ? (String(plan).toLowerCase() as PlanId) : DEFAULT_PLAN_ID;
  const ownerId = owner.ownerId ?? null;
  const ownerEmail = owner.ownerEmail?.toLowerCase() ?? null;
  if (!ownerId && !ownerEmail) return 0;

  if (isDbConfigured) {
    const where = and(
      eq(apiKeys.status, "active"),
      ownerId ? eq(apiKeys.ownerId, ownerId) : eq(apiKeys.ownerEmail, ownerEmail as string)
    );
    const rows = await db.update(apiKeys).set({ plan: nextPlan }).where(where).returning({ keyId: apiKeys.keyId });
    return rows.length;
  }

  let changed = 0;
  for (const key of memoryStore().values()) {
    if (key.status !== "active") continue;
    const owned = ownerId ? key.ownerId === ownerId : ownerEmail !== null && key.ownerEmail === ownerEmail;
    if (!owned) continue;
    if (key.plan !== nextPlan) changed += 1;
    key.plan = nextPlan;
  }
  return changed;
}

/** Plan for a key — the stored plan wins, unknown values degrade to Free. */
export function planForKey(record: ApiKeyRecord) {
  return getPlan(record.plan);
}
