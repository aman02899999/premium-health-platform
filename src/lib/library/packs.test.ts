import { describe, expect, it } from "vitest";
import { BOOKS } from "./catalog";
import { parseAddParam, priceCart } from "./cart";
import { priceTable } from "./pricing";
import { PACKS, packById, packCheckoutPath, packPrice } from "./packs";

describe("video packs", () => {
  it("has 10 packs of 5 real, distinct books with unique ids", () => {
    expect(PACKS).toHaveLength(10);
    expect(new Set(PACKS.map((p) => p.id)).size).toBe(10);
    for (const p of PACKS) {
      expect(p.id).toMatch(/^[a-z0-9-]+$/);
      expect(p.slugs).toHaveLength(5);
      expect(new Set(p.slugs).size).toBe(5);
      for (const s of p.slugs) expect(BOOKS.some((b) => b.slug === s)).toBe(true);
    }
  });

  it("leaves out the drug-education books", () => {
    const drugs = BOOKS.filter((b) => b.category === "Performance-Enhancing Drugs" || b.category === "Peptides & New Compounds").map((b) => b.slug);
    for (const p of PACKS) expect(p.slugs.some((s) => drugs.includes(s))).toBe(false);
  });

  it("prices a pack exactly as the cart does (5 loose books, 30% off)", () => {
    for (const p of PACKS) {
      const q = priceCart(p.slugs, priceTable())!;
      expect(q.discountRate).toBe(0.3);
      expect(packPrice(p)).toEqual({ list: q.subtotal, price: q.total });
    }
    expect(packPrice(packById("indian-food")!)).toEqual({ list: 605, price: 423 });
  });

  it("builds a checkout path with the pack's books and UTM tags", () => {
    const p = packById("yoga")!;
    const path = packCheckoutPath(p, { source: "youtube", medium: "video", campaign: "library-packs" });
    const u = new URL(path, "https://example.in");
    expect(u.pathname).toBe("/library/checkout");
    expect(u.searchParams.get("add")).toBe(p.slugs.join(","));
    expect(u.searchParams.get("utm_source")).toBe("youtube");
    expect(u.searchParams.get("utm_content")).toBe("yoga");
  });
});

describe("parseAddParam", () => {
  const t = priceTable();
  it("keeps known book, bundle and complete-library ids, once each, in order", () => {
    const b = BOOKS[0].slug;
    expect(parseAddParam(`${b},combo-calm,${b},complete-library`, t)).toEqual([b, "combo-calm", "complete-library"]);
  });

  it("drops unknown or junk ids and handles empty input", () => {
    expect(parseAddParam("nope,<script>,", t)).toEqual([]);
    expect(parseAddParam(null, t)).toEqual([]);
    expect(parseAddParam("", t)).toEqual([]);
  });

  it("caps a huge list", () => {
    const many = Array.from({ length: 500 }, () => BOOKS.map((b) => b.slug).join(",")).join(",");
    expect(parseAddParam(many, t).length).toBeLessThanOrEqual(BOOKS.length);
  });
});
