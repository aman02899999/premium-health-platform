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
