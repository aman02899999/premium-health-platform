import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { AFFILIATE_PRODUCTS } from "./config";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(p) ? [p] : [];
  });
}

describe("affiliate products", () => {
  it("are real, tagged Amazon links with unique ids and no invented prices or ratings", () => {
    expect(AFFILIATE_PRODUCTS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(AFFILIATE_PRODUCTS.map((p) => p.id)).size).toBe(AFFILIATE_PRODUCTS.length);
    for (const p of AFFILIATE_PRODUCTS) {
      const url = new URL(p.affiliateUrl!);
      expect(url.hostname).toBe("www.amazon.in");
      expect(url.searchParams.get("tag")).toBe("rfc93-21");
      expect(p.price).toBe(0);
      expect(p.rating).toBeUndefined();
      expect(p.disclosure).toMatch(/commission/i);
    }
  });

  it("are never shown on the Royal Fitness Club site", () => {
    const gym = [...files("src/app/(gym)"), ...files("src/components")];
    for (const f of gym) {
      expect(readFileSync(f, "utf8"), f).not.toMatch(/monetization\/config|HealthProductRecommendations|AffiliateProductCard|health\/data\/editorial/);
    }
  });
});
