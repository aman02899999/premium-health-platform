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

  it("keeps the email sequences in step with members added or renewed at the desk", async () => {
    const { saveDeskMember, memberById } = await import("./members");
    const { afterDeskMemberSaved } = await import("./hooks");
    const input = { name: "Desk Joiner", phone: "9876500001", email: "Desk@Example.com", planName: "Monthly", startOn: "2026-10-15", expiresOn: "2026-11-14", notes: "", reminders: true };

    // New joiner this week: marked as a member and onboarding starts.
    const joined = await saveDeskMember(input);
    await afterDeskMemberSaved(null, joined, "2026-10-16");
    expect(events.map((e) => [e.event, e.email])).toEqual([["member.joined", "desk@example.com"]]);

    // Renewed in cash: the renewal emails stop; no second onboarding.
    events.length = 0;
    const before = await memberById(joined.id);
    const renewed = await saveDeskMember({ ...input, expiresOn: "2026-12-14" }, joined.id);
    await afterDeskMemberSaved(before, renewed, "2026-11-10");
    expect(events.map((e) => e.event)).toEqual(["member.renewed"]);

    // A notes-only edit sends nothing.
    events.length = 0;
    await afterDeskMemberSaved(renewed, await saveDeskMember({ ...input, expiresOn: "2026-12-14", notes: "paid cash" }, joined.id), "2026-11-10");
    expect(events).toEqual([]);

    // A long-standing member typed in now doesn't get "your first week" emails.
    const old = await saveDeskMember({ ...input, phone: "9876500002", email: "old@example.com", startOn: "2026-01-01" });
    await afterDeskMemberSaved(null, old, "2026-10-16");
    expect(events).toEqual([]);
  });

  it("sends the win-back event once, a month after a membership ended without a renewal", async () => {
    await member("Lapsed", "9876500010", "lapsed@example.com", "2026-10-21");
    await member("Too recent", "9876500011", "recent@example.com", "2026-11-01");
    await member("No email", "9876500012", null, "2026-10-21");
    await member("Opted out", "9876500013", "optout@example.com", "2026-10-21", false);
    await daily.runDaily(new Date("2026-11-20T02:15:00Z"));
    await daily.runDaily(new Date("2026-11-21T02:15:00Z"));
    expect(events.filter((e) => e.event === "member.inactive").map((e) => e.email)).toEqual(["lapsed@example.com"]);
  });
});
