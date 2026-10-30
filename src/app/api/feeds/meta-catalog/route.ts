import { isDbConfigured } from "@/health/db";
import { SITE_URL } from "@/lib/site";
import { metaCatalogCsv } from "@/lib/shop/meta-feed";
import { shopOpen } from "@/lib/shop/server";
import { loadCatalog } from "@/lib/shop/store";

// Data feed URL for Meta Commerce Manager → Catalogue → Data sources → Scheduled feed.
// Public on purpose (Meta fetches it without signing in); it lists only what the shop already shows.

export const dynamic = "force-dynamic";

export async function GET() {
  // Empty while the store is switched off, so Meta stops showing ads for products nobody can buy.
  const products = isDbConfigured && (await shopOpen()) ? (await loadCatalog(true)).products : [];
  return new Response(metaCatalogCsv(products, SITE_URL), {
    headers: { "content-type": "text/csv; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
