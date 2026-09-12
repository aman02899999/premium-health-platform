import { describe, it, expect } from "vitest";
import { getProductImageUrl, DEFAULT_OG_IMAGE, PRODUCT_IMAGES } from "./images";

describe("getProductImageUrl", () => {
  it("falls back to the static OG image for missing values", () => {
    expect(getProductImageUrl(undefined)).toBe(DEFAULT_OG_IMAGE);
    expect(getProductImageUrl(null)).toBe(DEFAULT_OG_IMAGE);
    expect(getProductImageUrl("")).toBe(DEFAULT_OG_IMAGE);
    expect(getProductImageUrl("   ")).toBe(DEFAULT_OG_IMAGE);
  });

  it("strips query strings so immutable cache headers stay effective", () => {
    expect(getProductImageUrl("/products/glucometer.jpg?v=1")).toBe("/products/glucometer.jpg");
    expect(getProductImageUrl("/products/yoga-mat.jpg?w=800&h=600")).toBe("/products/yoga-mat.jpg");
    expect(getProductImageUrl("https://cdn.example.com/a.jpg?w=100")).toBe("https://cdn.example.com/a.jpg");
  });

  it("passes through clean local paths and https URLs unchanged", () => {
    expect(getProductImageUrl("/products/millet-combo.jpg")).toBe("/products/millet-combo.jpg");
    expect(getProductImageUrl("  /products/bp-monitor.jpg  ")).toBe("/products/bp-monitor.jpg");
    expect(getProductImageUrl("https://images.pexels.com/photos/1.jpeg")).toBe(
      "https://images.pexels.com/photos/1.jpeg"
    );
  });

  it("rejects malformed values that are neither local nor https", () => {
    expect(getProductImageUrl("products/glucometer.jpg")).toBe(DEFAULT_OG_IMAGE);
    expect(getProductImageUrl("javascript:alert(1)")).toBe(DEFAULT_OG_IMAGE);
    expect(getProductImageUrl("http://insecure.example.com/a.jpg")).toBe(DEFAULT_OG_IMAGE);
    expect(getProductImageUrl("?only=query")).toBe(DEFAULT_OG_IMAGE);
  });
});

describe("PRODUCT_IMAGES", () => {
  it("points at 9 real, local, non-branded product photographs", () => {
    const values = Object.values(PRODUCT_IMAGES);
    expect(values).toHaveLength(9);
    for (const v of values) {
      expect(v.startsWith("/products/")).toBe(true);
      expect(v.endsWith(".jpg")).toBe(true);
      // No query strings — these must stay cacheable as immutable assets.
      expect(v).not.toContain("?");
    }
  });
});
