// Cart pricing — pure, so the checkout page and the order API compute the same total.
// The server always re-prices from its own catalogue; the browser's numbers are display only.

export type PriceTable = {
  books: Record<string, { title: string; volume: number; price: number }>;
  bundles: Record<string, { name: string; slugs: string[]; price: number }>;
  complete: { id: string; name: string; slugs: string[]; price: number };
};

export type CartLine = {
  id: string;
  kind: "book" | "bundle" | "complete";
  title: string;
  /** Full price of this line in rupees. */
  price: number;
  /** True when a bundle or the complete library in the same cart already includes it (not charged). */
  included: boolean;
};

export type CartQuote = {
  lines: CartLine[];
  /** Sum of the charged lines before the multi-book discount, in rupees. */
  subtotal: number;
  /** Multi-book discount rate on loose books (0–0.3). */
  discountRate: number;
  /** Discount in rupees. */
  discount: number;
  total: number;
  /** Every book the buyer gets. */
  slugs: string[];
  /** The total costs more than the complete library. */
  completeIsCheaper: boolean;
};

export const MAX_CART_ITEMS = 60;

/** Loose books (not part of a bundle) get cheaper the more you buy. */
export const MULTI_BUY = [
  { min: 5, rate: 0.3 },
  { min: 3, rate: 0.2 },
  { min: 2, rate: 0.1 },
] as const;

export const multiBuyRate = (looseBooks: number) => MULTI_BUY.find((t) => looseBooks >= t.min)?.rate ?? 0;

/** Prices a cart of book slugs / bundle ids / the complete-library id. Returns null if the cart is empty or has an unknown item. */
export function priceCart(items: string[], t: PriceTable): CartQuote | null {
  const ids = [...new Set(items)];
  if (ids.length === 0 || ids.length > MAX_CART_ITEMS) return null;
  if (ids.some((id) => id !== t.complete.id && !t.bundles[id] && !t.books[id])) return null;

  const hasComplete = ids.includes(t.complete.id);
  const bundleIds = ids.filter((id) => t.bundles[id]);
  const bookIds = ids.filter((id) => t.books[id]);
  const inBundles = new Set(bundleIds.flatMap((id) => t.bundles[id].slugs));

  const lines: CartLine[] = [];
  if (hasComplete) lines.push({ id: t.complete.id, kind: "complete", title: t.complete.name, price: t.complete.price, included: false });
  for (const id of bundleIds) lines.push({ id, kind: "bundle", title: t.bundles[id].name, price: t.bundles[id].price, included: hasComplete });
  for (const id of bookIds) {
    const b = t.books[id];
    lines.push({ id, kind: "book", title: `Vol. ${b.volume} · ${b.title}`, price: b.price, included: hasComplete || inBundles.has(id) });
  }

  const charged = lines.filter((l) => !l.included);
  const loose = charged.filter((l) => l.kind === "book");
  const discountRate = multiBuyRate(loose.length);
  const discount = Math.round(loose.reduce((s, l) => s + l.price, 0) * discountRate);
  const subtotal = charged.reduce((s, l) => s + l.price, 0);
  const total = subtotal - discount;
  const slugs = hasComplete ? [...t.complete.slugs] : [...new Set([...bundleIds.flatMap((id) => t.bundles[id].slugs), ...bookIds])];
  return { lines, subtotal, discountRate, discount, total, slugs, completeIsCheaper: !hasComplete && total > t.complete.price };
}
