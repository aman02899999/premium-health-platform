import { NextResponse } from "next/server";
import { getNewsFeed } from "@/lib/news";
import { NEWS_CATEGORIES } from "@/data/news";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").toLowerCase();
  const cat = searchParams.get("category");
  const limit = Math.min(50, Number(searchParams.get("limit") || 20));
  let items = await getNewsFeed();
  if (cat && cat !== "All") items = items.filter((n) => n.category === cat);
  if (q) items = items.filter((n) => `${n.title} ${n.summary} ${n.tags.join(" ")}`.toLowerCase().includes(q));
  return NextResponse.json({
    count: items.length,
    updatedDaily: "06:30 IST",
    categories: NEWS_CATEGORIES,
    data: items.slice(0, limit).map((n) => ({
      slug: n.slug,
      title: n.title,
      summary: n.summary,
      category: n.category,
      kind: n.kind,
      publishedAt: n.publishedAt,
      updatedAt: n.updatedAt,
      sourceName: n.sourceName,
      sourceUrl: n.sourceUrl,
      tags: n.tags,
      keyTakeaways: n.keyTakeaways,
      relatedDiseases: n.relatedDiseases,
      url: `/news/${n.slug}`,
    })),
  });
}
