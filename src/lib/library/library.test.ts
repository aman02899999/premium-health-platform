import { describe, expect, it } from "vitest";
import { BOOKS, CATEGORIES } from "./catalog";
import { COMPLETE_LIBRARY_ID, COMPLETE_LIBRARY_PRICE, libraryListPrice, parseBuyerForm, quoteLibrary } from "./pricing";

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
