import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "./content/defaults";
import { activeOffer, applyOffer } from "./offers";
import { quoteMembership } from "./payments/membership";
import { expiryFor, parseDuration } from "./growth/dates";
import { planMonths } from "@/components/home/PlanGrid";

// The live standard prices (Monthly ₹2,000 · Quarterly ₹5,000 · Half-Yearly ₹8,000 · Annual ₹14,000 · Royal 15 ₹16,000).
const plans = DEFAULT_CONTENT.plans;

describe("festive offer", () => {
  it("runs 8 Oct – 31 Dec 2026 (India dates) and switches itself off", () => {
    expect(activeOffer("2026-10-07")).toBeNull();
    expect(activeOffer("2026-10-08")?.id).toBe("festive-2026");
    expect(activeOffer("2026-12-31")?.id).toBe("festive-2026");
    expect(activeOffer("2027-01-01")).toBeNull();
    expect(applyOffer(plans, "2027-01-01")).toBe(plans);
  });

  it("applies the approved prices, bonus time and the Female's Special", () => {
    const p = applyOffer(plans, "2026-11-01");
    const by = (id: string) => p.find((x) => x.id === id)!;
    expect([by("monthly").price, by("quarterly").price, by("half-yearly").price, by("yearly").price, by("fifteen-months").price]).toEqual([1500, 4000, 7000, 14000, 16000]);
    expect(by("monthly").duration).toBe("1 month + 5 days");
    expect(by("quarterly").duration).toBe("3 months + 10 days");
    expect(by("half-yearly").duration).toBe("6 months + 20 days");
    expect(by("yearly").duration).toBe("12 months + 2 months");
    expect(by("fifteen-months").offer).toBeUndefined(); // Royal 15: no offer
    // Strike-through savings: ₹500 / ₹1,000 / ₹1,000; Annual has none (same price, more months).
    expect([by("monthly").originalPrice, by("quarterly").originalPrice, by("half-yearly").originalPrice, by("yearly").originalPrice]).toEqual([2000, 5000, 8000, 0]);
    expect(by("monthly").perks[0]).toBe("Free diet consultation");
    expect(by("yearly").perks[0]).toBe("Free customised diet plan");
    // Couple prices are unchanged.
    expect(p.filter((x) => x.couplePrice).map((x) => x.couplePrice)).toEqual([3000, 7500, 12000, 21000, 24000]);
    // Female's Special sits after Half-Yearly, single only.
    const ids = p.map((x) => x.id);
    expect(ids.indexOf("female-special")).toBe(ids.indexOf("half-yearly") + 1);
    expect(by("female-special")).toMatchObject({ price: 7000, couplePrice: 0, duration: "6 months" });
    expect(by("female-special").perks[0]).toContain("₹1,499");
  });

  it("never raises a price the admin has since lowered", () => {
    const cheaper = plans.map((p) => (p.id === "monthly" ? { ...p, price: 1200 } : p));
    expect(applyOffer(cheaper, "2026-11-01").find((p) => p.id === "monthly")!.price).toBe(1200);
  });

  it("checkout charges the offer price and gives the bonus days; couples pay standard", () => {
    const p = applyOffer(plans, "2026-11-01");
    expect(quoteMembership(p, "monthly", false)).toMatchObject({ amountPaise: 150000, duration: "1 month + 5 days" });
    expect(quoteMembership(p, "monthly", true)).toMatchObject({ amountPaise: 300000, duration: "1 month" });
    expect(quoteMembership(p, "yearly", false)).toMatchObject({ amountPaise: 1400000, duration: "12 months + 2 months" });
    expect(quoteMembership(p, "female-special", false)).toMatchObject({ amountPaise: 700000, duration: "6 months" });
    expect(quoteMembership(p, "female-special", true)).toBeNull(); // no couple price
    expect(quoteMembership(applyOffer(plans, "2027-01-01"), "female-special", false)).toBeNull(); // gone after the offer
  });

  it("membership expiry includes the bonus time exactly", () => {
    expect(expiryFor("2026-11-01", parseDuration("1 month + 5 days")!)).toBe("2026-12-05");
    expect(expiryFor("2026-11-01", parseDuration("3 months + 10 days")!)).toBe("2027-02-10");
    expect(expiryFor("2026-11-01", parseDuration("6 months + 20 days")!)).toBe("2027-05-20");
    expect(expiryFor("2026-11-01", parseDuration("12 months + 2 months")!)).toBe("2027-12-31");
    expect(parseDuration("1 month + soon")).toBeNull();
  });

  it("per-month figures count bonus months, not bonus days", () => {
    expect(planMonths("12 months + 2 months")).toBe(14); // ₹14,000 → ₹1,000/month
    expect(planMonths("1 month + 5 days")).toBe(1);
    expect(planMonths("1 year")).toBe(12);
  });
});
