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
