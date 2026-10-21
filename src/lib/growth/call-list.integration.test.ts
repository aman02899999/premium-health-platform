// The call list on a real Postgres (migrations applied):
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/growth/call-list.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("call list on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let calls: typeof import("./call-list");
  let campaign = "";

  /** A promotion sent `hoursAgo`, from the campaign. */
  const promo = (phone: string, hoursAgo: number, extra: Record<string, unknown> = {}) =>
    pool.query(
      `insert into public.message_outbox (channel, to_address, to_name, kind, body, template, params, dedupe_key, status, sent_at, clicks, first_click_at)
       values ('whatsapp', $1, $2, 'offer-broadcast', 'offer', 'rfc_offer', '[]', $3, 'sent', now() - make_interval(hours => $4), $5, $6)`,
      [phone, extra.name ?? "Promo Name", `campaign:${campaign}:${phone}`, hoursAgo, extra.clicks ?? 0, extra.clickedAt ?? null],
    );
  const inbound = (phone: string, hoursAgo: number, body: string, name = "Rahul") =>
    pool.query(`insert into public.social_inbox (id, channel, kind, from_id, from_name, body, intent, created_at) values ($1, 'whatsapp', 'message', $2, $3, $4, 'other', now() - make_interval(hours => $5))`, [
      `wa:${phone}:${hoursAgo}:${Math.random()}`,
      phone,
      name,
      body,
      hoursAgo,
    ]);

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    pool = (await import("@/health/db")).pool;
    calls = await import("./call-list");
  });
  beforeEach(async () => {
    await pool.query(
      "truncate public.message_outbox, public.social_inbox, public.chat_replies, public.leads, public.members, public.whatsapp_optouts, public.prospect_calls, public.campaigns, public.membership_orders, public.diet_orders, public.shop_orders, public.book_orders, public.payment_requests, public.audience_contacts, public.marketing_contacts cascade",
    );
    const { rows } = await pool.query<{ id: string }>(`insert into public.campaigns (name, segment, channel, offer, link) values ('Diwali offer', 'imported', 'whatsapp', 'Festive offer for you', '') returning id`);
    campaign = rows[0].id;
  });
  afterAll(async () => {
    await pool.end();
  });

  it("lists people who replied to the offer, with what they said", async () => {
    await promo("919811100001", 20);
    await inbound("919811100001", 2, "kitne ka hai?");
    // Messaged before the offer arrived: not a reply to it.
    await promo("919811100002", 5);
    await inbound("919811100002", 10, "hello");
    const list = await calls.callList();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ contact: "9811100001", phone: "9811100001", name: "Rahul", type: "replied", why: "Replied to “Diwali offer”: “kitne ka hai?”" });
  });

  it("lists link clicks, mapping an email click to a phone when known", async () => {
    await promo("919811100003", 30, { clicks: 1, clickedAt: new Date(Date.now() - 3_600_000) });
    await pool.query(
      `insert into public.message_outbox (channel, to_address, to_name, kind, body, dedupe_key, status, sent_at, clicks, first_click_at, subject)
       values ('email', 'priya@mail.com', 'Priya', 'nurture-campaign', 'x', $1, 'sent', now() - interval '1 day', 2, now() - interval '30 minutes', 'Offer')`,
      [`campaign:${campaign}:priya@mail.com`],
    );
    await pool.query(`insert into public.audience_contacts (name, phone, email, tag) values ('Priya', '9811100004', 'priya@mail.com', '')`);
    const list = await calls.callList();
    expect(list.map((p) => [p.contact, p.type, p.name])).toEqual([
      ["9811100004", "clicked", "Priya"],
      ["9811100003", "clicked", "Promo Name"],
    ]);
  });

  it("leaves out members, payers, opt-outs and people a coach already wrote to", async () => {
    for (const p of ["919811100011", "919811100012", "919811100013", "919811100014", "919811100015"]) {
      await promo(p, 20);
      await inbound(p, 2, "details?");
    }
    await pool.query(`insert into public.members (name, phone, plan_name, start_on, expires_on, referral_code) values ('Member One', '9811100011', '1 Month', current_date - 5, current_date + 25, 'RFC-M-AAAA')`);
    await pool.query(
      `insert into public.membership_orders (plan_id, plan_name, duration, name, phone, amount_paise, status, paid_at, razorpay_order_id) values ('m1', '1 Month', '1 month', 'Payer One', '9811100012', 100000, 'paid', now() - interval '1 hour', 'order_x1')`,
    );
    await pool.query(`insert into public.whatsapp_optouts (phone) values ('919811100013')`);
    await pool.query(`insert into public.chat_replies (channel, to_id, body, sent_by, ok) values ('whatsapp', '919811100014', 'Hi, calling you now', 'coach@gym.in', true)`);
    // The bot's own answer doesn't count as a person getting back to them.
    await pool.query(`insert into public.chat_replies (channel, to_id, body, sent_by, ok) values ('whatsapp', '919811100015', 'Fees: …', 'auto-reply', true)`);
    expect((await calls.callList()).map((p) => p.contact)).toEqual(["9811100015"]);
    expect(await calls.callListCount()).toBe(1);
  });

  it("records outcomes: interested becomes a contacted lead, no answer comes back tomorrow, not interested drops off", async () => {
    for (const p of ["919811100021", "919811100022", "919811100023"]) {
      await promo(p, 20);
      await inbound(p, 2, "price?", `Name ${p.slice(-2)}`);
    }
    const r = await calls.logCall("919811100021", "interested", "Wants evening batch", "desk@gym.in", "Name 21");
    expect(r.ok && r.leadId).toBeTruthy();
    const { rows: lead } = await pool.query(`select name, phone, status, source, notes, contacted_at is not null as contacted from public.leads`);
    expect(lead).toEqual([{ name: "Name 21", phone: "9811100021", status: "contacted", source: "campaign-call", notes: "Wants evening batch", contacted: true }]);
    await calls.logCall("9811100022", "no-answer", "", "desk@gym.in");
    await calls.logCall("9811100023", "not-interested", "", "desk@gym.in");
    expect(await calls.callList()).toEqual([]);
    // 21 hours later the no-answer is back for a second try.
    const later = await calls.callList(new Date(Date.now() + 21 * 3_600_000));
    expect(later.map((p) => [p.contact, p.tries])).toEqual([["9811100022", 1]]);
    expect(await calls.logCall("12345", "interested", "", "x")).toEqual({ ok: false, error: "That isn't a valid mobile number or email." });
  });

  it("an interested caller who is already a lead keeps that lead", async () => {
    await promo("919811100031", 20);
    await inbound("919811100031", 2, "join kaise kare");
    await pool.query(`insert into public.leads (name, phone, source, status) values ('Old Lead', '9811100031', 'website', 'new')`);
    await calls.logCall("919811100031", "interested", "", "desk@gym.in");
    expect((await pool.query(`select name, status from public.leads`)).rows).toEqual([{ name: "Old Lead", status: "contacted" }]);
  });
});
