// Runs against a real Postgres with the migrations applied (TEST_DATABASE_URL); skipped otherwise.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ isAdmin: async () => true, isManager: async () => true }));

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("health consultation forms on a real database", () => {
  let pool: import("pg").Pool;
  let route: typeof import("@/app/(health)/health/api/monetization/leads/route");

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    pool = (await import("@/health/db")).pool;
    route = await import("@/app/(health)/health/api/monetization/leads/route");
  });
  beforeEach(async () => {
    await pool.query("truncate public.message_outbox, public.leads cascade");
  });
  afterAll(async () => {
    await pool.end();
  });

  const post = (body: unknown, ip = "203.0.113.7") =>
    route.POST(new NextRequest("https://x.in/health/api/monetization/leads", { method: "POST", headers: { "x-forwarded-for": ip }, body: JSON.stringify(body) }));

  it("saves the enquiry to Admin → Leads, with no automatic gym messages, and the health admin can read it back", async () => {
    const res = await post({ name: "Priya Sharma", email: "priya@example.com", phone: "98111 22233", service: "corporate-wellness", message: "Talk for 40 staff", consent: true, page: "/health/partner-with-us" });
    expect(res.status).toBe(201);
    const { rows } = await pool.query(`select name, phone, email, goal, interest, source, follow_ups, message from public.leads`);
    expect(rows).toEqual([
      { name: "Priya Sharma", phone: "9811122233", email: "priya@example.com", goal: "Corporate wellness", interest: "other", source: "health-corporate-wellness", follow_ups: false, message: "Talk for 40 staff · from /health/partner-with-us" },
    ]);
    expect((await pool.query(`select count(*)::int as n from public.message_outbox`)).rows[0].n).toBe(0);
    const list = await (await route.GET(new NextRequest("https://x.in/health/api/monetization/leads?limit=5"))).json();
    expect(list.leads.map((l: { name: string }) => l.name)).toEqual(["Priya Sharma"]);
  });

  it("refuses a form without a mobile number and saves nothing", async () => {
    const res = await post({ name: "No Phone", email: "a@b.co", phone: "", service: "diet-consultation", message: "hi", consent: true }, "203.0.113.8");
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/10-digit mobile/);
    expect((await pool.query(`select count(*)::int as n from public.leads`)).rows[0].n).toBe(0);
  });
});
