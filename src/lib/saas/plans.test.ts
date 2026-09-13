import { describe, it, expect } from "vitest";
import {
  API_PLANS,
  DEFAULT_PLAN_ID,
  formatInr,
  formatQuota,
  getPlan,
  isKnownPlan,
  isUnlimited,
  monthlyPriceLabel,
  planRank,
} from "./plans";

describe("plan catalogue", () => {
  it("exposes the four plans in ascending order of quota", () => {
    expect(API_PLANS.map((p) => p.id)).toEqual(["free", "starter", "pro", "enterprise"]);

    const paid = API_PLANS.filter((p) => !isUnlimited(p.requestsPerDay));
    const quotas = paid.map((p) => p.requestsPerDay);
    expect([...quotas].sort((a, b) => a - b)).toEqual(quotas);
  });

  it("prices every plan in integer paise (never floats)", () => {
    for (const plan of API_PLANS) {
      expect(Number.isInteger(plan.pricePaise)).toBe(true);
      expect(plan.currency).toBe("INR");
    }
  });

  it("keeps the free tier free and the enterprise tier unlimited", () => {
    expect(getPlan("free").pricePaise).toBe(0);
    expect(isUnlimited(getPlan("enterprise").requestsPerDay)).toBe(true);
    expect(isUnlimited(getPlan("enterprise").requestsPerMinute)).toBe(true);
  });

  it("requires attribution only on the free tier", () => {
    expect(getPlan("free").attributionRequired).toBe(true);
    expect(getPlan("starter").attributionRequired).toBe(false);
  });
});

describe("plan resolution", () => {
  it("falls back to free for unknown, empty or null ids", () => {
    expect(getPlan("nonsense").id).toBe("free");
    expect(getPlan("").id).toBe(DEFAULT_PLAN_ID);
    expect(getPlan(null).id).toBe("free");
    expect(getPlan(undefined).id).toBe("free");
  });

  it("is case-insensitive and reports known plans", () => {
    expect(getPlan("PRO").id).toBe("pro");
    expect(isKnownPlan("Pro")).toBe(true);
    expect(isKnownPlan("gold")).toBe(false);
    expect(isKnownPlan(null)).toBe(false);
  });
});

describe("planRank", () => {
  it("orders plans from free to enterprise", () => {
    expect(planRank("free")).toBeLessThan(planRank("starter"));
    expect(planRank("starter")).toBeLessThan(planRank("pro"));
    expect(planRank("pro")).toBeLessThan(planRank("enterprise"));
  });

  it("is case-insensitive and ranks unknown ids lowest", () => {
    expect(planRank("PRO")).toBe(planRank("pro"));
    expect(planRank("diamond-9999")).toBe(-1);
    expect(planRank(null)).toBe(-1);
    expect(planRank(undefined)).toBe(-1);
  });
});

describe("formatting", () => {
  it("formats paise as rupees with Indian digit grouping", () => {
    expect(formatInr(0)).toBe("₹0");
    expect(formatInr(149_900)).toBe("₹1,499");
    expect(formatInr(699_900)).toBe("₹6,999");
    expect(formatInr(123_456_789)).toBe("₹12,34,567.89");
  });

  it("labels monthly prices, including the custom enterprise tier", () => {
    expect(monthlyPriceLabel(getPlan("free"))).toBe("Free");
    expect(monthlyPriceLabel(getPlan("starter"))).toBe("₹1,499/month");
    expect(monthlyPriceLabel(getPlan("enterprise"))).toBe("Custom");
  });

  it("renders unlimited quotas as text rather than -1", () => {
    expect(formatQuota(-1)).toBe("Unlimited");
    expect(formatQuota(1000)).toBe("1,000");
    expect(formatQuota(500_000)).toBe("5,00,000");
  });

  it("treats only negative values as unlimited", () => {
    expect(isUnlimited(-1)).toBe(true);
    expect(isUnlimited(0)).toBe(false);
    expect(isUnlimited(1)).toBe(false);
  });
});
