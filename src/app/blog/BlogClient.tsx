"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, Clock, Flame, Search, Star } from "lucide-react";
import type { EnrichedArticle } from "@/data/blog-enrichment";
import { BLOG_CATEGORIES } from "@/data/blog-enrichment";
import { BookmarkButton, HealthTipOfDay } from "@/components/engagement";
import { AdSlot, Newsletter } from "@/components/ui";
import { cn } from "@/lib/format";

function ArticleCard({ a, large }: { a: EnrichedArticle; large?: boolean }) {
  return (
    <Link
      href={`/blog/${a.slug}`}
      className="card-3d group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
    >
      <div className={cn("relative w-full overflow-hidden bg-stone-100 dark:bg-stone-800", large ? "aspect-[16/8]" : "aspect-[16/9]")}>
        <Image
          src={a.heroImage}
          alt={a.heroImageAlt}
          fill
          sizes={large ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="rounded-full bg-emerald-700/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">{a.category}</span>
          {a.trending && <span className="flex items-center gap-1 rounded-full bg-amber-500/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"><Flame className="h-3 w-3" /> Trending</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600">
          <Clock className="h-3 w-3" /> {a.readMinutes} min read · {a.body.length} sections · {a.faqs.length} FAQs
        </p>
        <h3 className={cn("font-display mt-1.5 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-300", large ? "text-xl font-black md:text-2xl" : "text-lg font-bold")}>{a.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-stone-600 dark:text-stone-300">{a.excerpt}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-[13px] font-bold text-emerald-700 dark:text-emerald-300">Read full guide →</span>
          <span onClick={(e) => e.preventDefault()}><BookmarkButton slug={a.slug} title={a.title} /></span>
        </div>
      </div>
    </Link>
  );
}

export default function BlogClient({ articles }: { articles: EnrichedArticle[] }) {
  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"featured" | "latest" | "quick">("featured");

  const filtered = useMemo(() => {
    let list = articles.filter((a) => {
      if (tab !== "All" && a.category !== tab) return false;
      if (q && !`${a.title} ${a.excerpt} ${a.tags.join(" ")} ${a.category}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    if (sort === "latest") list = [...list].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    else if (sort === "quick") list = [...list].sort((a, b) => a.readMinutes - b.readMinutes);
    else list = [...list].sort((a, b) => Number(b.featured || false) - Number(a.featured || false) || Number(b.trending || false) - Number(a.trending || false));
    return list;
  }, [articles, tab, q, sort]);

  const [hero, ...rest] = filtered;
  const tabs = ["All", ...BLOG_CATEGORIES];

  return (
    <div>
      {/* Tabs + search */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0" role="tablist" aria-label="Blog categories">
          {tabs.map((c) => {
            const count = c === "All" ? articles.length : articles.filter((a) => a.category === c).length;
            return (
              <button
                key={c}
                role="tab"
                aria-selected={tab === c}
                onClick={() => setTab(c)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-bold transition",
                  tab === c
                    ? "border-emerald-700 bg-emerald-700 text-white shadow-md"
                    : "border-stone-200 bg-white text-stone-600 hover:border-emerald-300 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
                )}
              >
                {c}<span className={cn("rounded-full px-1.5 text-[11px]", tab === c ? "bg-white/20" : "bg-stone-100 text-stone-500 dark:bg-stone-800")}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 dark:border-stone-700 dark:bg-stone-900">
          <Search className="h-4 w-4 text-stone-400" />
          <span className="sr-only">Search articles</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guides: diabetes, thyroid, millets, yoga…" className="w-full bg-transparent text-sm outline-none" />
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort articles" className="rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold dark:border-stone-700 dark:bg-stone-900">
          <option value="featured">Sort: Featured first</option>
          <option value="latest">Sort: Recently updated</option>
          <option value="quick">Sort: Quickest reads</option>
        </select>
      </div>

      <p className="mt-4 text-sm text-stone-500" role="status">{filtered.length} guide{filtered.length === 1 ? "" : "s"}{tab !== "All" ? ` in ${tab}` : ""}{q ? ` matching “${q}”` : ""}</p>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed p-10 text-center text-sm text-stone-500">
          No guides match. <button onClick={() => { setQ(""); setTab("All"); }} className="font-bold text-emerald-700 underline">Clear filters</button>
        </div>
      ) : (
        <>
          {hero && (
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2"><ArticleCard a={hero} large /></div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-800 dark:from-amber-950/40">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300"><Star className="h-3.5 w-3.5" /> Why our guides?</p>
                  <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-stone-700 dark:text-stone-200">
                    <li>· Every claim tied to a guideline or review — no miracle cures</li>
                    <li>· Indian plates, prices and pharmacy realities — not US advice</li>
                    <li>· Evidence grades on every herb, medicine and remedy</li>
                    <li>· Reviewed structure: author, reviewer, dates on each guide</li>
                  </ul>
                </div>
                <HealthTipOfDay />
              </div>
            </div>
          )}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((a) => <ArticleCard key={a.slug} a={a} />)}
          </div>
        </>
      )}

      <div className="mt-8 grid gap-4 rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
        <p className="flex items-center gap-2 text-sm font-bold"><BookOpen className="h-4 w-4 text-emerald-600" /> Browse by topic</p>
        <div className="flex flex-wrap gap-2">
          {BLOG_CATEGORIES.map((c) => (
            <button key={c} onClick={() => { setTab(c); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-full bg-stone-100 px-3.5 py-1.5 text-[13px] font-semibold hover:bg-emerald-100 dark:bg-stone-800 dark:hover:bg-emerald-950">
              {c} ({articles.filter((a) => a.category === c).length})
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-6"><AdSlot slot="Blog mid" /><Newsletter compact /></div>
    </div>
  );
}
