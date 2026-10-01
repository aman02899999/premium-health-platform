import { describe, expect, it } from "vitest";
import { BOOKS, CATEGORIES, TIERS } from "./catalog";
import { BUNDLES } from "./bundles";
import { priceCart } from "./cart";
import { EXCERPTS } from "./excerpts";
import { parseReviewForm } from "./review-form";
import { COMPLETE_LIBRARY_ID, COMPLETE_LIBRARY_PRICE, bookBySlug, libraryListPrice, parseBuyerForm, phoneDigits, priceTable, quoteCart, quoteLibrary } from "./pricing";

describe("library catalogue", () => {
  it("has 60 unique volumes with valid data", () => {
    expect(BOOKS).toHaveLength(60);
    expect(new Set(BOOKS.map((b) => b.slug)).size).toBe(60);
    expect(new Set(BOOKS.map((b) => b.volume)).size).toBe(60);
    for (const b of BOOKS) {
      expect(b.slug).toMatch(/^\d{2}-[a-z0-9-]+$/);
      expect(b.price).toBeGreaterThan(0);
      expect(b.pages).toBeGreaterThanOrEqual(50);
      expect(b.benefits).toHaveLength(3);
      expect(CATEGORIES).toContain(b.category);
      expect(b.blurb).not.toMatch(/Sector 93|Gejha|Noida/i);
      const ex = EXCERPTS[b.slug];
      expect(ex.blocks.length).toBeGreaterThan(0);
      expect(JSON.stringify(ex)).not.toMatch(/\[(Certain|Likely|Guessing)\]|Sector 93|Gejha/);
    }
  });
});

describe("quoteLibrary", () => {
  it("prices a single book from the catalogue in paise", () => {
    const b = BOOKS[0];
    expect(quoteLibrary(b.slug)).toEqual({ itemId: b.slug, title: `Vol. ${b.volume} · ${b.title}`, slugs: [b.slug], amountPaise: b.price * 100 });
  });

  it("prices the complete library and includes every book", () => {
    const q = quoteLibrary(COMPLETE_LIBRARY_ID)!;
    expect(q.amountPaise).toBe(COMPLETE_LIBRARY_PRICE * 100);
    expect(q.slugs).toHaveLength(BOOKS.length);
    expect(COMPLETE_LIBRARY_PRICE).toBeLessThan(libraryListPrice());
  });

  it("rejects unknown items", () => {
    expect(quoteLibrary("not-a-book")).toBeNull();
    expect(quoteLibrary("")).toBeNull();
  });
});

describe("parseBuyerForm", () => {
  it("accepts and normalises valid details", () => {
    expect(parseBuyerForm({ name: " Asha ", email: "Asha@Example.com ", phone: "+91 98765-43210" })).toEqual({ name: "Asha", email: "asha@example.com", phone: "9876543210" });
  });

  it("rejects bad input with a message", () => {
    expect(typeof parseBuyerForm({ name: "A", email: "a@b.co", phone: "9876543210" })).toBe("string");
    expect(typeof parseBuyerForm({ name: "Asha", email: "nope", phone: "9876543210" })).toBe("string");
    expect(typeof parseBuyerForm({ name: "Asha", email: "a@b.co", phone: "12345" })).toBe("string");
  });
});

describe("tiered prices", () => {
  it("prices every book from its tier", () => {
    for (const b of BOOKS) expect(b.price).toBe(TIERS[b.tier].price);
  });
});

describe("bundles", () => {
  it("have unique ids, real books and a genuine saving", () => {
    expect(new Set(BUNDLES.map((b) => b.id)).size).toBe(BUNDLES.length);
    for (const b of BUNDLES) {
      expect(b.slugs.length).toBeGreaterThanOrEqual(3);
      expect(b.listPrice).toBe(b.slugs.reduce((s, slug) => s + bookBySlug(slug)!.price, 0));
      expect(b.price).toBeLessThan(b.listPrice * 0.65);
      expect(String(b.price)).toMatch(/99$/);
    }
  });

  it("include one collection per section covering every book", () => {
    const sections = BUNDLES.filter((b) => b.kind === "section");
    expect(sections).toHaveLength(CATEGORIES.length);
    expect(new Set(sections.flatMap((b) => b.slugs)).size).toBe(BOOKS.length);
  });
});

