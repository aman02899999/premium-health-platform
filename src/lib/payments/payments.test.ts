import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "../content/defaults";
import { parseCheckoutForm, quoteMembership } from "./membership";
import { verifyPaymentSignature, verifyWebhookSignature } from "./signature";

const plans = DEFAULT_CONTENT.plans;

describe("quoteMembership", () => {
  it("prices single and couple plans in paise from the server's plan list", () => {
    expect(quoteMembership(plans, "monthly", false)?.amountPaise).toBe(200000);
    expect(quoteMembership(plans, "yearly", true)?.amountPaise).toBe(2100000);
  });
  it("rejects unknown plans and plans without a couple price", () => {
    expect(quoteMembership(plans, "free-forever", false)).toBeNull();
    expect(quoteMembership([{ ...plans[0], couplePrice: 0 }], plans[0].id, true)).toBeNull();
  });
});

describe("parseCheckoutForm", () => {
  const today = new Date("2026-10-01T06:00:00Z");
  const ok = { name: "  Rahul   Kumar ", phone: "+91 98765-43210" };
  it("cleans valid input", () => {
    expect(parseCheckoutForm(ok, false, today)).toEqual({ name: "Rahul Kumar", phone: "9876543210", email: null, partnerName: null, startDate: null, referredBy: null });
  });
  it("rejects bad phones, emails and dates", () => {
    expect(parseCheckoutForm({ ...ok, phone: "12345" }, false, today)).toMatch(/mobile/);
    expect(parseCheckoutForm({ ...ok, email: "nope" }, false, today)).toMatch(/email/);
    expect(parseCheckoutForm({ ...ok, startDate: "2026-09-30" }, false, today)).toMatch(/60 days/);
    expect(parseCheckoutForm({ ...ok, startDate: "2027-01-15" }, false, today)).toMatch(/60 days/);
  });
  it("requires a partner name only for couple plans", () => {
    expect(parseCheckoutForm(ok, true, today)).toMatch(/partner/);
    expect(parseCheckoutForm({ ...ok, partnerName: "Priya" }, true, today)).toMatchObject({ partnerName: "Priya" });
  });
});

describe("Razorpay signatures", () => {
  const secret = "test_secret";
  it("accepts the checkout signature made with the key secret and rejects anything else", () => {
    const sig = createHmac("sha256", secret).update("order_1|pay_1").digest("hex");
    expect(verifyPaymentSignature("order_1", "pay_1", sig, secret)).toBe(true);
    expect(verifyPaymentSignature("order_1", "pay_2", sig, secret)).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", "forged", secret)).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", sig, undefined)).toBe(false);
  });
  it("checks webhook bodies against the webhook secret", () => {
    const body = '{"event":"payment.captured"}';
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWebhookSignature(body, sig, secret)).toBe(true);
    expect(verifyWebhookSignature(body + " ", sig, secret)).toBe(false);
    expect(verifyWebhookSignature(body, null, secret)).toBe(false);
  });
});
