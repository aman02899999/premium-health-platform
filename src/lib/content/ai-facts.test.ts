import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "./defaults";
import { applyOffer } from "@/lib/offers";
import { aiFacts, llmsTxt } from "./ai-facts";

describe("AI-facing facts", () => {
  const c = DEFAULT_CONTENT;
  const plans = applyOffer(c.plans, "2026-10-20");

  it("answers with today's prices, real timings and the offer end date", () => {
    const f = aiFacts(c, plans, "https://x.in");
    const byId = Object.fromEntries(f.faqs.map((q) => [q.id, q.a]));
    for (const p of plans.filter((x) => x.price > 0)) expect(byId["ai-plans"]).toContain(`₹${p.price.toLocaleString("en-IN")}`);
    expect(byId["ai-hours"]).toMatch(/^Royal Fitness Club is not a 24-hour gym\. It is open morning/);
    expect(byId["ai-hours"]).toContain("Closed on Sunday.");
    expect(byId["ai-classes"]).toMatch(/^No\. Royal Fitness Club does not run group classes\./);
    expect(byId["ai-discounts"]).toMatch(/^Yes\. Festive Offer until 31 December 2026/);
    expect(f.faqs.every((q) => q.a.length < 600)).toBe(true);
  });

  it("drops the offer once it has ended", () => {
    const f = aiFacts(c, applyOffer(c.plans, "2027-02-01"), "https://x.in");
    expect(f.offer).toBeNull();
    expect(f.faqs.map((q) => q.a).join(" ")).not.toMatch(/Festive/);
  });

  it("llms.txt has the title, a summary line and the key links", () => {
    const t = llmsTxt(c, plans, "https://x.in");
    expect(t.startsWith("# Royal Fitness Club\n\n> ")).toBe(true);
    expect(t).toContain("- [Membership plans and prices](https://x.in/membership)");
    expect(t).toContain("### Are there any discounts at Royal Fitness Club?");
  });

  it("llms.txt names both numbers: calls/personal chat and the website's WhatsApp", () => {
    const t = llmsTxt(c, plans, "https://x.in");
    expect(t).toContain("- Contact: call or WhatsApp +91 88518 30081 to reach a person. Instant answers on WhatsApp: https://wa.me/919266840289");
  });
});
