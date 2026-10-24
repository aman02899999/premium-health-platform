import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "./content/defaults";
import { activeOffer, applyOffer, FESTIVE_2026, OFFERS, validateOffers, type Offer } from "./offers";
import { quoteMembership } from "./payments/membership";
import { expiryFor, parseDuration } from "./growth/dates";
import { planMonths } from "@/components/home/PlanGrid";

// The live standard prices (Monthly ₹2,000 · Quarterly ₹5,000 · Half-Yearly ₹8,000 · Annual ₹14,000 · Royal 15 ₹16,000).
const plans = DEFAULT_CONTENT.plans;

describe("festive offer", () => {
  it("runs 8 Oct – 31 Dec 2026 (India dates) and switches itself off", () => {
    expect(activeOffer("2026-10-07", OFFERS)).toBeNull();
    expect(activeOffer("2026-10-08", OFFERS)?.id).toBe("festive-2026");
    expect(activeOffer("2026-12-31", OFFERS)?.id).toBe("festive-2026");
    expect(activeOffer("2027-01-01", OFFERS)).toBeNull();
    expect(applyOffer(plans, "2027-01-01", OFFERS)).toBe(plans);
  });

  it("applies the approved prices, bonus time and the Female's Special", () => {
    const p = applyOffer(plans, "2026-11-01", OFFERS);
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
    expect(applyOffer(cheaper, "2026-11-01", OFFERS).find((p) => p.id === "monthly")!.price).toBe(1200);
  });

  it("checkout charges the offer price and gives the bonus days; couples pay standard", () => {
    const p = applyOffer(plans, "2026-11-01", OFFERS);
    expect(quoteMembership(p, "monthly", false)).toMatchObject({ amountPaise: 150000, duration: "1 month + 5 days" });
    expect(quoteMembership(p, "monthly", true)).toMatchObject({ amountPaise: 300000, duration: "1 month" });
    expect(quoteMembership(p, "yearly", false)).toMatchObject({ amountPaise: 1400000, duration: "12 months + 2 months" });
    expect(quoteMembership(p, "female-special", false)).toMatchObject({ amountPaise: 700000, duration: "6 months" });
    expect(quoteMembership(p, "female-special", true)).toBeNull(); // no couple price
    expect(quoteMembership(applyOffer(plans, "2027-01-01", OFFERS), "female-special", false)).toBeNull(); // gone after the offer
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

describe("offers edited in the admin", () => {
  const ok = (offers: Offer[]) => validateOffers(offers, plans);
  const festive = (patch: Partial<Offer> = {}): Offer => ({ ...FESTIVE_2026, ...patch });
  const withPlan = (id: string, patch: Partial<Offer["plans"][string]>): Offer =>
    festive({ plans: { ...FESTIVE_2026.plans, [id]: { ...FESTIVE_2026.plans[id], ...patch } } });

  it("accepts the festive offer as shipped", () => {
    expect(ok([FESTIVE_2026])).toEqual({ errors: [], warnings: [] });
    expect(ok([])).toEqual({ errors: [], warnings: [] });
  });

  it("is what the site sells from, so saved offers replace the built-in one", () => {
    const later = festive({ id: "summer-2027", startsOn: "2027-04-01", endsOn: "2027-04-30", plans: { monthly: { ...FESTIVE_2026.plans.monthly, price: 1800 } }, extraPlans: [] });
    expect(DEFAULT_CONTENT.offers).toEqual([FESTIVE_2026]);
    expect(activeOffer("2026-11-01", [later])).toBeNull();
    expect(quoteMembership(applyOffer(plans, "2027-04-10", [later]), "monthly", false)?.amountPaise).toBe(180000);
    expect(quoteMembership(applyOffer(plans, "2027-04-10", [later]), "quarterly", false)?.amountPaise).toBe(500000);
  });

  it("rejects dates that can't work", () => {
    expect(ok([festive({ startsOn: "2026-12-31", endsOn: "2026-10-08" })]).errors[0]).toMatch(/ends before it starts/);
    expect(ok([festive({ endsOn: "31/12/2026" })]).errors[0]).toMatch(/end date/);
    expect(ok([festive({ startsOn: "2026-02-30" })]).errors[0]).toMatch(/start date/);
    expect(ok([festive({ endsOn: "2028-01-01" })]).errors[0]).toMatch(/longer than a year/);
  });

  it("rejects two offers running on the same day, and duplicate ids", () => {
    const second = festive({ id: "diwali", startsOn: "2026-12-01", endsOn: "2027-01-10" });
    expect(ok([FESTIVE_2026, second]).errors[0]).toMatch(/overlap/);
    expect(ok([FESTIVE_2026, festive({ startsOn: "2027-02-01", endsOn: "2027-02-28" })]).errors[0]).toMatch(/twice/);
  });

  it("rejects prices that look like typos", () => {
    expect(ok([withPlan("monthly", { price: 0 })]).errors[0]).toMatch(/Monthly.*price/);
    expect(ok([withPlan("monthly", { price: 1500.5 })]).errors[0]).toMatch(/whole rupees/);
    expect(ok([withPlan("monthly", { price: 150 })]).errors[0]).toMatch(/more than 70% off/);
    expect(ok([withPlan("monthly", { gets: " " })]).errors[0]).toMatch(/what the member gets/);
    expect(ok([festive({ plans: { ...FESTIVE_2026.plans, gold: FESTIVE_2026.plans.monthly } })]).errors[0]).toMatch(/no plan "gold"/);
  });

  it("warns, without blocking, when an offer costs more than the standard price", () => {
    const r = ok([withPlan("monthly", { price: 2500 })]);
    expect(r.errors).toEqual([]);
    expect(r.warnings[0]).toMatch(/Monthly.*won't be used/);
  });

  it("checks the offer-only plans", () => {
    const extra = FESTIVE_2026.extraPlans[0];
    expect(ok([festive({ extraPlans: [{ ...extra, plan: { ...extra.plan, id: "monthly" } }] })]).errors[0]).toMatch(/already used/);
    expect(ok([festive({ extraPlans: [{ ...extra, plan: { ...extra.plan, price: 70 } }] })]).errors[0]).toMatch(/Female's Special.*price/);
    expect(ok([festive({ extraPlans: [{ ...extra, after: "nope" }] })]).errors[0]).toMatch(/after/);
  });

  it("needs a title and keeps the banner short", () => {
    expect(ok([festive({ title: "" })]).errors[0]).toMatch(/title/);
    expect(ok([festive({ banner: "x".repeat(201) })]).errors[0]).toMatch(/banner/);
  });
});
