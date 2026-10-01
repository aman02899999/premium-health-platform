import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fruityviceProvider } from "./provider";
import { cacheClear } from "../../cache";

const CATALOGUE = [
  { name: "Mango", family: "Anacardiaceae", genus: "Mangifera", order: "Sapindales", nutritions: { calories: 60, fat: 0.38, sugar: 13.7, carbohydrates: 15, protein: 0.82 } },
  { name: "Apple", family: "Rosaceae", genus: "Malus", order: "Rosales", nutritions: { calories: 52, fat: 0.4, sugar: 10.3, carbohydrates: 11.4, protein: 0.3 } },
  { name: "Guava", family: "Myrtaceae", genus: "Psidium", order: "Myrtales", nutritions: { calories: 68, fat: 0.95, sugar: 8.9, carbohydrates: 14.3, protein: 2.55 } },
];

beforeEach(() => {
  cacheClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fruityvice provider", () => {
  it("has correct metadata and needs no key", () => {
    expect(fruityviceProvider.name).toBe("fruityvice");
    expect(fruityviceProvider.config.requiresKey).toBe(false);
  });

  it("filters the local catalogue and maps nutrients", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(CATALOGUE), { status: 200 })));

    const result = await fruityviceProvider.search({ query: "mango", limit: 10 });

    expect(result.live).toBe(true);
    expect(result.data).toHaveLength(1);

    const mango = result.data[0];
    expect(mango.name).toBe("Mango");
    expect(mango.id).toBe("mango");
    expect(mango.category).toBe("Fruit");
    expect(mango.nutrients?.calories).toBe(60);
    expect(mango.nutrients?.sugar).toBe(13.7);
    expect(mango.nutrients?.protein).toBe(0.82);
    expect(mango.provenance.source).toBe("Fruityvice");
  });

  it("matches on family as well as name, and is case-insensitive", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(CATALOGUE), { status: 200 })));
    const result = await fruityviceProvider.search({ query: "rosaceae", limit: 10 });
    expect(result.data.map((f) => f.name)).toEqual(["Apple"]);
  });

  it("honours the limit and reports hasMore", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(CATALOGUE), { status: 200 })));
    const result = await fruityviceProvider.search({ query: "", limit: 2 });
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(3);
    expect(result.hasMore).toBe(true);
  });

  it("returns an empty, non-live result when the upstream is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("offline");
    }));

    const result = await fruityviceProvider.search({ query: "banana", limit: 5 });
    expect(result.live).toBe(false);
    expect(result.data).toEqual([]);
  });

  it("returns null from getById for an unknown fruit", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({}), { status: 200 })));
    expect(await fruityviceProvider.getById("dragonfruit")).toBeNull();
  });
});
