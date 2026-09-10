import type { Metadata } from "next";
import NewsClient from "./NewsClient";
import { getNewsFeed } from "@/lib/news";
import { istDateKey } from "@/data/news";
import { SITE } from "@/lib/site";

export const revalidate = 600;

const seoTitle = "Health News — India Medical Briefings | BHG";
const seoDescription = "Daily updated Indian health news: outbreak advisories, seasonal care, drug-safety watch, AYUSH updates and evidence digests with sources and medical review. SEO pro + CollectionPage.";
const url = "/news";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("News — Health India")}&category=${encodeURIComponent("News")}&type=Blog`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl }, types: { "application/rss+xml": `${SITE.url}/news/rss.xml` } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const [{ c }, now] = [await searchParams, new Date()];
  const items = await getNewsFeed(now);
  return <NewsClient items={items} todayKey={istDateKey(now)} initialCat={c || "All"} />;
}
