"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, TrendingUp, Star } from "lucide-react";
import { getAllEnrichedArticles } from "@/data/blog-enrichment";
import type { EnrichedArticle } from "@/data/blog-enrichment";

function Card({ a }: { a: EnrichedArticle }) {
  return (
    <Link href={`/blog/${a.slug}`} className="group flex gap-3 rounded-2xl border border-stone-200 bg-white p-3 hover:border-emerald-300 dark:border-stone-700 dark:bg-stone-900">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100">
        <Image src={a.heroImage} alt={a.heroImageAlt} fill className="object-cover group-hover:scale-105 transition" sizes="80px" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">{a.category} · {a.readMinutes} min</p>
        <h4 className="line-clamp-2 text-sm font-bold leading-snug group-hover:text-emerald-700">{a.title}</h4>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-stone-500"><Clock className="h-3 w-3" /> {new Date(a.updatedAt).toLocaleDateString("en-IN")} · {a.body.length} sections</p>
      </div>
    </Link>
  );
}

export function LatestArticles({ limit = 6 }: { limit?: number }) {
  const articles = getAllEnrichedArticles().sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, limit);
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Clock className="h-4 w-4 text-emerald-600" /> Latest Articles — SEO Fresh</h3>
      <p className="mt-1 text-[11px] text-stone-500">Updated weekly — fresh content for Google freshness signal.</p>
      <div className="mt-3 grid gap-2">{articles.map((a) => <Card key={a.slug} a={a} />)}</div>
      <Link href="/blog/latest" className="mt-3 inline-block text-xs font-bold text-emerald-700 underline">View latest →</Link>
    </div>
  );
}

export function TrendingArticles({ limit = 6 }: { limit?: number }) {
  const articles = getAllEnrichedArticles().filter((a) => a.trending).slice(0, limit);
  const fallback = getAllEnrichedArticles().slice(0, limit);
  const list = articles.length ? articles : fallback;
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><TrendingUp className="h-4 w-4 text-rose-600" /> Trending — Most Read</h3>
      <p className="mt-1 text-[11px] text-stone-500">Popular this week — internal linking + social proof.</p>
      <div className="mt-3 grid gap-2">{list.map((a) => <Card key={a.slug} a={a} />)}</div>
      <Link href="/blog/trending" className="mt-3 inline-block text-xs font-bold text-emerald-700 underline">View trending →</Link>
    </div>
  );
}

export function FeaturedArticles({ limit = 3 }: { limit?: number }) {
  const articles = getAllEnrichedArticles().filter((a) => a.featured).slice(0, limit);
  return (
    <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-800 dark:from-amber-950/40">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Star className="h-4 w-4 text-amber-600" /> Featured Cornerstone Guides</h3>
      <div className="mt-3 grid gap-2">{articles.map((a) => <Card key={a.slug} a={a} />)}</div>
    </div>
  );
}
