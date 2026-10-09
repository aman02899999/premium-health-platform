import { describe, expect, it } from "vitest";
import { applyPct, priceCombo, priceProduct, quoteCart, shippingFor, suggestCombo, type Priced } from "./pricing";
import type { Category, Combo, Product } from "./types";

const cat = (id: string, discountPct: number): Category => ({ id, slug: id, name: id, description: "", discountPct, sort: 0, image: null, seoTitle: null, seoDescription: null, active: true });
const cats = [cat("protein", 50), cat("tablets", 30), cat("amino", 50), cat("creatine", 0)];
const prod = (id: string, categoryId: string, listPrice: number, extra: Partial<Product> = {}): Product => ({
  id, slug: id, name: id, brand: "Blackwolf", categoryId, sku: null, listPrice, discountPct: null, stock: 10, size: "", flavours: [], images: [], shortDescription: "", description: "",
  highlights: [], nutrition: [], howToUse: "", warnings: "", featured: false, active: true, seoTitle: null, seoDescription: null, updatedAt: "", ...extra,
});
const priced = (ps: Product[]) => new Map(ps.map((p) => [p.id, priceProduct(p, cats)]));
const combo = (id: string, items: [string, number][], extraPct = 10): Combo => ({ id, slug: id, name: id, description: "", image: null, items: items.map(([productId, qty]) => ({ productId, qty })), extraPct, featured: false, active: true, updatedAt: "" });
const free = { shippingFee: 0, freeShippingOver: 0 };

describe("sale prices", () => {
  it("uses the category discount, a product override wins", () => {
    expect(priceProduct(prod("w", "protein", 5999), cats)).toMatchObject({ discount: 50, salePrice: 3000 });
    expect(priceProduct(prod("m", "tablets", 1499), cats)).toMatchObject({ discount: 30, salePrice: 1049 });
    expect(priceProduct(prod("b", "amino", 2499), cats).salePrice).toBe(1250);
    expect(priceProduct(prod("c", "creatine", 999), cats).salePrice).toBe(999);
    expect(priceProduct(prod("x", "protein", 4000, { discountPct: 20 }), cats).salePrice).toBe(3200);
    expect(priceProduct(prod("y", "missing", 1000), cats).salePrice).toBe(1000);
    expect(applyPct(1999, 50)).toBe(1000); // rounds to the nearest rupee
  });
});

describe("combos", () => {
  it("price = sum of sale prices − the extra 10%", () => {
    const P = priced([prod("whey", "protein", 5999), prod("pre", "amino", 2999), prod("multi", "tablets", 1499)]);
    const c = priceCombo(combo("c1", [["whey", 1], ["pre", 1], ["multi", 1]]), P);
    expect(c.listTotal).toBe(5999 + 2999 + 1499);
    expect(c.saleTotal).toBe(3000 + 1500 + 1049);
    expect(c.price).toBe(Math.round((3000 + 1500 + 1049) * 0.9));
    expect(c.available).toBe(true);
    expect(priceCombo(combo("c2", [["whey", 1], ["gone", 1]]), P).available).toBe(false);
  });

  it("the combo builder lands on or just under a target", () => {
    const pool = [...priced([prod("a", "protein", 5000), prod("b", "protein", 3000), prod("c", "amino", 2000), prod("d", "tablets", 1000), prod("e", "creatine", 800), prod("f", "creatine", 650)]).values()];
    for (const target of [3000, 4000, 5000]) {
      const s = suggestCombo(target, 10, pool)!;
      expect(s.price).toBeLessThanOrEqual(target);
      expect(s.price).toBeGreaterThan(target * 0.9);
      expect(s.productIds.length).toBeGreaterThanOrEqual(2);
      expect(new Set(s.productIds).size).toBe(s.productIds.length);
      // The suggested price is exactly what the combo will cost.
      const P = new Map(pool.map((p) => [p.id, p]));
      expect(priceCombo(combo("t", s.productIds.map((id) => [id, 1])), P as Map<string, Priced>).price).toBe(s.price);
    }
    expect(suggestCombo(100, 10, pool)).toBeNull();
  });
});

describe("cart quote", () => {
  const P = priced([prod("whey", "protein", 5999, { stock: 3, flavours: ["Chocolate", "Vanilla"] }), prod("pre", "amino", 2999, { stock: 1 }), prod("off", "protein", 999, { active: false })]);
  const C = new Map([["c1", priceCombo(combo("c1", [["whey", 1], ["pre", 1]]), P)]]);

  it("prices products and combos from the catalogue", () => {
    const q = quoteCart([{ kind: "product", id: "whey", qty: 2, flavour: "Vanilla" }], P, C, free);
    expect(q).toMatchObject({ subtotal: 6000, listTotal: 11998, discountTotal: 5998, shipping: 0, total: 6000, problems: [] });
    expect(q.lines[0].flavour).toBe("Vanilla");
    expect(quoteCart([{ kind: "product", id: "whey", qty: 1, flavour: "Banana" }], P, C, free).lines[0].flavour).toBe("Chocolate");
  });

  it("checks stock across the whole cart, including combo contents", () => {
    const q = quoteCart([{ kind: "combo", id: "c1", qty: 1 }, { kind: "product", id: "pre", qty: 1 }], P, C, free);
    expect(q.problems.length).toBe(2); // pre-workout: 1 in stock, 2 needed
    expect(q.total).toBe(0);
    expect(quoteCart([{ kind: "combo", id: "c1", qty: 1 }], P, C, free).total).toBe(C.get("c1")!.price);
  });

  it("drops unavailable items and clamps silly quantities", () => {
    const q = quoteCart([{ kind: "product", id: "off", qty: 1 }, { kind: "product", id: "nope", qty: 1 }, { kind: "product", id: "whey", qty: -5 }], P, C, free);
    expect(q.problems).toHaveLength(2);
    expect(q.lines[2].qty).toBe(1);
    expect(q.total).toBe(3000);
  });

  it("delivery charge and free-delivery threshold", () => {
    expect(shippingFor(500, { shippingFee: 79, freeShippingOver: 999 })).toBe(79);
    expect(shippingFor(999, { shippingFee: 79, freeShippingOver: 999 })).toBe(0);
    expect(shippingFor(5000, { shippingFee: 79, freeShippingOver: 0 })).toBe(79);
    expect(shippingFor(0, { shippingFee: 79, freeShippingOver: 0 })).toBe(0);
    expect(quoteCart([{ kind: "product", id: "whey", qty: 1 }], P, C, { shippingFee: 99, freeShippingOver: 5000 }).total).toBe(3099);
  });
});
