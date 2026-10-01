import { BOOKS, type Book } from "./catalog";

// Two ways to buy: a single book, or the complete library (every volume).
// Prices always come from the server-side catalog — the browser only sends an id.

export const COMPLETE_LIBRARY_ID = "complete-library";
/** Complete library price in rupees. */
export const COMPLETE_LIBRARY_PRICE = 2999;

export type LibraryQuote = {
  /** "complete-library" or a book slug. */
  itemId: string;
  title: string;
  slugs: string[];
  amountPaise: number;
};

export const bookBySlug = (slug: string): Book | undefined => BOOKS.find((b) => b.slug === slug);

/** Combined list price of every book, in rupees — used to show the bundle saving. */
export const libraryListPrice = () => BOOKS.reduce((sum, b) => sum + b.price, 0);

export function quoteLibrary(itemId: string): LibraryQuote | null {
  if (itemId === COMPLETE_LIBRARY_ID) {
    return {
      itemId,
      title: `Complete Premium Library (${BOOKS.length} books)`,
      slugs: BOOKS.map((b) => b.slug),
      amountPaise: COMPLETE_LIBRARY_PRICE * 100,
    };
  }
  const book = bookBySlug(itemId);
  if (!book) return null;
  return { itemId, title: `Vol. ${book.volume} · ${book.title}`, slugs: [book.slug], amountPaise: book.price * 100 };
}

export type BuyerForm = { name: string; email: string; phone: string };

/** Validates buyer details; returns an error message string when invalid. */
export function parseBuyerForm(body: Record<string, unknown>): BuyerForm | string {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "") : "";
  if (name.length < 2 || name.length > 80) return "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) return "Please enter a valid email — you'll use it to recover your downloads.";
  if (!/^[6-9]\d{9}$/.test(phone)) return "Please enter a valid 10-digit Indian mobile number.";
  return { name, email, phone };
}

/** Download links stay valid for this many days after purchase. */
export const ACCESS_DAYS = 365;
/** Maximum downloads per book per purchase (stops a link being shared widely). */
export const DOWNLOADS_PER_BOOK = 5;
