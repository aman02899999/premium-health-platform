/**
 * Usage metering and quota enforcement for the developer API.
 *
 * Quotas are per key, per UTC calendar day, matching src/lib/saas/plans.ts.
 * Per-minute limits are burst protection and are tracked in memory (they are
 * best-effort by design — a multi-instance deployment can momentarily exceed
 * them by a factor of the instance count, which is the documented behaviour).
 *
 * Backend: Postgres when DATABASE_URL is set, otherwise memory — so keys,
 * quotas and the dashboard all work in development without a database.
 */

import { and, eq, sql } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { apiUsageDaily, apiUsageEndpoints } from "@/db/saas-schema";
import { isUnlimited, type ApiPlan } from "./plans";

export type UsageSnapshot = {
  keyId: string;
  day: string;
  requests: number;
  errors: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
  percentUsed: number;
  /** When the daily counter resets (next UTC midnight). */
  resetAt: string;
  byEndpoint: Record<string, number>;
};

export type MinuteLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/** UTC day key, e.g. "2026-09-13". */
export function currentUtcDay(at: Date = new Date()): string {
  return at.toISOString().slice(0, 10);
}

export function nextUtcMidnight(at: Date = new Date()): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate() + 1, 0, 0, 0, 0));
}

function minuteKey(at: Date = new Date()): string {
  return `${at.toISOString().slice(0, 16)}`;
}

// ---------------------------------------------------------------- memory state

type MemoryUsage = { day: string; requests: number; errors: number; byEndpoint: Record<string, number> };

const globalForUsage = globalThis as typeof globalThis & {
  __bhgApiUsage?: Map<string, MemoryUsage>;
  __bhgApiMinute?: Map<string, { count: number; resetAt: number }>;
};

function usageStore(): Map<string, MemoryUsage> {
  if (!globalForUsage.__bhgApiUsage) globalForUsage.__bhgApiUsage = new Map();
  return globalForUsage.__bhgApiUsage;
}

function minuteStore(): Map<string, { count: number; resetAt: number }> {
  if (!globalForUsage.__bhgApiMinute) globalForUsage.__bhgApiMinute = new Map();
  return globalForUsage.__bhgApiMinute;
}

export function __resetMemoryUsage(): void {
  usageStore().clear();
  minuteStore().clear();
}

function memoryUsageFor(keyId: string, day: string): MemoryUsage {
  const key = `${keyId}:${day}`;
  const found = usageStore().get(key);
  if (found) return found;
  const fresh: MemoryUsage = { day, requests: 0, errors: 0, byEndpoint: {} };
  usageStore().set(key, fresh);
  return fresh;
}

// ------------------------------------------------------------------- recording

/** Records one request. Never throws — metering must not break an API response. */
export async function recordUsage(keyId: string, endpoint: string, ok = true): Promise<void> {
  const day = currentUtcDay();
  try {
    if (isDbConfigured) {
      await db
        .insert(apiUsageDaily)
        .values({ keyId, day, requests: 1, errors: ok ? 0 : 1 })
        .onConflictDoUpdate({
          target: [apiUsageDaily.keyId, apiUsageDaily.day],
          set: {
            requests: sql`${apiUsageDaily.requests} + 1`,
            errors: sql`${apiUsageDaily.errors} + ${ok ? 0 : 1}`,
            updatedAt: new Date(),
          },
        });

      await db
        .insert(apiUsageEndpoints)
        .values({ keyId, day, endpoint, requests: 1, errors: ok ? 0 : 1 })
        .onConflictDoUpdate({
          target: [apiUsageEndpoints.keyId, apiUsageEndpoints.day, apiUsageEndpoints.endpoint],
          set: {
            requests: sql`${apiUsageEndpoints.requests} + 1`,
            errors: sql`${apiUsageEndpoints.errors} + ${ok ? 0 : 1}`,
            updatedAt: new Date(),
          },
        });
      return;
    }

    const memory = memoryUsageFor(keyId, day);
    memory.requests += 1;
    if (!ok) memory.errors += 1;
    memory.byEndpoint[endpoint] = (memory.byEndpoint[endpoint] ?? 0) + 1;
  } catch {
    // Metering failures must never surface to the caller.
  }
}

