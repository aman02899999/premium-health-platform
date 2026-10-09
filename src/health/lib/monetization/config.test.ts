import { describe, expect, it } from "vitest";
import { AFFILIATE_PRODUCTS } from "./config";

describe("Amazon picks: trusted brands only", () => {
  const amazon = AFFILIATE_PRODUCTS.filter((p) => p.merchant === "Amazon");
  it("every Amazon pick names a brand, and its link searches for that brand", () => {
    expect(amazon.length).toBeGreaterThan(20);
    for (const p of amazon) {
      expect(p.brand, p.title).toBeTruthy();
      const url = new URL(p.affiliateUrl);
      expect(url.hostname).toBe("www.amazon.in");
      expect(url.searchParams.get("tag")).toBeTruthy();
      if (url.pathname === "/s") expect(url.searchParams.get("k")!.toLowerCase()).toContain(p.brand!.toLowerCase());
    }
  });
  it("never claims a checked seller unless one was recorded", () => {
    for (const p of amazon) if (p.sellerCheck) expect(p.affiliateUrl).toMatch(/\/dp\/[A-Z0-9]{10}\?psc=1&smid=/);
  });
});
