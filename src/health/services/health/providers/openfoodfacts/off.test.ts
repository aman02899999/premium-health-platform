import { describe, it, expect } from "vitest";
import { openFoodFactsProvider } from "./provider";

describe("openfoodfacts provider", () => {
  it("has correct metadata", () => {
    expect(openFoodFactsProvider.name).toBe("openfoodfacts");
    expect(openFoodFactsProvider.status).toBe("AVAILABLE");
    expect(openFoodFactsProvider.capabilities.barcode).toBe(true);
  });

  it("search returns paginated structure", async () => {
    const res = await openFoodFactsProvider.search({ query: "apple", limit: 2 });
    expect(res).toHaveProperty("data");
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.source).toBe("Open Food Facts");
  });
});

describe("openfoodfacts search fallback", () => {
  it("falls back to a plain search when the India-filtered query is rejected", async () => {
    const { vi } = await import("vitest");
    const calls: string[] = [];
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.includes("countries")) return new Response(JSON.stringify({ errors: [{ title: "QueryCheckError" }] }), { status: 400 });
      return new Response(JSON.stringify({ hits: [{ code: "8901262180016", product_name: "Malai Paneer", nutriments: { "energy-kcal_100g": 290 } }], count: 1 }), { status: 200 });
    });
    try {
      const res = await openFoodFactsProvider.search({ query: "paneer-fallback-test", limit: 2 });
      expect(calls.length).toBe(2);
      expect(res.live).toBe(true);
      expect(res.data[0].name).toBe("Malai Paneer");
    } finally {
      spy.mockRestore();
    }
  });
});

describe("openfoodfacts search results", () => {
  it("strips language prefixes from brands and drops products with no nutrition", async () => {
    const { vi } = await import("vitest");
    const hits = [
      { code: "1", product_name: "Malai Paneer", brands: ["xx:Amul"], nutriments: null },
      { code: "2", product_name: "Paneer A", brands: ["xx:ananda"], nutriments: { "energy-kcal_100g": 309 } },
      { code: "3", product_name: "Paneer B", brands: ["xx:b"], nutriments: { "energy-kcal_100g": 290 } },
      { code: "4", product_name: "Paneer C", brands: ["xx:c"], nutriments: { "energy-kcal_100g": 280 } },
    ];
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify({ hits, count: 4 }), { status: 200 }));
    try {
      const res = await openFoodFactsProvider.search({ query: "paneer-brands-test", limit: 4 });
      expect(res.data.map((f) => f.name)).toEqual(["Paneer A", "Paneer B", "Paneer C"]);
      expect(res.data[0].brand).toBe("ananda");
    } finally {
      spy.mockRestore();
    }
  });
});

describe("openfoodfacts nutrient rounding", () => {
  it("rounds long floats from the database", async () => {
    const { vi } = await import("vitest");
    const hits = [1, 2, 3].map((i) => ({ code: String(i), product_name: `P${i}`, nutriments: { "energy-kcal_100g": 300.4, carbohydrates_100g: 2.2300000190734863 } }));
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify({ hits, count: 3 }), { status: 200 }));
    try {
      const res = await openFoodFactsProvider.search({ query: "rounding-test", limit: 3 });
      expect(res.data[0].nutrients.carbs).toBe(2.2);
      expect(res.data[0].nutrients.calories).toBe(300);
    } finally {
      spy.mockRestore();
    }
  });
});
