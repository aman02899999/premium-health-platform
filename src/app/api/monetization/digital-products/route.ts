import { NextRequest, NextResponse } from "next/server";
import { DIGITAL_PRODUCTS, getDigitalByCategory } from "@/lib/monetization/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

  let products = DIGITAL_PRODUCTS.filter((p) => p.active);
  if (category) products = products.filter((p) => p.category === category || p.tags?.includes(category.toLowerCase()));
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
      format: p.format,
      pages: p.pages,
      fileSize: p.fileSize,
      author: p.author,
      featured: p.featured,
      ctaText: p.ctaText,
      previewUrl: p.previewUrl,
    })),
  });
}
