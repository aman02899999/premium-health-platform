import { BOOKS, type Book } from "./catalog";
import { BUNDLES } from "./bundles";
import { priceCart, type CartQuote, type PriceTable } from "./cart";

// Ways to buy: a single book, a combo/section bundle, a cart of several (multi-book
// discount), or the complete library. Prices always come from the server-side
// catalogue — the browser only sends ids.

export const COMPLETE_LIBRARY_ID = "complete-library";
/** Complete library price in rupees. */
export const COMPLETE_LIBRARY_PRICE = 2999;

export type LibraryQuote = {
  /** Comma-separated cart ids ("complete-library", bundle ids, book slugs). */
  itemId: string;
  title: string;
  slugs: string[];
  amountPaise: number;
};

export const bookBySlug = (slug: string): Book | undefined => BOOKS.find((b) => b.slug === slug);

/** Combined list price of every book, in rupees — used to show the bundle saving. */
export const libraryListPrice = () => BOOKS.reduce((sum, b) => sum + b.price, 0);

/** The price list the cart is computed from (also sent to the checkout page for display). */
export function priceTable(): PriceTable {
  return {
    books: Object.fromEntries(BOOKS.map((b) => [b.slug, { title: b.title, volume: b.volume, price: b.price }])),
    bundles: Object.fromEntries(BUNDLES.map((b) => [b.id, { name: b.name, slugs: b.slugs, price: b.price }])),
    complete: { id: COMPLETE_LIBRARY_ID, name: `Complete Premium Library (${BOOKS.length} books)`, slugs: BOOKS.map((b) => b.slug), price: COMPLETE_LIBRARY_PRICE },
  };
}

function orderTitle(q: CartQuote): string {
  const charged = q.lines.filter((l) => !l.included);
  const title = charged.length === 1 ? charged[0].title : `${q.slugs.length} books: ${charged.map((l) => l.title.replace(/^Vol\. \d+ · /, "")).join(", ")}`;
  return title.length > 200 ? `${title.slice(0, 197)}…` : title;
}

/** Server-side quote for a cart, or null if it's empty or names an unknown item. */
export function quoteCart(items: string[]): LibraryQuote | null {
  const q = priceCart(items, priceTable());
  if (!q || q.total <= 0) return null;
  const ids = q.lines.filter((l) => !l.included).map((l) => l.id);
  return { itemId: ids.join(","), title: orderTitle(q), slugs: q.slugs, amountPaise: q.total * 100 };
}

export const quoteLibrary = (itemId: string) => quoteCart([itemId]);

export type BuyerForm = { name: string; email: string; phone: string };

/** Validates buyer details; returns an error message string when invalid. Indian numbers are stored as 10 digits, others as +<country><number>. */
export function parseBuyerForm(body: Record<string, unknown>): BuyerForm | string {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const raw = typeof body.phone === "string" ? body.phone.replace(/[\s()-]/g, "") : "";
  const indian = raw.replace(/^(\+91|91|0)(?=\d{10}$)/, "");
  const phone = /^[6-9]\d{9}$/.test(indian) ? indian : /^\+[1-9]\d{7,14}$/.test(raw) && !raw.startsWith("+91") ? raw : "";
  if (name.length < 2 || name.length > 80) return "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) return "Please enter a valid email — you'll use it to recover your downloads.";
  if (!phone) return "Please enter a valid mobile number (10 digits for India, or +country code and number).";
  return { name, email, phone };
}

/** wa.me / tel digits for a stored phone (Indian numbers are stored without +91). */
export const phoneDigits = (phone: string) => (phone.startsWith("+") ? phone.slice(1) : `91${phone}`);

/** Download links stay valid for this many days after purchase. */
export const ACCESS_DAYS = 365;
/** Maximum downloads per book per purchase (stops a link being shared widely). */
export const DOWNLOADS_PER_BOOK = 5;
