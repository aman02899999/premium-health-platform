import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "./defaults";
import { applyOffer, OFFERS } from "@/lib/offers";
import { recommendPlan, restrictedPlans } from "./plan-finder";

const plans = DEFAULT_CONTENT.plans;
const womens = { ...plans[2], id: "female-special", name: "Female's Special", price: 7000, couplePrice: 0 };

describe("recommendPlan", () => {
  it("matches the length someone wants to commit to", () => {
    expect(recommendPlan(plans, "single", "try")?.id).toBe("monthly");
    expect(recommendPlan(plans, "single", "three")?.id).toBe("quarterly");
    expect(recommendPlan(plans, "single", "six")?.id).toBe("half-yearly");
    expect(recommendPlan(plans, "single", "year")?.id).toBe("yearly");
  });

  it("judges length by the standard duration, not an offer's bonus months", () => {
    const offered = applyOffer(plans, "2026-11-01", OFFERS);
    expect(recommendPlan(offered, "single", "year")?.id).toBe("yearly");
    expect(recommendPlan(offered, "single", "three")?.id).toBe("quarterly");
  });

  it("only suggests plans with a couple price to two people", () => {
    const some = plans.map((p) => (p.id === "quarterly" ? { ...p, couplePrice: 0 } : p));
    expect(recommendPlan(some, "couple", "three")?.id).not.toBe("quarterly");
    expect(recommendPlan(plans.map((p) => ({ ...p, couplePrice: 0 })), "couple", "three")).toBeUndefined();
  });

  it("never suggests a plan meant for one group to everyone", () => {
    expect(recommendPlan([...plans, womens], "single", "six")?.id).toBe("half-yearly");
    expect(restrictedPlans([...plans, womens]).map((p) => p.id)).toEqual(["female-special"]);
  });

  it("returns nothing when there are no plans", () => {
    expect(recommendPlan([], "single", "try")).toBeUndefined();
  });
});
