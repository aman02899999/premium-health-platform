import { describe, expect, it } from "vitest";
import { DIET_PLANS } from "./config";
import { SALE_ITEMS, feedSaleItem, priceLine, reelScript, saleBody, saleCta, saleHook, storyItem } from "./sales-catalog";
import { checkoutReminder, coachsPick, isMonday, isWednesday, resumePath, weeklyPicks, type AbandonedOrder } from "./sales-emails";
import { BOOKS } from "@/lib/library/catalog";
import { BUNDLES } from "@/lib/library/bundles";

const SITE = "https://www.example.in";
const day = (start: string, n: number) => new Date(Date.parse(start) + n * 86_400_000).toISOString().slice(0, 10);

describe("sales catalogue", () => {
  it("sells every diet plan, the library and its combos, and never the drug-education sections", () => {
    const ids = new Set(SALE_ITEMS.map((i) => i.id));
    expect(ids.size).toBe(SALE_ITEMS.length);
    for (const p of DIET_PLANS) expect(ids.has(`diet-${p.id}`)).toBe(true);
    const banned = new Set(BOOKS.filter((b) => b.category === "Performance-Enhancing Drugs" || b.category === "Peptides & New Compounds").map((b) => b.slug));
    for (const i of SALE_ITEMS) {
      expect(i.path.includes("performance-enhancing") || i.path.includes("peptides")).toBe(false);
      if (i.id.startsWith("book-")) expect(banned.has(i.id.slice(5))).toBe(false);
    }
    for (const b of BUNDLES.filter((x) => x.slugs.some((s) => banned.has(s)))) expect(ids.has(`combo-${b.id}`)).toBe(false);
    expect(SALE_ITEMS.filter((i) => i.kind === "workout").length).toBeGreaterThan(5);
    expect(SALE_ITEMS.filter((i) => i.kind === "combo").length).toBeGreaterThan(5);
  });

  it("every item has a real link, a fair price and copy that fits the cards", () => {
    for (const i of SALE_ITEMS) {
      expect(i.price).toBeGreaterThan(0);
      if (i.listPrice !== null) expect(i.listPrice).toBeGreaterThan(i.price);
      expect(i.bullets.every((b) => b.length > 5 && b.length <= 110)).toBe(true);
      if (i.kind === "diet") expect(DIET_PLANS.some((p) => i.path === `/diet-chart?plan=${p.id}`)).toBe(true);
      else if (i.path.startsWith("/library/")) expect(BOOKS.some((b) => i.path === `/library/${b.slug}`)).toBe(true);
      else expect(["/library#combos", "/library#collections"]).toContain(i.path);
      for (let n = 0; n < 4; n++) expect(saleHook(i, n).length).toBeLessThanOrEqual(90);
    }
  });

  it("makes no cure, guarantee or fake-urgency claims anywhere", () => {
    const all = SALE_ITEMS.flatMap((i, n) => [saleHook(i, n), saleBody(i), saleCta(i), reelScript(i, n)]).join(" ");
    expect(all).not.toMatch(/\bcures?\b|guarantee|100%|only \d+ (left|seats)|today only|limited time|lose \d+ ?kg/i);
  });

  it("shows a different product every day and walks the whole catalogue", () => {
    const seen = new Set(Array.from({ length: SALE_ITEMS.length }, (_, n) => storyItem(day("2026-10-16", n)).id));
    expect(seen.size).toBe(SALE_ITEMS.length);
    expect(storyItem("2026-10-16")).toEqual(storyItem("2026-10-16"));
    // The weekly feed post and that day's story are never the same product.
    for (let w = 0; w < 20; w++) expect(feedSaleItem(w).id).not.toBe(storyItem(day("2026-10-18", w * 7)).id);
  });

  it("writes a filmable Reel with the price", () => {
    const item = SALE_ITEMS.find((i) => i.kind === "combo")!;
    const r = reelScript(item, 0);
    expect(r).toContain(priceLine(item));
    expect(r.split("\n").filter((l) => /^\d/.test(l))).toHaveLength(5);
  });
});

describe("sales emails", () => {
  const diet: AbandonedOrder = { kind: "diet", id: "o1", name: "Asha Rao", email: "Asha@Example.com", plan: "3m", itemId: "", title: "", amountPaise: 299900 };
  const book: AbandonedOrder = { kind: "book", id: "o2", name: "Ravi", email: "ravi@example.com", plan: "", itemId: BOOKS[0].slug, title: `Vol. 1 · ${BOOKS[0].title}`, amountPaise: BOOKS[0].price * 100 };

  it("sends people back to exactly what they were buying", () => {
    expect(resumePath(diet)).toBe("/diet-chart?plan=3m#order");
    expect(resumePath(book)).toBe(`/library/${BOOKS[0].slug}`);
    expect(resumePath({ ...book, itemId: BUNDLES[0].id })).toBe("/library#combos");
    expect(resumePath({ ...book, itemId: `${BOOKS[0].slug},${BOOKS[1].slug}` })).toBe("/library");
  });

  it("a checkout reminder is gentle, tracked, unsubscribable and keyed to the order", () => {
    const d = checkoutReminder(diet, SITE, "Coach Aman Sharma", "+91 88518 30081");
    expect(d).toMatchObject({ channel: "email", to: "asha@example.com", kind: "nurture-checkout", dedupeKey: "checkout:diet:o1" });
    expect(d.subject).toBe("Asha, your 3-Month Transformation is one step away");
    expect(d.body).toContain(`[[CTA:Finish getting 3-Month Transformation|${SITE}/diet-chart?plan=3m&utm_source=email&utm_medium=email&utm_campaign=checkout-reminder#order]]`);
    expect(d.body).toContain("₹2,999");
    expect(d.body).toContain("Already paid?");
    const b = checkoutReminder(book, SITE, "c", "p");
    expect(b.subject).toBe(`Ravi, your ${BOOKS[0].title} is one step away`);
    expect(b.dedupeKey).toBe("checkout:book:o2");
  });

  it("Coach's Pick: Wednesdays, three different kinds, every link tagged", () => {
    expect(isWednesday("2026-10-21")).toBe(true);
    expect(isMonday("2026-10-19")).toBe(true);
    const picks = weeklyPicks("2026-10-21");
    expect(picks.map((p) => p.kind)).toEqual(["diet", expect.stringMatching(/workout|book/), "combo"]);
    expect(weeklyPicks("2026-10-28")[1].id).not.toBe(picks[1].id);
    const e = coachsPick("2026-10-21", "Reader@Example.com", SITE, "Coach Aman Sharma");
    expect(e).toMatchObject({ kind: "nurture-pick", to: "reader@example.com", dedupeKey: "pick:2026-10-21:reader@example.com" });
    for (const p of picks) expect(e.body).toContain(`${SITE}${p.path.split("#")[0]}${p.path.includes("?") ? "&" : "?"}utm_source=email`);
    expect(e.body.length).toBeLessThan(6000);
  });
});
