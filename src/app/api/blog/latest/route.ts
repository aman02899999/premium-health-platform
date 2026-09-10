import { NextRequest, NextResponse } from "next/server";
import { getAllEnrichedArticles } from "@/data/blog-enrichment";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "8", 10) || 8, 20);
  const category = searchParams.get("category") || "";

  let all = getAllEnrichedArticles().sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

  if (category) {
    all = all.filter((a) => a.category.toLowerCase() === category.toLowerCase());
  }

  const list = all.slice(0, limit).map((a) => ({
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
      filter: { category: category || "all" },
      latest: list,
      seo: {
        note: "Latest API — freshness signal, powers /blog/latest + homepage latest + sitemap daily priority + newsletter weekly digest",
        sorting: "updatedAt desc — Google loves fresh",
        caching: "Cache 1h + CDN",
      },
    },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
  );
}
