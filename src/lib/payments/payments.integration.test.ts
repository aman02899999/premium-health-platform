// Real-database test of the Razorpay webhook processing and reconciliation
// (see src/lib/growth/db.integration.test.ts for how to run it). Razorpay itself is never called:
// events are built here and the payments API is a stubbed fetch.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/content/store", () => ({ getContent: async () => ({ business: { name: "Royal Fitness Club", phone: "+91 88518 30081" } }) }));

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("Razorpay payments on a real database", () => {
  let pool: import("pg").Pool;
  let proc: typeof import("./process");
  let ledger: typeof import("./ledger");
  let reconcile: typeof import("./reconcile");
  let library: typeof import("@/lib/library/orders");
  let ev: typeof import("./webhook-event");
  const noDefer = () => {}; // the diet plan PDF is not built in tests

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    delete process.env.WHATSAPP_TOKEN;
    delete process.env.RESEND_API_KEY;
    pool = (await import("@/health/db")).pool;
    proc = await import("./process");
    ledger = await import("./ledger");
    reconcile = await import("./reconcile");
    library = await import("@/lib/library/orders");
    ev = await import("./webhook-event");
  });
  beforeEach(async () => {
    await pool.query(
      "truncate public.payment_events, public.referral_rewards, public.message_outbox, public.members, public.membership_orders, public.book_orders, public.payment_requests, public.diet_orders, public.shop_orders, public.shop_products cascade",
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  afterAll(async () => {
    await pool.end();
  });

  const membership = (rzp: string, amount = 200000, status = "created", createdAt = "now()") =>
    pool.query(
      `insert into public.membership_orders (razorpay_order_id, plan_id, plan_name, duration, amount_paise, name, phone, status, created_at)
       values ($1, 'monthly', 'Monthly', '1 month', $2, 'Aman Sharma', '9876543210', $3, ${createdAt})`,
      [rzp, amount, status],
    );
  const book = (rzp: string, token = "tok_abcdefghijklmnopqrstuv") =>
    pool.query(
      `insert into public.book_orders (razorpay_order_id, item_id, title, slugs, amount_paise, name, email, phone, access_token)
       values ($1, 'book:a', 'Book A', array['a'], 49900, 'Aman', 'a@example.com', '9876543210', $2)`,
      [rzp, token],
    );
  const shop = async (rzp: string, stock = 1) => {
    const { rows } = await pool.query<{ id: string }>(
      `insert into public.shop_products (slug, name, brand, list_price, stock, size) values ('whey', 'Whey', 'B', 3000, $1, '1 kg') returning id`,
      [stock],
    );
    await pool.query(
      `insert into public.shop_orders (number, razorpay_order_id, name, email, phone, address, items, list_total, discount_total, shipping, total)
       values ('RS-ABCDEFGH', $1, 'Aman', 'a@example.com', '9876543210', '{}', $2, 3000, 0, 0, 3000)`,
      [rzp, JSON.stringify([{ kind: "product", id: rows[0].id, slug: "whey", name: "Whey", qty: 1, unitList: 3000, unitPrice: 3000 }])],
    );
    return rows[0].id;
  };
  const captured = (orderId: string, paymentId: string, amount: number, eventId = `evt_${paymentId}`, currency = "INR") =>
    ev.parseRazorpayEvent(
      JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: paymentId, order_id: orderId, amount, currency, status: "captured" } } } }),
      eventId,
    )!;
  const status = async (table: string, rzp: string) => (await pool.query(`select status, razorpay_payment_id, refunded_paise, disputed_at from public.${table} where razorpay_order_id = $1`, [rzp])).rows[0];

  it("a captured membership payment is applied once, however many times it is delivered", async () => {
    await membership("order_M1");
    const e = captured("order_M1", "pay_1", 200000);
    const results = await Promise.all([proc.handleRazorpayEvent(e, noDefer), proc.handleRazorpayEvent(e, noDefer), proc.handleRazorpayEvent(e, noDefer)]);
    expect(results.every((r) => r.status === 200)).toBe(true);
    expect(results.filter((r) => r.outcome === "applied").length).toBeGreaterThanOrEqual(1);
    expect((await status("membership_orders", "order_M1")).status).toBe("paid");
    // Another event id for the same payment (Razorpay can resend) still adds no second membership.
    await proc.handleRazorpayEvent(captured("order_M1", "pay_1", 200000, "evt_other"), noDefer);
    const { rows } = await pool.query("select expires_on from public.members");
    expect(rows).toHaveLength(1);
    const welcome = await pool.query("select 1 from public.message_outbox where kind = 'welcome'");
    expect(welcome.rowCount).toBe(1);
    const { rows: ev1 } = await pool.query("select attempts, outcome from public.payment_events where event_id = 'evt_pay_1'");
    expect(ev1[0]).toMatchObject({ attempts: 3, outcome: "applied" });
  });

  it("refuses a capture whose amount or currency differs from the order, and flags it", async () => {
    await membership("order_M2");
    const r = await proc.handleRazorpayEvent(captured("order_M2", "pay_2", 100), noDefer);
    expect(r).toMatchObject({ status: 200, outcome: "amount_mismatch", purchase: false });
    expect((await status("membership_orders", "order_M2")).status).toBe("created");
    const usd = await proc.handleRazorpayEvent(captured("order_M2", "pay_3", 200000, "evt_usd", "USD"), noDefer);
    expect(usd.outcome).toBe("amount_mismatch");
    expect((await ledger.flaggedEvents()).map((f) => f.outcome)).toEqual(["amount_mismatch", "amount_mismatch"]);
  });

  it("an unknown order id changes nothing and is flagged", async () => {
    const r = await proc.handleRazorpayEvent(captured("order_nope", "pay_4", 5000), noDefer);
    expect(r.outcome).toBe("unknown_order");
    expect(await pool.query("select 1 from public.members").then((x) => x.rowCount)).toBe(0);
  });

  it("a late payment.failed never undoes a captured payment; failed then captured ends paid", async () => {
    await membership("order_M3");
    await proc.handleRazorpayEvent(captured("order_M3", "pay_5", 200000), noDefer);
    const failed = ev.parseRazorpayEvent(JSON.stringify({ event: "payment.failed", payload: { payment: { entity: { id: "pay_x", order_id: "order_M3", amount: 200000, currency: "INR" } } } }), "evt_f1")!;
    await proc.handleRazorpayEvent(failed, noDefer);
    expect((await status("membership_orders", "order_M3")).status).toBe("paid");

    await membership("order_M4");
    const failed2 = ev.parseRazorpayEvent(JSON.stringify({ event: "payment.failed", payload: { payment: { entity: { id: "pay_y", order_id: "order_M4" } } } }), "evt_f2")!;
    await proc.handleRazorpayEvent(failed2, noDefer);
    expect((await status("membership_orders", "order_M4")).status).toBe("failed");
    await proc.handleRazorpayEvent(captured("order_M4", "pay_6", 200000), noDefer);
    expect((await status("membership_orders", "order_M4")).status).toBe("paid");
  });

  it("a second payment on a paid order is applied once and flagged for a refund", async () => {
    await membership("order_M5");
    await proc.handleRazorpayEvent(captured("order_M5", "pay_7", 200000), noDefer);
    const r = await proc.handleRazorpayEvent(captured("order_M5", "pay_8", 200000), noDefer);
    expect(r.outcome).toBe("applied");
    expect(r.detail).toMatch(/Second payment/);
    expect((await status("membership_orders", "order_M5")).razorpay_payment_id).toBe("pay_7");
    expect((await pool.query("select 1 from public.members")).rowCount).toBe(1);
  });

  it("store stock is taken once per payment, across webhook retries", async () => {
    const productId = await shop("order_S1", 3);
    await proc.handleRazorpayEvent(captured("order_S1", "pay_9", 300000), noDefer);
    await proc.handleRazorpayEvent(captured("order_S1", "pay_9", 300000, "evt_again"), noDefer);
    const { rows } = await pool.query("select stock from public.shop_products where id = $1", [productId]);
    expect(rows[0].stock).toBe(2);
    // The store total is in rupees: a capture in paise must match total × 100.
    expect((await ledger.findOrder("order_S1"))?.amountPaise).toBe(300000);
  });

  it("refunds keep the running total (no double counting) and a full refund ends book access", async () => {
    await book("order_B1");
    await proc.handleRazorpayEvent(captured("order_B1", "pay_10", 49900), noDefer);
    expect(await library.orderByToken("tok_abcdefghijklmnopqrstuv")).not.toBeNull();
    const refund = (refunded: number, id: string) =>
      ev.parseRazorpayEvent(
        JSON.stringify({ event: "refund.processed", payload: { refund: { entity: { id, payment_id: "pay_10", amount: 10000 } }, payment: { entity: { id: "pay_10", order_id: "order_B1", amount: 49900, currency: "INR", amount_refunded: refunded } } } }),
        `evt_${id}`,
      )!;
    await proc.handleRazorpayEvent(refund(10000, "rfnd_1"), noDefer);
    await proc.handleRazorpayEvent(refund(10000, "rfnd_1_dup"), noDefer); // same total, delivered again
    expect((await status("book_orders", "order_B1")).refunded_paise).toBe(10000);
    expect(await library.orderByToken("tok_abcdefghijklmnopqrstuv")).not.toBeNull(); // partial refund keeps access
    await proc.handleRazorpayEvent(refund(49900, "rfnd_2"), noDefer);
    await proc.handleRazorpayEvent(refund(10000, "rfnd_1_late"), noDefer); // an old total arriving late
    expect((await status("book_orders", "order_B1")).refunded_paise).toBe(49900);
    expect((await status("book_orders", "order_B1")).status).toBe("paid"); // still a sale, now refunded
    expect(await library.orderByToken("tok_abcdefghijklmnopqrstuv")).toBeNull();
  });

  it("a library payment emails the download link once, from the webhook or the browser", async () => {
    await book("order_B2");
    await proc.handleRazorpayEvent(captured("order_B2", "pay_20", 49900), noDefer);
    await proc.handleRazorpayEvent(captured("order_B2", "pay_20", 49900, "evt_pay_20_retry"), noDefer);
    await library.afterBookPaid("order_B2", "pay_20"); // the buyer's browser reaches verify too
    const { rows } = await pool.query("select to_address, kind, body from public.message_outbox where kind = 'book-access-email'");
    expect(rows).toHaveLength(1);
    expect(rows[0].to_address).toBe("a@example.com");
    expect(rows[0].body).toContain("/library/access/tok_abcdefghijklmnopqrstuv");
  });

  it("a chargeback marks the order disputed", async () => {
    await membership("order_M6");
    await proc.handleRazorpayEvent(captured("order_M6", "pay_11", 200000), noDefer);
    const dispute = ev.parseRazorpayEvent(JSON.stringify({ event: "payment.dispute.created", payload: { dispute: { entity: { id: "disp_1", payment_id: "pay_11", amount: 200000 } } } }), "evt_d1")!;
    expect((await proc.handleRazorpayEvent(dispute, noDefer)).outcome).toBe("applied");
    expect((await status("membership_orders", "order_M6")).disputed_at).not.toBeNull();
  });

  it("a delivery that fails mid-way stays open, and Razorpay's retry finishes it", async () => {
    await membership("order_M7");
    const e = captured("order_M7", "pay_12", 200000);
    await pool.query("alter table public.membership_orders add constraint block_paid check (status <> 'paid') not valid");
    try {
      const first = await proc.handleRazorpayEvent(e, noDefer);
      expect(first).toMatchObject({ status: 500, outcome: "error" });
    } finally {
      await pool.query("alter table public.membership_orders drop constraint block_paid");
    }
    const retry = await proc.handleRazorpayEvent(e, noDefer);
    expect(retry).toMatchObject({ status: 200, outcome: "applied" });
    expect((await status("membership_orders", "order_M7")).status).toBe("paid");
  });

  it("reconciliation applies a payment Razorpay captured but the site never heard about", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_x");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "s");
    await membership("order_R1abcdef", 200000, "created", "now() - interval '1 hour'");
    await membership("order_R2abcdef", 200000, "created", "now() - interval '1 hour'");
    await membership("order_R3abcdef", 200000, "created", "now() - interval '1 hour'");
    await membership("order_R4abcdef", 200000, "created", "now() - interval '5 minutes'"); // buyer may still be paying
    const fetch = vi.fn(async (u: string) => {
      const items =
        u.includes("order_R1") ? [{ id: "pay_f", order_id: "order_R1abcdef", amount: 200000, currency: "INR", status: "failed" }, { id: "pay_r1", order_id: "order_R1abcdef", amount: 200000, currency: "INR", status: "captured" }]
        : u.includes("order_R2") ? [{ id: "pay_r2", order_id: "order_R2abcdef", amount: 100, currency: "INR", status: "captured" }]
        : [];
      return new Response(JSON.stringify({ items }));
    });
    vi.stubGlobal("fetch", fetch);
    const res = await reconcile.reconcilePayments();
    expect(res.checked).toBe(3);
    expect(res.recovered).toEqual([{ kind: "membership", razorpayOrderId: "order_R1abcdef", paymentId: "pay_r1" }]);
    expect(res.mismatched[0]).toMatch(/order_R2abcdef/);
    expect((await status("membership_orders", "order_R1abcdef")).status).toBe("paid");
    expect((await status("membership_orders", "order_R2abcdef")).status).toBe("created");
    expect(fetch.mock.calls.every(([u]) => /\/v1\/orders\/order_R[123]abcdef\/payments$/.test(u as string))).toBe(true);
    // Running it again changes nothing: the recovered order is paid now.
    expect((await reconcile.reconcilePayments()).recovered).toEqual([]);
    expect((await pool.query("select 1 from public.members")).rowCount).toBe(1);
  });

  it("reconciliation does nothing without Razorpay keys", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect((await reconcile.reconcilePayments()).checked).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });
});
