// Google review requests on a real Postgres:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/growth/reviews.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const url = process.env.TEST_DATABASE_URL;
const TODAY = "2026-10-18";
const BIZ = { name: "Royal Fitness Club", phone: "+91 88518 30081", siteUrl: "https://example.in" };
const MAPS = "https://www.google.com/maps?cid=1";
const REVIEW = "https://g.page/r/abc/review";

describe.skipIf(!url)("review requests on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let rv: typeof import("./reviews");
  let outbox: typeof import("./outbox");
  const sent: { to: string; template?: string }[] = [];

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    process.env.WHATSAPP_TOKEN = "t";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123";
    vi.stubGlobal("fetch", async (u: string, init?: { body?: string }) => {
      const b = JSON.parse(init?.body ?? "{}");
      if (u.endsWith("/123/messages")) sent.push({ to: b.to, template: b.template?.name });
      return new Response(JSON.stringify({ messages: [{ id: `wamid.${sent.length}` }] }), { headers: { "content-type": "application/json" } });
    });
    pool = (await import("@/health/db")).pool;
    rv = await import("./reviews");
    outbox = await import("./outbox");
  });
  beforeEach(async () => {
    await pool.query("truncate public.message_outbox, public.whatsapp_optouts, public.marketing_contacts, public.diet_orders, public.members cascade");
    sent.length = 0;
  });
  afterAll(async () => {
    vi.unstubAllGlobals();
    await pool.end();
  });

  const member = (name: string, phone: string, startDaysAgo: number, email: string | null = null, expiresInDays = 60) =>
    pool.query(`insert into public.members (name, phone, email, plan_name, start_on, expires_on, referral_code) values ($1, $2, $3, 'Monthly', $4::date - $5::int, $4::date + $6::int, $7)`, [
      name,
      phone,
      email,
      TODAY,
      startDaysAgo,
      expiresInDays,
      `RFC-${phone.slice(-4)}-ABCD`,
    ]);
  const dietClient = (name: string, phone: string, email: string, paidDaysAgo: number, stage = "sent") =>
    pool.query(
      `insert into public.diet_orders (razorpay_order_id, amount_paise, name, phone, email, intake, consent_at, plan, status, stage, paid_at)
       values ($1, 4900, $2, $3, $4, '{}', now(), 'trial', 'paid', $5, $6::date - $7::int + interval '10 hours')`,
      [`order_${Math.random()}`, name, phone, email, stage, TODAY, paidDaysAgo],
    );

  it("stays off until a real review link is set (the Maps link doesn't count)", async () => {
    await member("Asha Rani", "9000000101", 28, "asha@x.in");
    expect(await rv.dueReviewRequests(TODAY, BIZ, MAPS, MAPS)).toEqual([]);
    expect(await rv.dueReviewRequests(TODAY, BIZ, "", MAPS)).toEqual([]);
    expect(await rv.dueReviewRequests(TODAY, BIZ, "http://insecure.example/review", MAPS)).toEqual([]);
  });

  it("asks members a month in and diet clients a week after their plan, once per person, skipping unsubscribes", async () => {
    await member("Asha Rani", "9000000101", 28, "asha@x.in"); // in window
    await member("Too New", "9000000102", 10); // started 10 days ago
    await member("Long Time", "9000000103", 90); // started 3 months ago
    await member("Expired Ex", "9000000104", 30, null, -2); // in window but membership ended
    await dietClient("Priya Verma", "9000000201", "Priya@X.in", 10); // plan sent 10 days ago
    await dietClient("Waiting Plan", "9000000202", "wait@x.in", 10, "draft_ready"); // not sent yet
    await dietClient("Asha Rani", "9000000101", "asha@x.in", 9); // same person as the member
    await pool.query(`insert into public.marketing_contacts (channel, address, source, consent_at, unsubscribed_at) values ('email', 'priya@x.in', 'test', now(), now())`);

    const drafts = await rv.dueReviewRequests(TODAY, BIZ, REVIEW, MAPS);
    expect(drafts.map((d) => `${d.channel}:${d.to}`).sort()).toEqual(["email:asha@x.in", "whatsapp:919000000101", "whatsapp:919000000201"]);
    const wa = drafts.find((d) => d.to === "919000000201")!;
    expect(wa).toMatchObject({ kind: "review-request", template: "rfc_review_request_v1", params: ["Priya", "Royal Fitness Club", REVIEW] });
    expect(drafts.find((d) => d.channel === "email")!.body).toContain(`[[CTA:Write a Google review|${REVIEW}]]`);

    // Queued twice (two daily runs, a week apart): still one ask each.
    expect(await outbox.enqueue(drafts)).toBe(3);
    expect(await outbox.enqueue(await rv.dueReviewRequests(TODAY, BIZ, REVIEW, MAPS))).toBe(0);
  });

  it("never sends the WhatsApp ask to a number that tapped Stop promotions", async () => {
    await member("Asha Rani", "9000000101", 28);
    await pool.query(`insert into public.whatsapp_optouts (phone) values ('919000000101')`);
    await outbox.enqueue(await rv.dueReviewRequests(TODAY, BIZ, REVIEW, MAPS));
    await outbox.dispatch();
    expect(sent).toEqual([]);
    expect((await pool.query(`select status from public.message_outbox`)).rows).toEqual([{ status: "cancelled" }]);
  });
});
