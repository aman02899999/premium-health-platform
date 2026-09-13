import { describe, it, expect, beforeEach } from "vitest";
import {
  buildSnapshot,
  checkDailyQuota,
  checkMinuteLimit,
  currentUtcDay,
  getUsage,
  nextUtcMidnight,
  recordUsage,
  __resetMemoryUsage,
} from "./metering";
import { getPlan } from "./plans";

const free = getPlan("free");
const enterprise = getPlan("enterprise");

beforeEach(() => {
  delete process.env.DATABASE_URL;
  __resetMemoryUsage();
});

describe("day boundaries", () => {
  it("uses UTC days", () => {
    expect(currentUtcDay(new Date("2026-09-13T23:59:59Z"))).toBe("2026-09-13");
    expect(currentUtcDay(new Date("2026-09-14T00:00:00Z"))).toBe("2026-09-14");
  });

  it("resets at the next UTC midnight", () => {
    const reset = nextUtcMidnight(new Date("2026-09-13T10:30:00Z"));
    expect(reset.toISOString()).toBe("2026-09-14T00:00:00.000Z");
    // Exactly midnight rolls to the following day.
    expect(nextUtcMidnight(new Date("2026-09-14T00:00:00Z")).toISOString()).toBe("2026-09-15T00:00:00.000Z");
  });
});

describe("usage recording", () => {
  it("counts requests and errors separately, with a per-endpoint breakdown", async () => {
    await recordUsage("key_1", "/api/v1/food/search", true);
    await recordUsage("key_1", "/api/v1/food/search", true);
    await recordUsage("key_1", "/api/v1/literature/search", false);

    const usage = await getUsage("key_1", free);
    expect(usage.requests).toBe(3);
    expect(usage.errors).toBe(1);
    expect(usage.byEndpoint).toEqual({
      "/api/v1/food/search": 2,
      "/api/v1/literature/search": 1,
    });
  });

  it("keeps counters independent per key", async () => {
    await recordUsage("key_a", "/api/v1/plans");
    await recordUsage("key_b", "/api/v1/plans");
    await recordUsage("key_b", "/api/v1/plans");

    expect((await getUsage("key_a", free)).requests).toBe(1);
    expect((await getUsage("key_b", free)).requests).toBe(2);
  });

  it("reports quota consumption against the plan limit", async () => {
    for (let i = 0; i < 250; i++) await recordUsage("key_1", "/api/v1/exercises");

    const usage = await getUsage("key_1", free);
    expect(usage.requests).toBe(250);
    expect(usage.limit).toBe(free.requestsPerDay);
    expect(usage.remaining).toBe(free.requestsPerDay - 250);
    expect(usage.percentUsed).toBe(25);
    expect(usage.resetAt).toBe(nextUtcMidnight().toISOString());
  });
});

describe("snapshots", () => {
  it("marks unlimited plans with a remaining of -1 and 0% used", () => {
    const snapshot = buildSnapshot("key_1", "2026-09-13", 10_000, 0, {}, enterprise);
    expect(snapshot.unlimited).toBe(true);
    expect(snapshot.remaining).toBe(-1);
    expect(snapshot.limit).toBe(-1);
    expect(snapshot.percentUsed).toBe(0);
  });

  it("never reports negative remaining or >100%", () => {
    const snapshot = buildSnapshot("key_1", "2026-09-13", free.requestsPerDay + 500, 0, {}, free);
    expect(snapshot.remaining).toBe(0);
    expect(snapshot.percentUsed).toBe(100);
  });
});

describe("daily quota enforcement", () => {
  it("allows requests below the limit", async () => {
    await recordUsage("key_1", "/api/v1/plans");
    const check = await checkDailyQuota("key_1", free);
    expect(check.allowed).toBe(true);
    expect(check.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("blocks the request that would exceed the limit — the boundary is exact", async () => {
    for (let i = 0; i < free.requestsPerDay; i++) await recordUsage("key_1", "/api/v1/plans");

    const check = await checkDailyQuota("key_1", free);
    const usage = await getUsage("key_1", free);
    expect(usage.requests).toBe(free.requestsPerDay);
    expect(check.allowed).toBe(false);
    // Retry-After is a positive number of seconds, never 0 or NaN.
    expect(check.retryAfterSeconds).toBeGreaterThan(0);
    expect(check.retryAfterSeconds).toBeLessThanOrEqual(24 * 60 * 60);
  });

  it("never blocks an unlimited plan", async () => {
    for (let i = 0; i < 50; i++) await recordUsage("key_ent", "/api/v1/plans");
    const check = await checkDailyQuota("key_ent", enterprise);
    expect(check.allowed).toBe(true);
  });
});

describe("per-minute burst limit", () => {
  it("allows exactly requestsPerMinute calls, then blocks until the next minute", () => {
    const at = new Date("2026-09-13T10:00:10Z");
    const results = [];
    for (let i = 0; i < free.requestsPerMinute; i++) {
      results.push(checkMinuteLimit("key_1", free, at));
    }
    expect(results.every((r) => r.allowed)).toBe(true);
    expect(results[results.length - 1].remaining).toBe(0);

    const blocked = checkMinuteLimit("key_1", free, at);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("resets in the following minute", () => {
    const at = new Date("2026-09-13T10:00:10Z");
    for (let i = 0; i < free.requestsPerMinute; i++) checkMinuteLimit("key_1", free, at);
    expect(checkMinuteLimit("key_1", free, at).allowed).toBe(false);
    expect(checkMinuteLimit("key_1", free, new Date("2026-09-13T10:01:00Z")).allowed).toBe(true);
  });

  it("keeps buckets separate per key and exempts unlimited plans", () => {
    const at = new Date("2026-09-13T10:00:10Z");
    for (let i = 0; i < free.requestsPerMinute; i++) checkMinuteLimit("key_1", free, at);

    expect(checkMinuteLimit("key_2", free, at).allowed).toBe(true);
    expect(checkMinuteLimit("key_1", enterprise, at).allowed).toBe(true);
  });
});
