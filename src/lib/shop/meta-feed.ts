// Product feed for Meta Commerce Manager (Facebook / Instagram Shops and catalog ads), as CSV.
// Commerce Manager fetches /api/feeds/meta-catalog on a schedule, so the catalog follows the shop.
// Only the price people actually pay is listed: no "was" price, so Meta never shows a strike-through.
import type { Priced } from "./pricing";

const COLUMNS = ["id", "title", "description", "availability", "condition", "price", "link", "image_link", "additional_image_link", "brand", "product_type", "inventory"] as const;

const abs = (url: string, site: string) => (/^https?:\/\//.test(url) ? url : `${site}${url.startsWith("/") ? "" : "/"}${url}`);
const plain = (s: string) => s.replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim();
const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function metaCatalogCsv(products: Priced[], site: string): string {
  const rows = products
    // Meta rejects items without an image or a price.
    .filter((p) => p.active && p.images.length > 0 && p.salePrice > 0)
    .map((p) => ({
      id: p.sku || p.id,
      title: plain(`${p.brand ? `${p.brand} ` : ""}${p.name}${p.size ? ` ${p.size}` : ""}`).slice(0, 150),
      description: (plain(p.shortDescription || p.description) || p.name).slice(0, 5000),
      availability: p.stock > 0 ? "in stock" : "out of stock",
      condition: "new",
      price: `${p.salePrice.toFixed(2)} INR`,
      link: `${site}/shop/p/${p.slug}`,
      image_link: abs(p.images[0], site),
      additional_image_link: p.images.slice(1, 10).map((i) => abs(i, site)).join(","),
      brand: plain(p.brand || "Royal Supplements Store").slice(0, 100),
      product_type: p.category?.name ?? "Supplements",
      inventory: String(Math.max(0, p.stock)),
    }));
  return [COLUMNS.join(","), ...rows.map((r) => COLUMNS.map((c) => cell(r[c])).join(","))].join("\n") + "\n";
}
