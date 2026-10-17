import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { parseWebhook } from "./inbound";
import { BUTTON, flowAction, flowReply, logText, toInteractive, type FlowAction } from "./wa-flow";

const ctx = { business: DEFAULT_CONTENT.business, plans: DEFAULT_CONTENT.plans, siteUrl: "https://example.in", name: "Pratibha Singh", text: "diet plan" };

describe("WhatsApp trial funnel", () => {
  it("maps taps, 'yes' after an offer, and keywords to the next step", () => {
    expect(flowAction({ replyId: "rfc_trial7", text: "✅ Start 7-day ₹49" }, false)).toEqual({ action: "trial7", tapped: true });
    expect(flowAction({ replyId: "rfc_m_visit", text: "Timings & address" }, false)).toEqual({ action: "visit", tapped: true });
    expect(flowAction({ text: "Haan" }, true)).toEqual({ action: "trial7", tapped: true });
    expect(flowAction({ text: "ok" }, true)).toEqual({ action: "trial7", tapped: true });
    expect(flowAction({ text: "yes" }, false)).toEqual({ action: "menu", tapped: false });
    expect(flowAction({ text: "yes but what about fees?" }, true)).toEqual({ action: "price", tapped: false });
    expect(flowAction({ text: "weight loss diet" }, false)).toEqual({ action: "diet", tapped: false });
    expect(flowAction({ replyId: "someone-elses-id", text: "hi" }, false)).toEqual({ action: "menu", tapped: false });
  });

  it("every step fits WhatsApp's limits", () => {
    const actions: FlowAction[] = ["diet", "trial7", "plans", "coach", "menu", "price", "trial", "visit", "shop"];
    for (const a of actions) {
      for (const step of flowReply(a, ctx)) {
        expect(step.body.length, a).toBeLessThanOrEqual(1024);
        const i = toInteractive(step);
        if (step.kind === "buttons") {
          expect(step.buttons.length, a).toBeLessThanOrEqual(3);
          for (const b of step.buttons) expect([...b.title].length, `${a}: ${b.title}`).toBeLessThanOrEqual(20);
        }
        if (step.kind === "list") for (const r of step.rows) expect(r.title.length, r.title).toBeLessThanOrEqual(24);
        if (step.kind !== "text") expect(i, a).not.toBeNull();
      }
    }
    expect(BUTTON.trial7.title).toBe("✅ Start 7-day ₹49");
  });

  it("the offer leads with the ₹49 trial and never promises a reply it can't give", () => {
    const [offer] = flowReply("diet", { ...ctx, text: "PCOS diet chart" });
    expect(offer.body).toContain("*7-Day Trial Plan: just ₹49*");
    expect(offer.body).toContain("guidance, not medical treatment");
    expect(offer.body).not.toMatch(/reply \*?YES/i);
    expect(logText(offer)).toContain("[✅ Start 7-day ₹49] [📋 See all plans] [💬 Talk to coach]");
  });

  it("reads the id of a tapped button or list row from the webhook", () => {
    const body = (message: object) => ({ object: "whatsapp_business_account", entry: [{ changes: [{ field: "messages", value: { messages: [{ id: "m1", from: "919876543210", ...message }] } }] }] });
    expect(parseWebhook(body({ type: "interactive", interactive: { type: "button_reply", button_reply: { id: "rfc_trial7", title: "✅ Start 7-day ₹49" } } }))[0]).toMatchObject({ replyId: "rfc_trial7", text: "✅ Start 7-day ₹49" });
    expect(parseWebhook(body({ type: "interactive", interactive: { type: "list_reply", list_reply: { id: "rfc_m_price", title: "Membership fees" } } }))[0]).toMatchObject({ replyId: "rfc_m_price" });
    expect(parseWebhook(body({ type: "button", button: { text: "Stop promotions", payload: "Stop promotions" } }))[0]).toMatchObject({ text: "Stop promotions" });
    expect(parseWebhook(body({ type: "text", text: { body: "hi" } }))[0].replyId).toBeUndefined();
  });
});
