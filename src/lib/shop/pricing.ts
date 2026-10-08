// Prices, combos and carts. Pure functions: the storefront shows these numbers and the
// server charges them, so the price a customer sees is the price Razorpay collects.
import type { CartLine, Category, Combo, OrderItem, Product, ShopSettings } from "./types";

export const discountFor = (p: Product, cat: Category | undefined) => p.discountPct ?? cat?.discountPct ?? 0;
export const applyPct = (rupees: number, pct: number) => Math.round((rupees * (100 - pct)) / 100);

export type Priced = Product & { discount: number; salePrice: number; category: Category | undefined };

export function priceProduct(p: Product, cats: Map<string, Category> | Category[]): Priced {
  const map = cats instanceof Map ? cats : new Map(cats.map((c) => [c.id, c]));
  const category = p.categoryId ? map.get(p.categoryId) : undefined;
  const discount = discountFor(p, category);
  return { ...p, discount, salePrice: applyPct(p.listPrice, discount), category };
}

export type PricedCombo = Combo & {
  lines: { product: Priced; qty: number }[];
  listTotal: number;
  saleTotal: number;
  price: number;
  /** All products present, active and in stock for one combo. */
  available: boolean;
};

export function priceCombo(c: Combo, products: Map<string, Priced>): PricedCombo {
  const lines = c.items.flatMap((it) => {
    const product = products.get(it.productId);
    return product ? [{ product, qty: it.qty }] : [];
  });
  const listTotal = lines.reduce((s, l) => s + l.product.listPrice * l.qty, 0);
  const saleTotal = lines.reduce((s, l) => s + l.product.salePrice * l.qty, 0);
  const available = lines.length === c.items.length && lines.length > 0 && lines.every((l) => l.product.active && l.product.stock >= l.qty);
  return { ...c, lines, listTotal, saleTotal, price: applyPct(saleTotal, c.extraPct), available };
}

export type QuoteLine = OrderItem & { image: string | null; lineList: number; lineTotal: number; problem?: string };
export type Quote = { lines: QuoteLine[]; listTotal: number; subtotal: number; discountTotal: number; shipping: number; total: number; problems: string[] };

export function shippingFor(subtotal: number, s: Pick<ShopSettings, "shippingFee" | "freeShippingOver">) {
  if (subtotal <= 0 || s.shippingFee <= 0) return 0;
  return s.freeShippingOver > 0 && subtotal >= s.freeShippingOver ? 0 : s.shippingFee;
}

/**
 * Prices a cart from the catalogue (never from what the browser says). Lines that can't be
 * sold (gone, inactive, out of stock) are kept with a `problem` and left out of the totals.
 * Stock is checked across the whole cart: a product inside a combo and on its own adds up.
 */
