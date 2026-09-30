"use client";

import Link from "next/link";
import Image from "next/image";
import { getAllEnrichedArticles } from "@/data/blog-enrichment";
import type { EnrichedArticle } from "@/data/blog-enrichment";

export function RelatedArticles({ currentSlug, category, tags, limit = 4 }: { currentSlug: string; category?: string; tags?: string[]; limit?: number }) {
  const all = getAllEnrichedArticles();
  const current = all.find((a) => a.slug === currentSlug);

  // Score related by category + tags overlap
  const scored = all
    .filter((a) => a.slug !== currentSlug)
    .map((a) => {
      let score = 0;
      if (category && a.category === category) score += 10;
      if (tags) {
        const overlap = tags.filter((t) => a.tags.includes(t)).length;
        score += overlap * 3;
      }
      if (a.featured) score += 2;
      if (a.trending) score += 2;
      return { a, score };
    })
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((x) => x.a);

  if (scored.length === 0) return null;

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="text-sm font-bold">Related Articles — Keep Reading (SEO internal linking)</h3>
      <p className="mt-1 text-[11px] text-stone-500">Continue your learning journey — reduces bounce, increases dwell time.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {scored.map((a) => (
          <Link key={a.slug} href={`/blog/${a.slug}`} className="group flex gap-3 rounded-2xl bg-stone-50 p-3 hover:bg-emerald-50 dark:bg-stone-800 dark:hover:bg-stone-700">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
              <Image src={a.heroImage} alt={a.heroImageAlt} fill className="object-cover" sizes="64px" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-amber-600">{a.category}</p>
              <p className="line-clamp-2 text-sm font-bold group-hover:text-emerald-700">{a.title}</p>
              <p className="mt-0.5 text-[11px] text-stone-500">{a.readMinutes} min · {a.excerpt.slice(0, 60)}…</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function InlineRelated({ currentSlug }: { currentSlug: string }) {
  const all = getAllEnrichedArticles();
  const cur = all.find((a) => a.slug === currentSlug);
  if (!cur) return null;
  return <RelatedArticles currentSlug={currentSlug} category={cur.category} tags={cur.tags} limit={4} />;
}
