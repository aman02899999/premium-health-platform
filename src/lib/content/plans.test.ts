import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "./defaults";
import { applyOffer } from "@/lib/offers";
import { basePlan, perMonth, planFaqs, planFeatures, planMonths, planSummary, savingPct } from "./plans";

const plans = DEFAULT_CONTENT.plans;

describe("planFeatures", () => {
  it("inherits features through 'Everything in X' chains", () => {
    const { features, has } = planFeatures(plans);
    expect(features).toContain("Full gym floor access");
    expect(features.some((f) => /^everything in/i.test(f))).toBe(false);
    expect(has("monthly", "Full gym floor access")).toBe(true);
    expect(has("monthly", "Basic diet guidance")).toBe(false);
    expect(has("fifteen-months", "Full gym floor access")).toBe(true);
    expect(has("fifteen-months", "Custom Indian diet plan")).toBe(true);
    expect(has("yearly", "Lowest price per month")).toBe(false);
  });

  it("keeps a running offer's perks on the offer plan only", () => {
    const offered = applyOffer(plans, "2026-11-01");
    const { has } = planFeatures(offered);
    expect(has("yearly", "Free customised diet plan")).toBe(true);
    expect(has("fifteen-months", "Free customised diet plan")).toBe(false);
    expect(has("fifteen-months", "Custom Indian diet plan")).toBe(true);
  });

  it("survives a self-referencing loop", () => {
    const loop = [{ ...plans[0], perks: ["Everything in Monthly", "A"] }];
    expect(planFeatures(loop).has("monthly", "A")).toBe(true);
  });
});

describe("plan maths", () => {
  it("per month and saving against the shortest plan", () => {
    const base = basePlan(plans)!;
    expect(base.id).toBe("monthly");
    const yearly = plans.find((p) => p.id === "yearly")!;
    expect(planMonths(yearly.duration)).toBe(12);
    expect(perMonth(yearly)).toBe(1167);
    expect(savingPct(yearly, base)).toBe(42);
    expect(savingPct(base, base)).toBe(0);
  });

  it("measures offer plans against the standard monthly rate", () => {
    const offered = applyOffer(plans, "2026-11-01");
    const base = basePlan(offered)!;
    const monthly = offered.find((p) => p.id === "monthly")!;
    expect(savingPct(monthly, base)).toBe(0);
    const q = offered.find((p) => p.id === "quarterly")!;
    expect(savingPct(q, base)).toBeGreaterThan(0);
  });
});

describe("planSummary", () => {
  it("is 3–5 sentences built from the plan's own data", () => {
    for (const p of plans) {
      const s = planSummary(p, plans);
      const n = s.split(/(?<=\.)\s+/).length;
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(5);
      expect(s).toContain(p.name);
    }
    expect(planSummary(plans[1], plans)).toContain("on top of everything in Monthly");
  });
});

describe("planFaqs", () => {
  it("covers usage, cancellation, freeze and transfer with readable hours", () => {
    const faqs = planFaqs(DEFAULT_CONTENT.business);
    expect(faqs.map((f) => f.id)).toEqual(["plan-usage", "plan-cancel", "plan-freeze", "plan-transfer"]);
    expect(faqs[0].a).toContain("5:30 AM");
    expect(faqs[1].a).toContain("non-refundable, whether you join at the gym or book online");
    expect(faqs[1].a).not.toContain("7 days");
  });
});
