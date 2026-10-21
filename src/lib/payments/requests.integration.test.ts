// Payment requests on a real database: create → order (once) → paid by verify or webhook (once)
// → receipt in the chat → refund → counted in revenue. Razorpay and WhatsApp are stubbed fetches.
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/payments/requests.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/content/store", () => ({ getContent: async () => ({ business: { name: "Royal Fitness Club", phone: "+91 88518 30081" } }) }));

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("payment requests on a real database", () => {
  let pool: import("pg").Pool;
  let req: typeof import("./requests");
  let proc: typeof import("./process");
  let ledger: typeof import("./ledger");
  let ev: typeof import("./webhook-event");
  let hub: typeof import("@/lib/admin/hub-data");
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  let orderSeq = 0;

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    process.env.RAZORPAY_KEY_ID = "rzp_test_x";
    process.env.RAZORPAY_KEY_SECRET = "secret";
    process.env.WHATSAPP_TOKEN = "t";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123";
    vi.stubGlobal("fetch", async (u: string, init?: { body?: string }) => {
      const body = JSON.parse(init?.body ?? "{}");
      calls.push({ url: u, body });
      if (u.endsWith("/v1/orders")) return new Response(JSON.stringify({ id: `order_R${++orderSeq}`, amount: body.amount, currency: "INR", receipt: body.receipt, status: "created" }), { status: 200 });
      return new Response(JSON.stringify({ messages: [{ id: "wamid.x" }] }), { status: 200, headers: { "content-type": "application/json" } });
    });
    pool = (await import("@/health/db")).pool;
    req = await import("./requests");
    proc = await import("./process");
    ledger = await import("./ledger");
    ev = await import("./webhook-event");
    hub = await import("@/lib/admin/hub-data");
  });
  beforeEach(async () => {
    await pool.query("truncate public.payment_requests, public.payment_events, public.chat_replies, public.membership_orders, public.diet_orders, public.shop_orders, public.book_orders cascade");
    calls.length = 0;
  });
  afterAll(async () => {
    vi.unstubAllGlobals();
    await pool.end();
  });

  const captured = (orderId: string, paymentId: string, amount: number) =>
    ev.parseRazorpayEvent(JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: paymentId, order_id: orderId, amount, currency: "INR", status: "captured" } } } }), `evt_${paymentId}`)!;

  it("validates, then one link → one Razorpay order however often it's opened", async () => {
    expect(await req.createRequest({ purpose: "x", amount: "100" }, "desk")).toMatchObject({ ok: false });
    expect(await req.createRequest({ purpose: "Personal training", amount: "0" }, "desk")).toMatchObject({ ok: false });
    const r = await req.createRequest({ purpose: "Personal training (1 month)", amount: "6,000", peer: "919811111111", name: "Rahul" }, "desk@x.in");
    if (!r.ok) throw new Error(r.error);
    expect(r.request).toMatchObject({ rupees: 6000, phone: "9811111111", state: "open", name: "Rahul" });
    expect(r.request.url).toMatch(/\/pay\/[A-Za-z0-9]{16}$/);
    const a = await req.startRequestOrder(r.request.token);
    const b = await req.startRequestOrder(r.request.token);
    expect(a).toMatchObject({ ok: true, amount: 600000, description: "Personal training (1 month)", prefill: { contact: "+919811111111" } });
    expect(a.ok && b.ok && a.orderId === b.orderId).toBe(true);
    expect(calls.filter((c) => c.url.endsWith("/v1/orders"))).toHaveLength(1);
    expect(await req.startRequestOrder("ZZZZZZZZZZZZZZZZ")).toMatchObject({ ok: false, status: 404 });
  });

  it("paid once via the webhook (and the browser), with a WhatsApp receipt; refunds are recorded", async () => {
    const r = await req.createRequest({ purpose: "Diet consultation", amount: 999, peer: "919811111111" }, "desk");
    if (!r.ok) throw new Error(r.error);
    const o = await req.startRequestOrder(r.request.token);
    if (!o.ok) throw new Error(o.error);
    expect(await ledger.findOrder(o.orderId)).toMatchObject({ kind: "request", amountPaise: 99900, status: "created" });
    const res = await proc.handleRazorpayEvent(captured(o.orderId, "pay_R1", 99900));
    expect(res).toMatchObject({ outcome: "applied", purchase: true });
    expect(await req.markRequestPaid(o.orderId, "pay_R1")).toBeNull(); // the browser's verify after the webhook: no-op
    const now = (await req.requestByToken(r.request.token))!;
    expect(now).toMatchObject({ state: "paid", paymentId: "pay_R1" });
    const receipts = calls.filter((c) => c.url.endsWith("/123/messages"));
    expect(receipts).toHaveLength(1);
    expect(String((receipts[0].body.text as { body: string }).body)).toContain("Payment received");
    expect(await req.startRequestOrder(r.request.token)).toMatchObject({ ok: false, status: 409 });
    expect(await ledger.recordRefund("pay_R1", 50000)).toEqual(["request"]);
    expect((await req.requestByToken(r.request.token))!.refundedRupees).toBe(500);
  });

  it("a wrong amount is never applied", async () => {
    const r = await req.createRequest({ purpose: "Locker", amount: 300, peer: "919811111111" }, "desk");
    if (!r.ok) throw new Error(r.error);
    const o = await req.startRequestOrder(r.request.token);
    if (!o.ok) throw new Error(o.error);
    expect(await proc.handleRazorpayEvent(captured(o.orderId, "pay_R2", 100))).toMatchObject({ outcome: "amount_mismatch" });
    expect((await req.requestByToken(r.request.token))!.state).toBe("open");
  });

  it("cancel stops an open link; paid money counts in revenue", async () => {
    const a = await req.createRequest({ purpose: "Supplements", amount: 1200, peer: "919822222222" }, "desk");
    const b = await req.createRequest({ purpose: "Membership balance", amount: 2500, peer: "919822222222" }, "desk");
    if (!a.ok || !b.ok) throw new Error("create");
    expect(await req.cancelRequest(a.request.id)).toBe(true);
    expect(await req.cancelRequest(a.request.id)).toBe(false);
    expect(await req.startRequestOrder(a.request.token)).toMatchObject({ ok: false, status: 409 });
    const o = await req.startRequestOrder(b.request.token);
    if (!o.ok) throw new Error(o.error);
    await proc.applyCapturedPayment(o.orderId, "pay_R3");
    expect((await req.requestsFor("919822222222")).map((x) => x.state).sort()).toEqual(["cancelled", "paid"]);
    const c = await hub.hubCounters();
    expect(c.revenue30).toBe(2500);
    // Only links that were opened are reconciled (an unopened link has no Razorpay order).
    expect((await ledger.ordersToReconcile(new Date(Date.now() + 3600_000))).every((x) => x.razorpayOrderId)).toBe(true);
  });
});
