"use client";

import Link from "next/link";
import { ShoppingBag, ExternalLink } from "lucide-react";
import { PRODUCTS } from "@/data/editorial";
import { trackAffiliateClick } from "@/components/marketing/Analytics";

export function AffiliateProducts({ limit = 4, title = "Recommended Products — Earn via Affiliate" }: { limit?: number; title?: string }) {
  const prods = PRODUCTS.slice(0, limit);
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><ShoppingBag className="h-4 w-4 text-emerald-600" /> {title}</h3>
      <p className="mt-1 text-[11px] text-stone-500">Affiliate disclosure: we may earn commission at no extra cost — never influences evidence ratings. Tracked for earning optimization.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {prods.map((p) => (
          <Link
            key={p.slug}
            href={`/products/${p.slug}`}
            onClick={() => trackAffiliateClick(p.slug, p.merchant)}
            className="group rounded-2xl border border-stone-100 bg-stone-50 p-4 hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-stone-800 dark:bg-stone-800/50"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{p.category}</p>
            <p className="mt-1 font-bold leading-snug group-hover:text-emerald-700">{p.name}</p>
            <p className="mt-1 line-clamp-2 text-xs text-stone-600 dark:text-stone-300">{p.short}</p>
            <p className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-700">{p.pricePlaceholder} · {p.cta} <ExternalLink className="h-3 w-3" /></p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function InlineAffiliate({ productSlug }: { productSlug: string }) {
  const p = PRODUCTS.find((x) => x.slug === productSlug);
  if (!p) return null;
  return (
    <div className="my-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
      <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Sponsored — Related Product</p>
      <p className="mt-1 font-bold">{p.name}</p>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{p.short}</p>
      <Link href={`/products/${p.slug}`} onClick={() => trackAffiliateClick(p.slug, p.merchant)} className="mt-2 inline-flex items-center gap-1 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white">Check Price →</Link>
    </div>
  );
}
