// Command Center counters and analytics on a real Postgres:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/admin/hub-data.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("command center numbers on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let hub: typeof import("./hub-data");
  // 21 Oct 2026, 10:00 India time.
  const now = new Date("2026-10-21T04:30:00Z");

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    pool = (await import("@/health/db")).pool;
    hub = await import("./hub-data");
  });
  beforeEach(async () => {
    await pool.query("truncate public.leads, public.members, public.membership_orders, public.diet_orders, public.shop_orders, public.message_outbox, public.message_events, public.social_inbox, public.chat_replies, public.reviews cascade");
  });
  afterAll(async () => {
    await pool.end();
  });

  it("reads zeros from an empty database", async () => {
    const c = await hub.hubCounters(now);
    expect(c).toMatchObject({ chatsWaiting: 0, leadsToday: 0, revenue30: 0, activeMembers: 0, campaign7: { sent: 0 } });
  });

  it("counts chats waiting, leads, members, money, campaign delivery", async () => {
    // Two chats: one answered after the customer wrote, one still waiting.
    await pool.query(`insert into public.social_inbox (id, created_at, channel, kind, from_id, body) values
      ('a', now() - interval '2 hours', 'whatsapp', 'message', '919800000001', 'fees?'),
      ('b', now() - interval '1 hour', 'whatsapp', 'message', '919800000002', 'hi')`);
    await pool.query(`insert into public.chat_replies (to_id, body, ok, created_at) values ('919800000001', 'Fees are…', true, now() - interval '90 minutes')`);
    // A lead "today" (India time) the desk already called, and a real one from 2 days ago nobody has (that rule runs on the clock).
    await pool.query(`insert into public.leads (name, phone, created_at, status) values ('Asha', '9800000003', $1, 'contacted'), ('Ravi', '9800000004', now() - interval '2 days', 'new')`, [
      new Date("2026-10-21T03:00:00Z"), // 08:30 IST "today"
    ]);
    await pool.query(`insert into public.members (name, phone, plan_name, start_on, expires_on, referral_code) values
      ('Active', '9800000005', 'Monthly', '2026-10-01', '2026-10-25', 'ACT-1'),
      ('Later', '9800000006', 'Yearly', '2026-01-01', '2027-01-01', 'LAT-1'),
      ('Lapsed', '9800000007', 'Monthly', '2026-08-01', '2026-09-01', 'LAP-1')`);
    await pool.query(`insert into public.membership_orders (razorpay_order_id, status, plan_id, plan_name, duration, amount_paise, refunded_paise, name, phone, paid_at) values
      ('o1', 'paid', 'm', 'Monthly', '1 month', 150000, 50000, 'Asha', '9800000003', $1),
      ('o2', 'paid', 'm', 'Monthly', '1 month', 200000, 0, 'Old', '9800000008', $2),
      ('o3', 'created', 'm', 'Monthly', '1 month', 900000, 0, 'Unpaid', '9800000009', null)`, [new Date("2026-10-21T04:00:00Z"), new Date("2026-10-01T04:00:00Z")]);
    await pool.query(`insert into public.message_outbox (channel, to_address, kind, body, dedupe_key, status, sent_at, delivered_at, read_at, clicks) values
      ('whatsapp', '919800000010', 'campaign', 'x', 'campaign:c1:1', 'sent', now() - interval '1 day', now(), now(), 1),
      ('whatsapp', '919800000011', 'campaign', 'x', 'campaign:c1:2', 'sent', now() - interval '1 day', now(), null, 0),
      ('whatsapp', '919800000012', 'campaign', 'x', 'campaign:c1:3', 'pending', null, null, null, 0)`);

    const c = await hub.hubCounters(now);
    expect(c.chatsWaiting).toBe(1);
    expect(c.leadsToday).toBe(1);
    expect(c.leadsUncontacted).toBe(1);
    expect(c.activeMembers).toBe(2);
    expect(c.expiring7).toBe(1);
    expect(c.revenueToday).toBe(1000); // ₹1,500 paid, ₹500 refunded
    expect(c.pending).toBe(1);
    expect(c.campaign7).toEqual({ sent: 2, delivered: 2, read: 1, clicked: 1 });
  });

  it("analytics: day series in India time, previous period, sources, revenue by product", async () => {
    await pool.query(`insert into public.leads (name, phone, created_at, source) values
      ('Anil', '9800000013', '2026-10-20T19:00:00Z', 'home'),
      ('Bina', '9800000014', '2026-10-10T05:00:00Z', 'whatsapp-inbound'),
      ('Chetan', '9800000015', '2026-10-12T05:00:00Z', 'home')`);
    await pool.query(`insert into public.membership_orders (razorpay_order_id, status, plan_id, plan_name, duration, amount_paise, name, phone, paid_at) values
      ('p1', 'paid', 'm', 'Monthly', '1 month', 150000, 'Anil', '9800000013', '2026-10-21T02:00:00Z')`);
    const a = await hub.analyticsData(7, now);
    expect(a.from).toBe("2026-10-15");
    expect(a.days).toHaveLength(7);
    // 19:00 UTC on the 20th is 00:30 IST on the 21st.
    expect(a.days.at(-1)).toMatchObject({ day: "2026-10-21", leads: 1, revenue: 1500, orders: 1 });
    expect(a.previous.leads).toBe(2);
    expect(a.sources).toEqual([{ source: "home", leads: 1 }]);
    expect(a.revenueByKind).toEqual([{ kind: "Membership", rupees: 1500, orders: 1 }]);
  });
});
