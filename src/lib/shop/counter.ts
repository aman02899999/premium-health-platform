// Counter bills: pure pricing, shared by the admin screen (what the cashier sees) and the server
// (what is saved), so the bill on screen is the bill in the books. Money is whole rupees.

export type Payment = "cash" | "upi" | "card" | "other";
export const PAYMENTS: { id: Payment; label: string }[] = [
  { id: "cash", label: "Cash" },
  { id: "upi", label: "UPI" },
  { id: "card", label: "Card" },
  { id: "other", label: "Other" },
];

/** What the cashier puts on the bill. `unitPrice` empty = the product's current sale price. */
export type BillLineInput = { productId: string; qty: number; unitPrice?: number | null; variant?: string; code?: string };
/** What is saved: a snapshot, never re-read from the catalogue. */
export type BillItem = { productId: string; name: string; variant: string; code: string; qty: number; mrp: number; unitPrice: number };
export type BillProduct = { id: string; name: string; listPrice: number; salePrice: number };
export type PricedBill = { items: BillItem[]; mrpTotal: number; subtotal: number; billDiscount: number; total: number };

export const MAX_BILL_LINES = 100;

/**
 * Prices a counter bill from the catalogue. Returns a message instead when something on it can't be
 * sold that way: an unknown product, a quantity outside 1–100, a price above the printed MRP
 * (illegal in India) or below ₹1, or a bill discount bigger than the bill.
 */
export function priceBill(lines: BillLineInput[], products: Map<string, BillProduct>, billDiscount = 0): PricedBill | string {
  if (!lines.length) return "Add at least one item.";
  if (lines.length > MAX_BILL_LINES) return `A bill can have at most ${MAX_BILL_LINES} lines.`;
  const items: BillItem[] = [];
  for (const l of lines) {
    const p = products.get(l.productId);
    if (!p) return "One of the items is no longer in the store. Remove it and scan again.";
    if (!Number.isInteger(l.qty) || l.qty < 1 || l.qty > 100) return `Quantity for ${p.name} must be 1 to 100.`;
    const unitPrice = l.unitPrice === undefined || l.unitPrice === null ? p.salePrice : l.unitPrice;
    if (!Number.isInteger(unitPrice) || unitPrice < 1) return `Enter a price of at least ₹1 for ${p.name}.`;
    if (unitPrice > p.listPrice) return `${p.name} can't be sold above its MRP of ₹${p.listPrice.toLocaleString("en-IN")}.`;
    items.push({ productId: p.id, name: p.name, variant: (l.variant ?? "").slice(0, 60), code: (l.code ?? "").slice(0, 200), qty: l.qty, mrp: p.listPrice, unitPrice });
  }
  const mrpTotal = items.reduce((s, i) => s + i.mrp * i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  if (!Number.isInteger(billDiscount) || billDiscount < 0) return "The bill discount must be a whole number of rupees.";
  if (billDiscount > subtotal) return "The bill discount can't be more than the bill.";
  return { items, mrpTotal, subtotal, billDiscount, total: subtotal - billDiscount };
}

/** Units of each product on a bill (the same product can be on two lines, e.g. two flavours). */
export function unitsByProduct(items: Pick<BillItem, "productId" | "qty">[]): Map<string, number> {
  const need = new Map<string, number>();
  for (const i of items) need.set(i.productId, (need.get(i.productId) ?? 0) + i.qty);
  return need;
}

/** Plain-text bill for WhatsApp, sent by hand from the owner's phone. */
export function billText(b: { number: string; createdAt: string; items: BillItem[]; mrpTotal: number; billDiscount: number; total: number; payment: Payment }, storeName: string): string {
  const date = new Date(b.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
  const rs = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const lines = b.items.map((i) => `${i.qty} × ${i.name}${i.variant ? ` (${i.variant})` : ""} @ ${rs(i.unitPrice)} = ${rs(i.unitPrice * i.qty)}`);
  const saved = b.mrpTotal - b.total;
  return [
    `${storeName}`,
    `Bill ${b.number} · ${date}`,
    "",
    ...lines,
    "",
    ...(b.billDiscount ? [`Extra discount: −${rs(b.billDiscount)}`] : []),
    `Total paid (${PAYMENTS.find((p) => p.id === b.payment)?.label ?? b.payment}): ${rs(b.total)}`,
    ...(saved > 0 ? [`You saved ${rs(saved)} on MRP`] : []),
    "",
    "Thank you!",
  ].join("\n");
}
