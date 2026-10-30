// Day-7 review reminders on a real Postgres:
//   TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5433/rfc_test npx vitest run src/lib/growth/trial-review.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const url = process.env.TEST_DATABASE_URL;
const TODAY = "2026-10-29";
const BIZ = { name: "Royal Fitness Club", phone: "+91 88518 30081", siteUrl: "https://example.in" };

describe.skipIf(!url)("Day-7 review reminders on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let tr: typeof import("./trial-review");
  let outbox: typeof import("./outbox");

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    pool = (await import("@/health/db")).pool;
    tr = await import("./trial-review");
    outbox = await import("./outbox");
  });
  beforeEach(async () => {
    await pool.query("truncate public.message_outbox, public.marketing_contacts, public.diet_orders cascade");
  });
  afterAll(async () => {
    await pool.end();
  });

  // sentDaysAgo is counted in India time: "6" = the plan went out six calendar days before TODAY.
  const order = (name: string, phone: string, o: { plan?: string; status?: string; stage?: string; sentDaysAgo: number; email?: string | null }) =>
    pool.query(
      `insert into public.diet_orders (razorpay_order_id, amount_paise, name, phone, email, intake, consent_at, plan, status, stage, paid_at, sent_at)
       values ($1, 4900, $2, $3, $4, '{}', now(), $5, $6, $7, ($8::date - $9::int) + interval '4 hours', ($8::date - $9::int) + interval '4 hours')`,
      [`order_${Math.random()}`, name, phone, o.email === undefined ? `${name.toLowerCase()}@example.com` : o.email, o.plan ?? "trial", o.status ?? "paid", o.stage ?? "sent", TODAY, o.sentDaysAgo],
    );

  it("reminds trial buyers 6–7 days after their plan went out, and only them", async () => {
    await order("Six", "9876500006", { sentDaysAgo: 6 });
    await order("Seven", "9876500007", { sentDaysAgo: 7 });
    await order("Five", "9876500005", { sentDaysAgo: 5 });
    await order("Eight", "9876500008", { sentDaysAgo: 8 });
    await order("Full", "9876500009", { sentDaysAgo: 6, plan: "3m" });
    await order("Draft", "9876500010", { sentDaysAgo: 6, stage: "draft_ready" });
    await order("Unpaid", "9876500011", { sentDaysAgo: 6, status: "created", stage: "new" });

    const drafts = await tr.dueTrialReviews(TODAY, BIZ, "Coach Aman");
    expect(new Set(drafts.map((d) => d.toName))).toEqual(new Set(["Six", "Seven"]));
    expect(drafts).toHaveLength(4);
  });

  it("queues once, however many times the daily run happens", async () => {
    await order("Six", "9876500006", { sentDaysAgo: 6 });
    expect(await outbox.enqueue(await tr.dueTrialReviews(TODAY, BIZ, "Coach Aman"))).toBe(2);
    expect(await outbox.enqueue(await tr.dueTrialReviews(TODAY, BIZ, "Coach Aman"))).toBe(0);
    expect(await outbox.enqueue(await tr.dueTrialReviews("2026-10-30", BIZ, "Coach Aman"))).toBe(0);
  });

  it("doesn't email someone who unsubscribed (WhatsApp still goes: it's about their own plan)", async () => {
    await order("Six", "9876500006", { sentDaysAgo: 6 });
    await pool.query(`insert into public.marketing_contacts (channel, address, consent_at, unsubscribed_at) values ('email', 'six@example.com', now(), now())`);
    const drafts = await tr.dueTrialReviews(TODAY, BIZ, "Coach Aman");
    expect(drafts.map((d) => d.channel)).toEqual(["whatsapp"]);
  });
});
