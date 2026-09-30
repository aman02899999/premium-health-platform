import { NextRequest, NextResponse } from "next/server";
import { getAllEnrichedArticles } from "@/data/blog-enrichment";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "6", 10) || 6, 20);

  const all = getAllEnrichedArticles();
  const trendingFlagged = all.filter((a) => a.trending);
  const list = (trendingFlagged.length ? trendingFlagged : all)
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, limit)
    .map((a) => ({
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      category: a.category,
      tags: a.tags,
      heroImage: a.heroImage,
      heroImageAlt: a.heroImageAlt,
      readMinutes: a.readMinutes,
      updatedAt: a.updatedAt,
      publishedAt: a.publishedAt,
      featured: a.featured,
      trending: a.trending,
    }));

  return NextResponse.json(
    {
      ok: true,
      count: list.length,
      trending: list,
      seo: {
        note: "Trending API — most read this week, social proof + FOMO, powers /blog/trending + sidebar TrendingArticles + homepage trending + newsletter",
        algorithm: "Demo: trending flag + updatedAt sort. Production: GA4 pageviews + /api/earn/stats + gtag + UTM + referral viral loop",
        caching: "Cache 1h + CDN",
      },
    },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
  );
}
