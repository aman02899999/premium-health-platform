// The bell on a real Postgres (migrations applied):
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/admin/notifications.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("notifications on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let bell: typeof import("./notifications");

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    pool = (await import("@/health/db")).pool;
    bell = await import("./notifications");
  });
  beforeEach(async () => {
    await pool.query(
      "truncate public.social_inbox, public.leads, public.membership_orders, public.diet_orders, public.shop_orders, public.book_orders, public.payment_requests, public.reviews, public.message_outbox, public.ai_agent_log, public.admin_notification_state cascade",
    );
  });
  afterAll(async () => {
    await pool.end();
  });

  it("collects messages, hand-offs, leads, payments and failures, filtered by role, with read state per person", async () => {
    await pool.query(`insert into public.social_inbox (id, channel, kind, from_id, from_name, body, intent, created_at) values
      ('wa:1', 'whatsapp', 'message', '919811100001', 'Rahul', 'Couple plan kitne ka?', 'price', now() - interval '30 minutes'),
      ('wa:2', 'whatsapp', 'message', '919811100002', 'Neha', 'I want a refund for my membership', 'support', now() - interval '20 minutes'),
      ('wa:old', 'whatsapp', 'message', '919811100003', 'Old', 'hi', 'hello', now() - interval '5 days')`);
    await pool.query(`insert into public.leads (name, phone, source, interest) values ('Priya Sharma', '9811100004', 'website', 'membership')`);
    await pool.query(
      `insert into public.membership_orders (plan_id, plan_name, duration, name, phone, amount_paise, status, paid_at, razorpay_order_id) values ('m1', '1 Month', '1 month', 'Amit Kumar', '9811100005', 150000, 'paid', now() - interval '10 minutes', 'order_n1')`,
    );
    await pool.query(`insert into public.message_outbox (channel, to_address, to_name, kind, body, status, last_error, dedupe_key) values ('whatsapp', '919811100006', 'Sunil', 'renew-7', 'x', 'failed', 'Template not approved', 'n:1')`);

    const owner = await bell.notificationsFor("owner@gym.in", "owner");
    const kinds = new Set(owner.items.map((i) => i.kind));
    expect([...kinds].sort()).toEqual(["failed", "handoff", "lead", "message", "payment"]);
    expect(owner.items.find((i) => i.kind === "payment")).toMatchObject({ title: "₹1,500 paid: Membership", body: "Amit Kumar · 1 Month", href: "/admin/website?tab=payments" });
    expect(owner.items.find((i) => i.kind === "handoff")).toMatchObject({ title: "Neha needs a person (refund, cancellation or complaint)", href: "/admin/chats?peer=919811100002" });
    // The support message isn't also listed as an ordinary message, and 5-day-old ones are gone.
    expect(owner.items.filter((i) => i.kind === "message").map((i) => i.title)).toEqual(["Rahul on WhatsApp"]);
    expect(owner.unread).toBe(owner.items.length);

    // A desk agent doesn't see payments (that page is the owner's).
    const agent = await bell.notificationsFor("desk@gym.in", "agent");
    expect(agent.items.some((i) => i.kind === "payment")).toBe(false);
    expect(agent.items.some((i) => i.kind === "handoff")).toBe(true);

    await bell.markSeen("Owner@Gym.in");
    expect((await bell.notificationsFor("owner@gym.in", "owner")).unread).toBe(0);
    expect((await bell.notificationsFor("desk@gym.in", "agent")).unread).toBe(agent.items.length);
    await pool.query(`insert into public.leads (name, phone, source) values ('New Person', '9811100007', 'website')`);
    expect((await bell.notificationsFor("owner@gym.in", "owner")).unread).toBe(1);
  });
});
