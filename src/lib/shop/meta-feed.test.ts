import { describe, expect, it } from "vitest";
import { metaCatalogCsv } from "./meta-feed";
import type { Priced } from "./pricing";

const product = (extra: Partial<Priced> = {}): Priced =>
  ({
    id: "p1", slug: "whey-1kg", name: "Whey Protein", brand: "Royal", categoryId: "c1", sku: "RW-1", listPrice: 2999, discountPct: 10, stock: 4, size: "1 kg", flavours: [],
    images: ["/shop/whey.jpg", "https://cdn.x/whey-2.jpg"], shortDescription: "24 g protein, **fast** absorbing", description: "", highlights: [], nutrition: [], howToUse: "", warnings: "",
    featured: false, active: true, seoTitle: null, seoDescription: null, updatedAt: "", discount: 10, salePrice: 2699, category: { id: "c1", name: "Protein, Whey" } as Priced["category"],
    ...extra,
  }) as Priced;

describe("Meta catalog feed", () => {
  it("lists only the price people pay, with absolute links and images", () => {
    const [head, row] = metaCatalogCsv([product()], "https://www.royalfitnesclub.in").trim().split("\n");
    expect(head).toBe("id,title,description,availability,condition,price,link,image_link,additional_image_link,brand,product_type,inventory");
    expect(row).toBe('RW-1,Royal Whey Protein 1 kg,"24 g protein, fast absorbing",in stock,new,2699.00 INR,https://www.royalfitnesclub.in/shop/p/whey-1kg,https://www.royalfitnesclub.in/shop/whey.jpg,https://cdn.x/whey-2.jpg,Royal,"Protein, Whey",4');
    expect(head).not.toContain("sale_price"); // no strike-through prices
  });
  it("never repeats the brand or the size already in the name", () => {
    const row = metaCatalogCsv([product({ name: "Royal Whey Protein 1 kg", brand: "royal" })], "https://x.in").trim().split("\n")[1];
    expect(row.split(",")[1]).toBe("Royal Whey Protein 1 kg");
  });
  it("marks sold-out items and skips ones Meta would reject", () => {
    const csv = metaCatalogCsv([product({ stock: 0 }), product({ id: "p2", sku: null, images: [] }), product({ id: "p3", sku: null, active: false })], "https://x.in");
    const rows = csv.trim().split("\n");
    expect(rows).toHaveLength(2);
    expect(rows[1]).toContain(",out of stock,");
  });
});
