// The Resend "membership.expiring" event goes out once per member per end date, even when the
// daily run happens twice on the same day:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/growth/automation-events.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/content/store", () => ({
  getContent: async () => ({ business: { name: "Royal Fitness Club", phone: "+91 88518 30081", address: { street: "Main Road", locality: "Sector 93", city: "Noida", postalCode: "201304" } } }),
}));

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("renewal email event in the daily run", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let daily: typeof import("./daily");
  const events: { event: string; email: string; payload?: Record<string, string> }[] = [];

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    for (const k of ["WHATSAPP_TOKEN", "EMAIL_FROM", "INSTAGRAM_ACCESS_TOKEN", "FACEBOOK_PAGE_ID", "FACEBOOK_PAGE_TOKEN", "COACH_EMAIL"]) delete process.env[k];
    process.env.RESEND_API_KEY = "re_test";
    vi.stubGlobal("fetch", async (u: string, init?: { body?: string }) => {
      if (u.endsWith("/events/send")) events.push(JSON.parse(init!.body!));
      return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
    });
    pool = (await import("@/health/db")).pool;
    daily = await import("./daily");
  });
  beforeEach(async () => {
    await pool.query("truncate public.members, public.automation_events, public.message_outbox cascade");
    events.length = 0;
  });
  afterAll(async () => {
    delete process.env.RESEND_API_KEY;
    vi.unstubAllGlobals();
    await pool.end();
  });

  const member = (name: string, phone: string, email: string | null, expires: string, reminders = true) =>
    pool.query(
      `insert into public.members (name, phone, email, plan_name, start_on, expires_on, referral_code, reminders) values ($1, $2, $3, 'Monthly', '2026-09-23', $4, $5, $6)`,
      [name, phone, email, expires, `RFC-${phone.slice(-4)}-1234`, reminders],
    );

  it("fires once 7 days out, never twice the same day, and not for members without email or reminders", async () => {
    await member("Asha Rao", "9876543210", "Asha@Example.com", "2026-10-28");
    await member("No Mail", "9876543211", null, "2026-10-28");
    await member("Opted Out", "9876543212", "out@example.com", "2026-10-28", false);
    await member("Later", "9876543213", "later@example.com", "2026-11-05");

    const morning = new Date("2026-10-21T02:15:00Z"); // 21 Oct in India: Asha's end date is 7 days away
    await daily.runDaily(morning);
    await daily.runDaily(new Date("2026-10-21T09:30:00Z")); // "Run now" later the same day
    expect(events.filter((e) => e.event === "membership.expiring")).toEqual([{ event: "membership.expiring", email: "asha@example.com", payload: { expiry_date: "on 28 Oct 2026" } }]);

    // A renewal moves the end date: the next 7-day mark gets its own reminder.
    await pool.query(`update public.members set expires_on = '2026-11-28' where phone = '9876543210'`);
    await daily.runDaily(new Date("2026-11-21T02:15:00Z"));
    expect(events.filter((e) => e.event === "membership.expiring").map((e) => e.payload!.expiry_date)).toEqual(["on 28 Oct 2026", "on 28 Nov 2026"]);
  });
});
