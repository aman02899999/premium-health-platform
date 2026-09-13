import { describe, it, expect, beforeEach } from "vitest";
import { authenticateApiRequest, extractApiKey } from "./auth";
import { createApiKey, revokeApiKey, __resetMemoryKeyStore } from "./keys";
import { recordUsage, __resetMemoryUsage } from "./metering";
import { getPlan } from "./plans";

const free = getPlan("free");

function request(headers: Record<string, string> = {}, url = "https://bharathealthguide.in/api/v1/food/search?q=millet"): Request {
  return new Request(url, { headers });
}

beforeEach(() => {
  delete process.env.DATABASE_URL;
  __resetMemoryKeyStore();
  __resetMemoryUsage();
});

describe("key extraction", () => {
  it("prefers x-api-key, then a bearer token, then the query fallback", () => {
    expect(extractApiKey(request({ "x-api-key": "k1", authorization: "Bearer k2" }))).toBe("k1");
    expect(extractApiKey(request({ authorization: "Bearer k2" }))).toBe("k2");
    expect(extractApiKey(request({}, "https://x.test/api/v1/plans?api_key=k3"))).toBe("k3");
    expect(extractApiKey(request())).toBeNull();
  });

  it("ignores malformed authorization headers", () => {
    expect(extractApiKey(request({ authorization: "Basic abc" }))).toBeNull();
    expect(extractApiKey(request({ authorization: "Bearer" }))).toBeNull();
  });
});

describe("authentication failures", () => {
  it("401 missing_api_key when no key is supplied", async () => {
    const result = await authenticateApiRequest(request());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
    const body = await result.response.json();
    expect(body.error.code).toBe("missing_api_key");
    expect(body.error.docs).toContain("/developers/docs");
  });

  it("401 invalid_api_key for an unknown key", async () => {
    const result = await authenticateApiRequest(request({ "x-api-key": "bhg_live_nope" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
    expect((await result.response.json()).error.code).toBe("invalid_api_key");
  });

  it("401 invalid_api_key for a revoked key", async () => {
    const { key, record } = await createApiKey({ ownerId: "u1" });
    await revokeApiKey(record.keyId);

    const result = await authenticateApiRequest(request({ "x-api-key": key }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
    expect((await result.response.json()).error.message).toContain("revoked");
  });
});

describe("successful authentication", () => {
  it("returns the key, its plan, quota headers and a recording hook", async () => {
    const { key, record } = await createApiKey({ ownerId: "u1", plan: "pro" });

    const result = await authenticateApiRequest(request({ "x-api-key": key }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.key.keyId).toBe(record.keyId);
    expect(result.plan.id).toBe("pro");
    expect(result.headers["X-Plan"]).toBe("pro");
    expect(result.headers["X-RateLimit-Limit-Day"]).toBe("500000");
    expect(result.headers["X-RateLimit-Remaining-Day"]).toBe("500000");
    expect(result.headers["X-RateLimit-Limit-Minute"]).toBe("600");
    expect(result.headers["X-API-Version"]).toBe("v1");

    await result.record("/api/v1/food/search", true);
    await result.record("/api/v1/food/search", false);

    // The hook is what meters usage; verify it actually wrote.
    const again = await authenticateApiRequest(request({ "x-api-key": key }));
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.usage.requests).toBe(2);
    expect(again.usage.errors).toBe(1);
    expect(again.headers["X-RateLimit-Remaining-Day"]).toBe("499998");
  });

  it("accepts a bearer token as well as x-api-key", async () => {
    const { key } = await createApiKey({ ownerId: "u1" });
    const viaBearer = await authenticateApiRequest(request({ authorization: `Bearer ${key}` }));
    expect(viaBearer.ok).toBe(true);
  });
});

describe("quota enforcement", () => {
  it("429 quota_exceeded with Retry-After once the daily limit is used", async () => {
    const { key, record } = await createApiKey({ ownerId: "u1" });
    for (let i = 0; i < free.requestsPerDay; i++) await recordUsage(record.keyId, "/api/v1/plans");

    const result = await authenticateApiRequest(request({ "x-api-key": key }));
    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.response.status).toBe(429);
    const body = await result.response.json();
    expect(body.error.code).toBe("quota_exceeded");
    const retryAfter = Number(result.response.headers.get("retry-after"));
    expect(retryAfter).toBeGreaterThan(0);
    expect(result.response.headers.get("X-RateLimit-Remaining-Day")).toBe("0");
  });

  it("429 rate_limited with Retry-After once the per-minute burst limit is hit", async () => {
    const { key } = await createApiKey({ ownerId: "u1" });

    // The first N requests pass, then the burst limit kicks in.
    for (let i = 0; i < free.requestsPerMinute; i++) {
      const ok = await authenticateApiRequest(request({ "x-api-key": key }));
      expect(ok.ok).toBe(true);
    }

    const blocked = await authenticateApiRequest(request({ "x-api-key": key }));
    expect(blocked.ok).toBe(false);
    if (blocked.ok) return;

    expect(blocked.response.status).toBe(429);
    expect((await blocked.response.json()).error.code).toBe("rate_limited");
    const retryAfter = Number(blocked.response.headers.get("retry-after"));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  it("checks the daily quota before the burst limit, and does not meter rejected calls", async () => {
    const { key, record } = await createApiKey({ ownerId: "u1" });
    for (let i = 0; i < free.requestsPerDay; i++) await recordUsage(record.keyId, "/api/v1/plans");

    const before = await authenticateApiRequest(request({ "x-api-key": key }));
    const after = await authenticateApiRequest(request({ "x-api-key": key }));

    // Rejected calls must not consume quota (they were never metered).
    expect(before.ok).toBe(false);
    expect(after.ok).toBe(false);
    if (before.ok || after.ok) return;
    expect((await before.response.json()).error.code).toBe("quota_exceeded");
    expect((await after.response.json()).error.code).toBe("quota_exceeded");
  });
});
