import { desc, eq } from "drizzle-orm";
import type { NewsItem } from "@/types";
import { db } from "@/db";
import { newsItems } from "@/db/schema";
import { getSeedNews, istDateKey } from "@/data/news";

/** Rows from the database are trusted CMS content; seed items guarantee a live feed even with no DB rows. */
async function readDb(): Promise<NewsItem[]> {
  try {
    const rows = await db.select().from(newsItems).where(eq(newsItems.status, "published")).orderBy(desc(newsItems.publishedAt)).limit(30);
    const mapped: (NewsItem | null)[] = rows
      .map((r): NewsItem | null => {
        const b = (r.body ?? {}) as Partial<NewsItem>;
        if (!r.slug || !r.title) return null;
        return {
          slug: r.slug,
          title: r.title,
          summary: r.summary || b.summary || "",
          category: (r.category || "Research Digest") as NewsItem["category"],
          kind: (r.kind || "briefing") as NewsItem["kind"],
          status: "published" as const,
          publishedAt: (r.publishedAt ?? new Date()).toISOString(),
          updatedAt: (r.updatedAt ?? r.publishedAt ?? new Date()).toISOString(),
          sourceName: r.sourceName || "BHG Newsroom",
          sourceUrl: r.sourceUrl || "https://www.mohfw.gov.in/",
          body: Array.isArray(b.body) ? b.body : [],
          keyTakeaways: Array.isArray(b.keyTakeaways) ? b.keyTakeaways : [],
          tags: Array.isArray(b.tags) ? b.tags : [],
          relatedDiseases: Array.isArray(b.relatedDiseases) ? b.relatedDiseases : [],
          relatedLabs: Array.isArray(b.relatedLabs) ? b.relatedLabs : [],
          relatedHerbs: Array.isArray(b.relatedHerbs) ? b.relatedHerbs : [],
          author: r.author || "BHG Newsroom",
          reviewer: r.reviewer || "Medical review pending — placeholder",
          factCheckNote: typeof b.factCheckNote === "string" ? b.factCheckNote : "Editorial item published by the BHG newsroom.",
          imagePrompt: typeof b.imagePrompt === "string" ? b.imagePrompt : "Premium editorial health news illustration, ultra-HD.",
        };
      });
    return mapped.filter((x): x is NewsItem => x !== null);
  } catch {
    return [];
  }
}

export async function getNewsFeed(date: Date = new Date()): Promise<NewsItem[]> {
  const seed = getSeedNews(date, 14);
  const fromDb = await readDb();
  if (!fromDb.length) return seed;
  const seen = new Set(fromDb.map((n) => n.slug));
  // DB content wins; seed fills any missing day so the feed never looks stale.
  return [...fromDb, ...seed.filter((s) => !seen.has(s.slug))].sort(
    (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)
  );
}

export async function getNewsItem(slug: string, date: Date = new Date()): Promise<NewsItem | null> {
  const feed = await getNewsFeed(date);
  const found = feed.find((n) => n.slug === slug);
  if (found) return found;
  // Daily briefings are deterministic — allow "briefing-YYYY-MM-DD" forever.
  if (slug.startsWith("briefing-")) {
    const key = slug.replace("briefing-", "");
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      const seed = getSeedNews(new Date(`${key}T12:00:00+05:30`), 14);
      return seed.find((n) => n.slug === slug) || null;
    }
  }
  return null;
}

export function listNewsSlugs(date: Date = new Date()): string[] {
  return getSeedNews(date, 14).map((n) => n.slug);
}

export function newsTodayKey(): string {
  return istDateKey();
}
