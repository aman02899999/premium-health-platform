"use client";

import Link from "next/link";
import { BLOG_CATEGORIES } from "@/data/blog-enrichment";
import { getAllEnrichedArticles } from "@/data/blog-enrichment";
import { cn } from "@/lib/format";

export function BlogCategories({ activeCategory }: { activeCategory?: string }) {
  const articles = getAllEnrichedArticles();
  const cats = BLOG_CATEGORIES.map((c) => ({
    name: c,
    slug: c.toLowerCase().replace(/\s+/g, "-"),
    count: articles.filter((a) => a.category === c).length,
  }));

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="text-sm font-bold">Categories — SEO optimized</h3>
      <p className="mt-1 text-[11px] text-stone-500">Browse by topic — each category has its own SEO page /blog/category/[slug] with JSON-LD.</p>
      <div className="mt-3 grid gap-2">
        {cats.map((c) => (
          <Link
            key={c.slug}
            href={`/blog/category/${c.slug}`}
            className={cn(
              "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold",
              activeCategory === c.name ? "bg-emerald-700 text-white" : "bg-stone-50 hover:bg-emerald-50 dark:bg-stone-800 dark:hover:bg-stone-700"
            )}
          >
            <span>{c.name}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-xs", activeCategory === c.name ? "bg-white/20" : "bg-white dark:bg-stone-900")}>{c.count}</span>
          </Link>
        ))}
        <Link href="/blog/category" className="mt-1 text-xs font-bold text-emerald-700 underline">View all categories →</Link>
      </div>
    </div>
  );
}

export function BlogCategoryGrid() {
  const articles = getAllEnrichedArticles();
  const cats = BLOG_CATEGORIES.map((c) => ({
    name: c,
    slug: c.toLowerCase().replace(/\s+/g, "-"),
    count: articles.filter((a) => a.category === c).length,
    latest: articles.filter((a) => a.category === c).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0],
  }));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cats.map((c) => (
        <Link key={c.slug} href={`/blog/category/${c.slug}`} className="rounded-2xl border border-stone-200 bg-white p-5 hover:border-emerald-300 dark:border-stone-700 dark:bg-stone-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">{c.count} guides</p>
          <h3 className="mt-1 font-bold">{c.name}</h3>
          {c.latest && <p className="mt-1 text-xs text-stone-500">Latest: {c.latest.title.slice(0, 60)}…</p>}
          <p className="mt-2 text-xs font-bold text-emerald-700">Explore →</p>
        </Link>
      ))}
    </div>
  );
}
