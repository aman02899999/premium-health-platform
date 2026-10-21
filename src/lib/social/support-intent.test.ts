import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { applyOffer } from "@/lib/offers";
import { buildReply, detectIntent, isMembershipRefund, shouldReply } from "./auto-reply";
import { flowAction, flowReply } from "./wa-flow";

const ctx = { business: DEFAULT_CONTENT.business, plans: applyOffer(DEFAULT_CONTENT.plans, "2026-10-21"), siteUrl: "https://www.royalfitnesclub.in", name: "Rahul Verma" };

describe("refunds, cancellations and complaints go to a person", () => {
  it.each([
    "I want a refund for my membership",
    "Please cancel my membership plan",
    "membership cancellation kaise hogi",
    "paise wapas karo",
    "Payment failed but money deducted",
    "charged twice for the diet plan",
    "I want to freeze my membership for a month",
    "transfer my membership to my brother",
    "The trainer was rude, I want to complain",
    "AC not working in the gym",
    "Bahut bad experience tha",
  ])("%s", (t) => expect(detectIntent(t)).toBe("support"));

  it.each([
    ["thyroid problem diet plan chahiye", "diet"],
    ["knee issue, can I join the gym membership?", "price"],
    ["membership fees?", "price"],
    ["PCOS weight loss", "diet"],
  ])("still routes %s as %s", (t, intent) => expect(detectIntent(t)).toBe(intent));

  it("replies without prices or offers, with the coach's number", () => {
    const r = buildReply("support", ctx);
    expect(r).toContain("Hi Rahul");
    expect(r).toContain("Coach Aman* will reply to you here personally");
    expect(r).toContain(DEFAULT_CONTENT.business.phone);
    expect(r).not.toMatch(/₹/);
  });

  it("on WhatsApp it's one plain text, even right after a campaign offer", () => {
    expect(flowAction({ text: "I want a refund for my membership" }, false, false)).toEqual({ action: "support", tapped: false });
    expect(flowAction({ text: "cancel my membership" }, false, true)).toEqual({ action: "support", tapped: false });
    const out = flowReply("support", ctx);
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("text");
  });

  it("is never answered in a public comment", () => {
    expect(shouldReply("support", "comment", false)).toBe(false);
    expect(shouldReply("support", "message", true)).toBe(true);
  });

  it("states the membership policy only for a gym membership refund or cancellation", () => {
    const policy = "Gym membership fees are non-refundable (policy: https://www.royalfitnesclub.in/refund-policy)";
    for (const text of ["I want a refund for my membership", "gym fees wapas chahiye", "cancel my gym membership please"]) {
      expect([text, isMembershipRefund(text)]).toEqual([text, true]);
      expect(buildReply("support", { ...ctx, text })).toContain(policy);
    }
    // Diet plans, eBooks and supplement orders keep their own policies; complaints aren't refund asks.
    for (const text of ["refund for my diet plan", "cancel my protein order", "ebook refund", "the trainer was rude at the gym", "payment failed for membership"]) {
      expect([text, isMembershipRefund(text)]).toEqual([text, false]);
      expect(buildReply("support", { ...ctx, text })).not.toContain("non-refundable");
    }
  });
});
