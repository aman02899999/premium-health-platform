import { describe, expect, it } from "vitest";
import { GYM_CHOICE_POSTS } from "@/lib/adsense";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { FESTIVE_2026 } from "@/lib/offers";
import { gymChoiceReadNext, livePriceRows } from "./gym-choice";

describe("live price box on gym-choice posts", () => {
  it("shows today's festive prices while the offer runs, matching the membership page", () => {
    const rows = livePriceRows(DEFAULT_CONTENT.plans, "2026-11-25", [FESTIVE_2026]);
    const monthly = rows.find((r) => r.name === "Monthly")!;
    expect(monthly.price).toBe(1500);
    expect(monthly.standardPrice).toBe(2000);
    expect(monthly.gets).toBe("1 month + 5 bonus days");
    expect(rows.some((r) => r.name === "Female's Special" && r.price === 7000)).toBe(true);
    // Couple prices stay standard during the offer.
    expect(monthly.couplePrice).toBe(3000);
    // Annual gives 14 months during the offer: ₹14,000 ÷ 14, as the offer itself says.
    expect(rows.find((r) => r.name === "Annual")!.perMonth).toBe(1000);
  });

  it("goes back to standard prices by itself after the offer ends", () => {
    const rows = livePriceRows(DEFAULT_CONTENT.plans, "2027-01-01", [FESTIVE_2026]);
    const monthly = rows.find((r) => r.name === "Monthly")!;
    expect(monthly.price).toBe(2000);
    expect(monthly.standardPrice).toBe(0);
    expect(rows.some((r) => r.name === "Female's Special")).toBe(false);
  });

  it("works out a per-month figure people can compare", () => {
    const rows = livePriceRows(DEFAULT_CONTENT.plans, "2027-01-01", [FESTIVE_2026]);
    expect(rows.find((r) => r.name === "Annual")!.perMonth).toBe(1167);
    expect(rows.find((r) => r.name === "Royal 15")!.perMonth).toBe(1067);
  });
});

describe("read-next links between gym-choice posts", () => {
  it("links every gym-choice post to the others, never to itself", () => {
    for (const slug of GYM_CHOICE_POSTS) {
      const links = gymChoiceReadNext(slug);
      expect(links.length).toBeGreaterThanOrEqual(3);
      expect(links.some((l) => l.href === `/blog/${slug}`)).toBe(false);
    }
  });

  it("returns nothing for other posts", () => {
    expect(gymChoiceReadNext("creatine-safe-hai-kya-fayde-side-effects")).toEqual([]);
  });
});
