import { NextRequest, NextResponse } from "next/server";
import { getAllEnrichedArticles } from "@/data/blog-enrichment";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || "";
  const category = searchParams.get("category") || "";
  const tagsParam = searchParams.get("tags") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "6", 10) || 6, 20);
  const tags = tagsParam ? tagsParam.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : [];

  const all = getAllEnrichedArticles();

  // If slug provided, use its category/tags as base if not explicitly passed
  let baseCategory = category;
  let baseTags = tags;
  if (slug) {
    const cur = all.find((a) => a.slug === slug);
    if (cur) {
      if (!baseCategory) baseCategory = cur.category;
      if (baseTags.length === 0) baseTags = cur.tags.map((t) => t.toLowerCase());
    }
  }

  const scored = all
    .filter((a) => a.slug !== slug)
    .map((a) => {
      let score = 0;
      if (baseCategory && a.category.toLowerCase() === baseCategory.toLowerCase()) score += 10;
      if (baseTags.length) {
        const overlap = baseTags.filter((t) => a.tags.map((x) => x.toLowerCase()).includes(t)).length;
        score += overlap * 3;
      }
      if (a.featured) score += 2;
      if (a.trending) score += 2;
      // freshness bonus
      const daysAgo = (Date.now() - +new Date(a.updatedAt)) / (1000 * 60 * 60 * 24);
      if (daysAgo < 30) score += 2;
      else if (daysAgo < 90) score += 1;
      return { article: a, score };
    })
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((x) => ({
      slug: x.article.slug,
      title: x.article.title,
      excerpt: x.article.excerpt,
      category: x.article.category,
      tags: x.article.tags,
      heroImage: x.article.heroImage,
      heroImageAlt: x.article.heroImageAlt,
      readMinutes: x.article.readMinutes,
      updatedAt: x.article.updatedAt,
      publishedAt: x.article.publishedAt,
      featured: x.article.featured,
      trending: x.article.trending,
      score: x.score,
    }));

  return NextResponse.json(
    {
      ok: true,
      query: { slug, category: baseCategory, tags: baseTags, limit },
      count: scored.length,
      related: scored,
      seo: {
        note: "Related articles API — powers internal linking, reduces bounce, increases dwell — SEO pro + earning via affiliate + premium CTA",
        internal_linking: "Use related to inject into blog detail footer + sidebar + latest/trending combo",
        caching: "Cache 1h client + CDN, revalidate on new publish via /api/news/publish",
      },
    },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
  );
}
