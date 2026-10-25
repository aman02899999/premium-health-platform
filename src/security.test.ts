// The locks found missing in the October audit stay locked.
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ isAdmin: async () => false }));

describe("security", () => {
  it("refuses admin and account writes from another site", async () => {
    const { proxy } = await import("./proxy");
    const evil = new NextRequest("https://www.royalfitnesclub.in/api/admin/growth", { method: "POST", headers: { origin: "https://evil.example" } });
    expect((await proxy(evil)).status).toBe(403);
    const own = new NextRequest("https://www.royalfitnesclub.in/api/admin/growth", { method: "POST", headers: { origin: "https://www.royalfitnesclub.in" } });
    expect((await proxy(own)).status).not.toBe(403);
    const read = new NextRequest("https://www.royalfitnesclub.in/api/account/plans", { headers: { origin: "https://evil.example" } });
    expect((await proxy(read)).status).not.toBe(403);
  });

  it("refuses /health form and API writes from another site, but not webhooks, the scheduler or server callers", async () => {
    const { proxy } = await import("./proxy");
    const post = (path: string, origin?: string) => proxy(new NextRequest(`https://www.royalfitnesclub.in${path}`, { method: "POST", headers: origin ? { origin } : {} }));
    for (const path of ["/health/api/lead", "/health/api/newsletter", "/health/api/whatsapp/optin", "/health/api/news/publish", "/health/api/v1/keys", "/health/api/monetization/leads"]) {
      expect((await post(path, "https://evil.example")).status, path).toBe(403);
      expect((await post(path, "https://www.royalfitnesclub.in")).status, path).not.toBe(403);
      // Server-to-server callers (the news publisher, API clients) send no Origin.
      expect((await post(path)).status, path).not.toBe(403);
    }
    expect((await post("/health/api/webhooks/razorpay", "https://evil.example")).status).not.toBe(403);
    expect((await post("/health/api/cron/daily", "https://evil.example")).status).not.toBe(403);
    expect((await post("/api/webhooks/razorpay", "https://evil.example")).status).not.toBe(403);
    const { config } = await import("./proxy");
    expect(config.matcher).toContain("/health/api/:path*");
  });

  it("the news publisher refuses every write when its token isn't set, and checks it exactly when it is", async () => {
    const route = await import("./app/(health)/health/api/news/publish/route");
    const call = (method: "POST" | "PUT", token?: string) =>
      route[method](new Request("https://x.in/health/api/news/publish", { method, headers: token ? { "x-news-token": token } : {}, body: method === "POST" ? "{}" : undefined }));
    const before = process.env.NEWS_ADMIN_TOKEN;
    try {
      delete process.env.NEWS_ADMIN_TOKEN;
      expect((await call("POST")).status).toBe(401);
      expect((await call("PUT")).status).toBe(401);
      expect((await call("POST", "anything")).status).toBe(401);
      process.env.NEWS_ADMIN_TOKEN = "news-token-123";
      expect((await call("POST", "news-token-12")).status).toBe(401);
      expect((await call("POST", "news-token-1234")).status).toBe(401);
      // Right token, empty body: past the lock, stopped by validation.
      expect((await call("POST", "news-token-123")).status).toBe(400);
    } finally {
      if (before === undefined) delete process.env.NEWS_ADMIN_TOKEN;
      else process.env.NEWS_ADMIN_TOKEN = before;
    }
  });

  it("the health cron refuses to run in production without its secret", async () => {
    const route = await import("./app/(health)/health/api/cron/daily/route");
    const env = process.env as Record<string, string | undefined>;
    const before = { secret: env.CRON_SECRET, node: env.NODE_ENV };
    try {
      delete env.CRON_SECRET;
      env.NODE_ENV = "production";
      expect((await route.GET(new Request("https://x.in/health/api/cron/daily"))).status).toBe(401);
      env.CRON_SECRET = "cron-secret";
      expect((await route.GET(new Request("https://x.in/health/api/cron/daily", { headers: { authorization: "Bearer wrong" } }))).status).toBe(401);
    } finally {
      if (before.secret === undefined) delete env.CRON_SECRET;
      else env.CRON_SECRET = before.secret;
      env.NODE_ENV = before.node;
    }
  });

  it("the demo store can't start a simulated purchase on the live site", async () => {
    const orders = await import("./app/(health)/health/api/monetization/orders/route");
    const env = process.env as Record<string, string | undefined>;
    const before = env.VERCEL_ENV;
    try {
      env.VERCEL_ENV = "production";
      const res = await orders.POST(new NextRequest("https://x.in/health/api/monetization/orders", { method: "POST", body: JSON.stringify({ productId: "x" }) }));
      expect(res.status).toBe(503);
    } finally {
      if (before === undefined) delete env.VERCEL_ENV;
      else env.VERCEL_ENV = before;
    }
  });

  it("customer orders, leads and analytics on /health are admin-only; sync needs the admin or the cron", async () => {
    const req = (u: string, init?: { method?: string; body?: string }) => new NextRequest(`https://x.in${u}`, init);
    const orders = await import("./app/(health)/health/api/monetization/orders/route");
    const leads = await import("./app/(health)/health/api/monetization/leads/route");
    const analytics = await import("./app/(health)/health/api/monetization/analytics/route");
    const sync = await import("./app/(health)/health/api/health/sync/route");
    expect((await orders.GET(req("/health/api/monetization/orders"))).status).toBe(401);
    expect((await leads.GET(req("/health/api/monetization/leads"))).status).toBe(401);
    expect((await analytics.GET(req("/health/api/monetization/analytics"))).status).toBe(401);
    expect((await sync.POST(req("/health/api/health/sync", { method: "POST", body: "{}" }))).status).toBe(401);
    expect((await sync.DELETE(req("/health/api/health/sync?provider=wger", { method: "DELETE" }))).status).toBe(401);
  });
});
