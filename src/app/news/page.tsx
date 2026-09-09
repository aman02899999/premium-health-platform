import type { Metadata } from "next";
import NewsClient from "./NewsClient";
import { getNewsFeed } from "@/lib/news";
import { istDateKey } from "@/data/news";
import { SITE } from "@/lib/site";

// ISR: the feed is regenerated every 10 minutes, so the 06:30 IST edition appears automatically.
export const revalidate = 600;

export const metadata: Metadata = {
  title: "Health News — Daily Medical Briefings & Advisories",
  description:
    "Daily updated Indian health news: outbreak advisories, seasonal care, drug-safety watch, AYUSH updates and evidence digests with sources and medical review.",
  alternates: { canonical: "/news", types: { "application/rss+xml": `${SITE.url}/news/rss.xml` } },
};

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const [{ c }, now] = [await searchParams, new Date()];
  const items = await getNewsFeed(now);
  return <NewsClient items={items} todayKey={istDateKey(now)} initialCat={c || "All"} />;
}
