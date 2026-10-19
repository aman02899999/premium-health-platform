import { createHmac } from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { captureProblem, isDoublePayment, parseRazorpayEvent } from "./webhook-event";

vi.mock("server-only", () => ({}));
const handle = vi.fn();
vi.mock("@/lib/payments/process", () => ({ handleRazorpayEvent: (...a: unknown[]) => handle(...a) }));
const capi = vi.fn();
vi.mock("@/lib/growth/meta-capi", () => ({ sendCapiEvent: (...a: unknown[]) => capi(...a) }));
vi.mock("next/server", async (orig) => ({ ...(await orig<typeof import("next/server")>()), after: (fn: () => unknown) => fn() }));

const captured = { event: "payment.captured", payload: { payment: { entity: { id: "pay_1", order_id: "order_1", amount: 4900, currency: "INR", email: "a@b.in", contact: "+919876543210" } } } };

describe("parseRazorpayEvent", () => {
  it("reads a captured payment and prefers Razorpay's event id", () => {
    expect(parseRazorpayEvent(JSON.stringify(captured), "evt_1")).toMatchObject({ eventId: "evt_1", event: "payment.captured", orderId: "order_1", paymentId: "pay_1", amountPaise: 4900, currency: "INR", refundedPaise: null });
  });
  it("derives a stable event id when the header is missing", () => {
    expect(parseRazorpayEvent(JSON.stringify(captured), null)?.eventId).toBe("payment.captured:pay_1");
  });
  it("takes the payment's running refund total, else the refund's own amount", () => {
    const withTotal = { event: "refund.processed", payload: { refund: { entity: { id: "rfnd_1", payment_id: "pay_1", amount: 100 } }, payment: { entity: { id: "pay_1", amount: 4900, amount_refunded: 300 } } } };
    expect(parseRazorpayEvent(JSON.stringify(withTotal), null)).toMatchObject({ eventId: "refund.processed:rfnd_1", paymentId: "pay_1", refundedPaise: 300 });
    const refundOnly = { event: "refund.processed", payload: { refund: { entity: { id: "rfnd_2", payment_id: "pay_2", amount: 150 } } } };
    expect(parseRazorpayEvent(JSON.stringify(refundOnly), null)).toMatchObject({ paymentId: "pay_2", refundedPaise: 150 });
  });
  it("finds the payment of a dispute", () => {
    expect(parseRazorpayEvent(JSON.stringify({ event: "payment.dispute.created", payload: { dispute: { entity: { id: "disp_1", payment_id: "pay_9" } } } }), null)).toMatchObject({ paymentId: "pay_9", eventId: "payment.dispute.created:disp_1" });
  });
  it("rejects bodies that aren't events, and ignores wrongly typed fields", () => {
    expect(parseRazorpayEvent("not json", null)).toBeNull();
    expect(parseRazorpayEvent("[]", null)).toBeNull();
    expect(parseRazorpayEvent(JSON.stringify({ payload: {} }), null)).toBeNull();
    expect(parseRazorpayEvent(JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: 5, order_id: "o", amount: "4900" } } } }), null)).toMatchObject({ paymentId: null, amountPaise: null });
  });
});

describe("captureProblem and isDoublePayment", () => {
  const order = { kind: "membership" as const, amountPaise: 200000, status: "created", paymentId: null };
  it("accepts only the exact amount in INR", () => {
    expect(captureProblem(order, { paymentId: "p", amountPaise: 200000, currency: "INR" })).toBeNull();
    expect(captureProblem(order, { paymentId: "p", amountPaise: 199999, currency: "INR" })).toMatch(/199999/);
    expect(captureProblem(order, { paymentId: "p", amountPaise: 200000, currency: "USD" })).toMatch(/USD/);
    expect(captureProblem(order, { paymentId: "p", amountPaise: null, currency: "INR" })).toMatch(/missing/);
    expect(captureProblem(order, { paymentId: "p", amountPaise: 200000, currency: null })).toMatch(/missing/);
  });
  it("spots a different payment on an already paid order", () => {
    expect(isDoublePayment({ ...order, status: "paid", paymentId: "pay_1" }, "pay_2")).toBe(true);
    expect(isDoublePayment({ ...order, status: "paid", paymentId: "pay_1" }, "pay_1")).toBe(false);
    expect(isDoublePayment(order, "pay_1")).toBe(false);
  });
});

describe("POST /api/webhooks/razorpay", () => {
  const secret = "whsec_test";
  const send = async (body: string, headers: Record<string, string>) => {
    const { POST } = await import("@/app/api/webhooks/razorpay/route");
    return POST(new Request("http://localhost/api/webhooks/razorpay", { method: "POST", body, headers }));
  };
  const signed = (body: string, s = secret) => ({ "x-razorpay-signature": createHmac("sha256", s).update(body).digest("hex"), "x-razorpay-event-id": "evt_1" });

  beforeEach(() => {
    handle.mockReset();
    capi.mockReset();
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", secret);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("refuses an unsigned, wrongly signed or tampered body without touching any order", async () => {
    const body = JSON.stringify(captured);
    expect((await send(body, {})).status).toBe(401);
    expect((await send(body, signed(body, "other"))).status).toBe(401);
    expect((await send(body.replace("4900", "100"), signed(body))).status).toBe(401);
    expect(handle).not.toHaveBeenCalled();
  });

  it("refuses everything while the webhook secret is missing", async () => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "");
    const body = JSON.stringify(captured);
    expect((await send(body, signed(body))).status).toBe(401);
    expect(handle).not.toHaveBeenCalled();
  });

  it("answers 400 to a signed body that isn't an event", async () => {
    expect((await send("not json", signed("not json"))).status).toBe(400);
    expect(handle).not.toHaveBeenCalled();
  });

  it("passes a verified event on and reports the sale to Meta only when it was accepted", async () => {
    const body = JSON.stringify(captured);
    handle.mockResolvedValueOnce({ status: 200, outcome: "applied", detail: "", purchase: true });
    const res = await send(body, signed(body));
    expect(res.status).toBe(200);
    expect(handle.mock.calls[0][0]).toMatchObject({ eventId: "evt_1", orderId: "order_1", paymentId: "pay_1" });
    expect(capi).toHaveBeenCalledWith(expect.objectContaining({ name: "Purchase", id: "pay_1", value: 49 }));

    handle.mockResolvedValueOnce({ status: 200, outcome: "amount_mismatch", detail: "Paid 100", purchase: false });
    expect((await send(body, signed(body))).status).toBe(200);
    expect(capi).toHaveBeenCalledTimes(1);
  });

  it("answers 500 when processing failed, so Razorpay retries", async () => {
    const body = JSON.stringify(captured);
    handle.mockResolvedValueOnce({ status: 500, outcome: "error", detail: "db down", purchase: false });
    expect((await send(body, signed(body))).status).toBe(500);
    expect(capi).not.toHaveBeenCalled();
  });
});