// --------------------------------------------------------------------- reading

export async function getUsage(keyId: string, plan: ApiPlan, at: Date = new Date()): Promise<UsageSnapshot> {
  const day = currentUtcDay(at);
  let requests = 0;
  let errors = 0;
  let byEndpoint: Record<string, number> = {};

  try {
    if (isDbConfigured) {
      const totals = await db
        .select()
        .from(apiUsageDaily)
        .where(and(eq(apiUsageDaily.keyId, keyId), eq(apiUsageDaily.day, day)))
        .limit(1);
      requests = totals[0]?.requests ?? 0;
      errors = totals[0]?.errors ?? 0;

      const perEndpoint = await db
        .select()
        .from(apiUsageEndpoints)
        .where(and(eq(apiUsageEndpoints.keyId, keyId), eq(apiUsageEndpoints.day, day)));
      byEndpoint = Object.fromEntries(perEndpoint.map((r) => [r.endpoint, r.requests]));
    } else {
      const memory = memoryUsageFor(keyId, day);
      requests = memory.requests;
      errors = memory.errors;
      byEndpoint = { ...memory.byEndpoint };
    }
  } catch {
    // Reported as zero usage rather than failing the request.
  }

  return buildSnapshot(keyId, day, requests, errors, byEndpoint, plan, at);
}

export function buildSnapshot(
  keyId: string,
  day: string,
  requests: number,
  errors: number,
  byEndpoint: Record<string, number>,
  plan: ApiPlan,
  at: Date = new Date()
): UsageSnapshot {
  const unlimited = isUnlimited(plan.requestsPerDay);
  const limit = unlimited ? -1 : plan.requestsPerDay;
  const remaining = unlimited ? -1 : Math.max(0, plan.requestsPerDay - requests);
  const percentUsed = unlimited || plan.requestsPerDay <= 0 ? 0 : Math.min(100, Math.round((requests / plan.requestsPerDay) * 100));

  return {
    keyId,
    day,
    requests,
    errors,
    limit,
    remaining,
    unlimited,
    percentUsed,
    resetAt: nextUtcMidnight(at).toISOString(),
    byEndpoint,
  };
}

// ----------------------------------------------------------- quota enforcement

/** Daily quota check — does not consume anything, just reports. */
export async function checkDailyQuota(
  keyId: string,
  plan: ApiPlan,
  at: Date = new Date()
): Promise<{ allowed: boolean; usage: UsageSnapshot; retryAfterSeconds: number }> {
  const usage = await getUsage(keyId, plan, at);
  const allowed = usage.unlimited || usage.requests < plan.requestsPerDay;
  const retryAfterSeconds = Math.max(1, Math.ceil((nextUtcMidnight(at).getTime() - at.getTime()) / 1000));
  return { allowed, usage, retryAfterSeconds };
}

/**
 * Per-minute burst limit. Increments on each call, so call it once per request
 * after the daily quota check has passed.
 */
export function checkMinuteLimit(keyId: string, plan: ApiPlan, at: Date = new Date()): MinuteLimitResult {
  if (isUnlimited(plan.requestsPerMinute)) {
    return { allowed: true, remaining: -1, retryAfterSeconds: 0 };
  }

  const bucketKey = `${keyId}:${minuteKey(at)}`;
  const store = minuteStore();
  const now = at.getTime();
  const resetAt = Math.ceil(now / 60_000) * 60_000;

  // Opportunistic sweep so the map cannot grow without bound.
  if (store.size > 5_000) {
    for (const [k, v] of store) if (v.resetAt <= now) store.delete(k);
  }

  const bucket = store.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) {
    store.set(bucketKey, { count: 1, resetAt });
    return { allowed: true, remaining: plan.requestsPerMinute - 1, retryAfterSeconds: 0 };
  }
  if (bucket.count >= plan.requestsPerMinute) {
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)) };
  }
  bucket.count += 1;
  return { allowed: true, remaining: plan.requestsPerMinute - bucket.count, retryAfterSeconds: 0 };
}
