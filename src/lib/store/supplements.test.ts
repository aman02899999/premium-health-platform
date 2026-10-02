import { describe, expect, it } from "vitest";
import { STORE_CATEGORIES, STORE_PRODUCTS, storeLink } from "./supplements";

describe("supplement store", () => {
  it("has unique products in known categories, each with a tagged Amazon link", () => {
    expect(STORE_PRODUCTS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(STORE_PRODUCTS.map((p) => p.id)).size).toBe(STORE_PRODUCTS.length);
    const cats = STORE_CATEGORIES.map((c) => c.name);
    for (const p of STORE_PRODUCTS) {
      expect(cats).toContain(p.category);
      const url = new URL(storeLink(p));
      expect(url.hostname).toBe("www.amazon.in");
      expect(url.searchParams.get("tag")).toBe("rfc93-21");
      expect(p.why.length).toBeGreaterThan(20);
    }
  });

  it("never lists risky categories", () => {
    const text = STORE_PRODUCTS.map((p) => `${p.name} ${p.brand} ${p.search}`).join(" ").toLowerCase();
    for (const banned of ["fat burner", "testosterone", "test booster", "steroid", "sarm", "pre-workout", "preworkout"]) expect(text).not.toContain(banned);
  });
});