export function quoteCart(cart: CartLine[], products: Map<string, Priced>, combos: Map<string, PricedCombo>, settings: Pick<ShopSettings, "shippingFee" | "freeShippingOver">): Quote {
  const need = new Map<string, number>();
  const lines: QuoteLine[] = [];
  for (const raw of cart.slice(0, 50)) {
    const qty = Math.max(1, Math.min(20, Math.floor(Number(raw.qty) || 1)));
    if (raw.kind === "combo") {
      const c = combos.get(raw.id);
      if (!c || !c.active) {
        lines.push({ kind: "combo", id: raw.id, slug: "", name: "Combo no longer available", qty, unitList: 0, unitPrice: 0, image: null, lineList: 0, lineTotal: 0, problem: "This combo is no longer available." });
        continue;
      }
      for (const l of c.lines) need.set(l.product.id, (need.get(l.product.id) ?? 0) + l.qty * qty);
      lines.push({
        kind: "combo",
        id: c.id,
        slug: c.slug,
        name: c.name,
        qty,
        unitList: c.listTotal,
        unitPrice: c.price,
        contents: c.lines.map((l) => ({ name: l.product.name, qty: l.qty })),
        image: c.image ?? c.lines[0]?.product.images[0] ?? null,
        lineList: c.listTotal * qty,
        lineTotal: c.price * qty,
        problem: c.available ? undefined : "Part of this combo is out of stock.",
      });
    } else {
      const p = products.get(raw.id);
      if (!p || !p.active) {
        lines.push({ kind: "product", id: raw.id, slug: "", name: "Product no longer available", qty, unitList: 0, unitPrice: 0, image: null, lineList: 0, lineTotal: 0, problem: "This product is no longer available." });
        continue;
      }
      need.set(p.id, (need.get(p.id) ?? 0) + qty);
      const flavour = raw.flavour && p.flavours.includes(raw.flavour) ? raw.flavour : p.flavours[0];
      lines.push({ kind: "product", id: p.id, slug: p.slug, name: p.name, flavour, qty, unitList: p.listPrice, unitPrice: p.salePrice, image: p.images[0] ?? null, lineList: p.listPrice * qty, lineTotal: p.salePrice * qty });
    }
  }
  // Cart-wide stock check.
  for (const l of lines) {
    if (l.problem) continue;
    const ids = l.kind === "product" ? [l.id] : (combos.get(l.id)?.lines.map((x) => x.product.id) ?? []);
    const short = ids.find((id) => (need.get(id) ?? 0) > (products.get(id)?.stock ?? 0));
    if (short) {
      const p = products.get(short)!;
      l.problem = p.stock > 0 ? `Only ${p.stock} of ${p.name} left — reduce the quantity.` : `${p.name} is out of stock.`;
    }
  }
  const ok = lines.filter((l) => !l.problem);
  const listTotal = ok.reduce((s, l) => s + l.lineList, 0);
  const subtotal = ok.reduce((s, l) => s + l.lineTotal, 0);
  const shipping = shippingFor(subtotal, settings);
  return { lines, listTotal, subtotal, discountTotal: listTotal - subtotal, shipping, total: subtotal + shipping, problems: lines.flatMap((l) => (l.problem ? [l.problem] : [])) };
}

/**
 * Suggests products for a combo whose final price (sale prices − extraPct) comes as close to
 * `target` as possible without going over. One unit each, 2–`maxItems` different products.
 * Exact subset-sum over rupees (catalogues here are small), preferring fewer items on ties.
 */
export function suggestCombo(target: number, extraPct: number, pool: Priced[], maxItems = 5): { productIds: string[]; price: number; saleTotal: number } | null {
  const items = pool.filter((p) => p.active && p.stock > 0 && p.salePrice > 0).slice(0, 120);
  // Largest sale total whose discounted price stays within the target.
  let cap = Math.floor((target * 100) / (100 - extraPct)) + 1;
  while (cap > 0 && applyPct(cap, extraPct) > target) cap--;
  if (cap <= 0 || cap > 200_000) return null;
  // best[sum] = fewest items reaching that sum exactly; pick[sum] = which items.
  const INF = 1e9;
  let best = new Int32Array(cap + 1).fill(INF);
  best[0] = 0;
  const pick = new Map<number, number[]>([[0, []]]);
  for (let i = 0; i < items.length; i++) {
    const v = items[i].salePrice;
    const next = best.slice();
    for (let s = cap - v; s >= 0; s--) {
      if (best[s] >= maxItems || best[s] === INF) continue;
      const n = best[s] + 1;
      if (n < next[s + v]) {
        next[s + v] = n;
        pick.set(s + v, [...(pick.get(s) ?? []), i]);
      }
    }
    best = next;
  }
  for (let s = cap; s > 0; s--) {
    if (best[s] >= 2 && best[s] <= maxItems) {
      const idx = pick.get(s)!;
      return { productIds: idx.map((i) => items[i].id), price: applyPct(s, extraPct), saleTotal: s };
    }
  }
  return null;
}
