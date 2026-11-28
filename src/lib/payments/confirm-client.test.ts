import { describe, expect, it, vi } from "vitest";
import { confirmPayment, UNREACHABLE_MESSAGE } from "./confirm-client";

const noWait = async () => {};
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe("confirmPayment (browser step after Razorpay's success callback)", () => {
  it("returns the server's answer on the first try", async () => {
    const fetch = vi.fn(async () => json(200, { ok: true, paymentId: "pay_1" }));
    const r = await confirmPayment("/api/diet-chart/verify", { orderId: "o" }, { fetch, wait: noWait });
    expect(r).toEqual({ ok: true, status: 200, data: { ok: true, paymentId: "pay_1" } });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("/api/diet-chart/verify", expect.objectContaining({ method: "POST", body: JSON.stringify({ orderId: "o" }) }));
  });

  it("retries a dropped connection or a server error, then succeeds", async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValueOnce(json(502, {})).mockResolvedValueOnce(json(200, { ok: true }));
    const r = await confirmPayment("/x", {}, { fetch, wait: noWait });
    expect(r.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("does not retry a refusal (bad signature) and passes the server's message through", async () => {
    const fetch = vi.fn(async () => json(400, { error: "We couldn't verify this payment." }));
    const r = await confirmPayment("/x", {}, { fetch, wait: noWait });
    expect(r).toEqual({ ok: false, status: 400, data: { error: "We couldn't verify this payment." } });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("after every try fails, tells the buyer not to pay again (the site confirms it on its own)", async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const r = await confirmPayment("/x", {}, { fetch, wait: noWait, tries: 3 });
    expect(r).toEqual({ ok: false, status: 0, data: { error: UNREACHABLE_MESSAGE } });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(UNREACHABLE_MESSAGE).toMatch(/don't pay again/i);
  });
});
