import { NextRequest, NextResponse } from "next/server";
import { AFFILIATE_PRODUCTS, getAffiliateByCategory } from "@/lib/monetization/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
  const featured = searchParams.get("featured") === "true";

  let products = AFFILIATE_PRODUCTS.filter((p) => p.active);
  if (category) products = products.filter((p) => p.category === category || p.tags?.includes(category.toLowerCase()));
  if (featured) products = products.filter((p) => p.featured);
  products = products.sort((a, b) => b.priority - a.priority).slice(0, limit);

  return NextResponse.json({
    ok: true,
    count: products.length,
    products: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      category: p.category,
      price: p.price,
      originalPrice: p.originalPrice,
      currency: p.currency,
      merchant: p.merchant,
      affiliateUrl: p.affiliateUrl,
      featured: p.featured,
      priority: p.priority,
      ctaText: p.ctaText,
      disclosure: p.disclosure,
      tags: p.tags,
    })),
    seo: { note: "Affiliate products — demo data, never fabricate ratings/prices. Use placeholders until genuine affiliate URLs supplied." },
  });
}