describe("cart pricing", () => {
  const t = priceTable();
  const [a, b, c, d, e] = BOOKS.map((x) => x.slug);
  const price = (slug: string) => bookBySlug(slug)!.price;

  it("gives multi-book discounts on loose books", () => {
    expect(priceCart([a], t)!.discountRate).toBe(0);
    expect(priceCart([a, b], t)!.discountRate).toBe(0.1);
    expect(priceCart([a, b, c], t)!.discountRate).toBe(0.2);
    const q = priceCart([a, b, c, d, e], t)!;
    const sum = [a, b, c, d, e].reduce((s, x) => s + price(x), 0);
    expect(q.discountRate).toBe(0.3);
    expect(q.total).toBe(sum - Math.round(sum * 0.3));
  });

  it("doesn't charge for a book already in a bundle in the cart", () => {
    const bundle = BUNDLES[0];
    const q = priceCart([bundle.id, bundle.slugs[0]], t)!;
    expect(q.total).toBe(bundle.price);
    expect(q.lines.find((l) => l.id === bundle.slugs[0])!.included).toBe(true);
  });

  it("makes everything else free when the complete library is in the cart", () => {
    const q = priceCart([a, BUNDLES[1].id, COMPLETE_LIBRARY_ID], t)!;
    expect(q.total).toBe(COMPLETE_LIBRARY_PRICE);
    expect(q.slugs).toHaveLength(BOOKS.length);
  });

  it("suggests the complete library when it's cheaper", () => {
    expect(priceCart(BOOKS.slice(0, 20).map((x) => x.slug), t)!.completeIsCheaper).toBe(true);
    expect(priceCart([a], t)!.completeIsCheaper).toBe(false);
  });

  it("rejects empty carts and unknown items, and dedupes", () => {
    expect(priceCart([], t)).toBeNull();
    expect(priceCart([a, "nope"], t)).toBeNull();
    expect(priceCart([a, a], t)!.total).toBe(price(a));
  });

  it("server quote charges only the charged lines", () => {
    const q = quoteCart([BUNDLES[0].id, BUNDLES[0].slugs[0], b])!;
    expect(q.itemId.split(",")).toEqual([BUNDLES[0].id, b]);
    expect(q.amountPaise).toBe((BUNDLES[0].price + price(b)) * 100);
  });
});

describe("international buyers", () => {
  it("accepts +country numbers and keeps Indian numbers as 10 digits", () => {
    expect(parseBuyerForm({ name: "Sam", email: "s@x.co", phone: "+44 7911 123456" })).toMatchObject({ phone: "+447911123456" });
    expect(parseBuyerForm({ name: "Asha", email: "a@x.co", phone: "+919876543210" })).toMatchObject({ phone: "9876543210" });
    expect(phoneDigits("+447911123456")).toBe("447911123456");
    expect(phoneDigits("9876543210")).toBe("919876543210");
  });
});

describe("parseReviewForm", () => {
  const ok = { rating: 5, body: "Clear, practical and easy to follow.", displayName: "Riya", city: "Pune", country: "India" };
  it("accepts a valid review", () => {
    expect(parseReviewForm(ok)).toEqual(ok);
  });
  it("rejects bad ratings, short text, links and unknown countries", () => {
    expect(typeof parseReviewForm({ ...ok, rating: 6 })).toBe("string");
    expect(typeof parseReviewForm({ ...ok, rating: 0 })).toBe("string");
    expect(typeof parseReviewForm({ ...ok, body: "Good" })).toBe("string");
    expect(typeof parseReviewForm({ ...ok, body: "Great book, see https://spam.example for more" })).toBe("string");
    expect(typeof parseReviewForm({ ...ok, country: "Atlantis" })).toBe("string");
  });
});
