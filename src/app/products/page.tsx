import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { PRODUCTS } from "@/data/editorial";
import { Breadcrumbs, AdSlot } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Products — Monitors, Foods, Books & Yoga Gear (Demo)",
  description: "Affiliate-ready product catalogue with honest benefits, limitations and disclosures. Demo data — links configurable via database.",
};

export default function ProductsPage() {
  const cats = Array.from(new Set(PRODUCTS.map((p) => p.category)));
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Products" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-700 to-emerald-900 p-6 text-white md:p-8">
        <h1 className="font-display flex items-center gap-2 text-3xl font-black md:text-4xl"><ShoppingBag className="h-7 w-7" /> Products</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90">Demo catalogue across monitors, healthy foods, books and yoga gear. Affiliate links are configurable via the database, never hardcoded. We never make false medical claims to sell.</p>
        <p className="mt-2 text-[11px] text-amber-200"><strong>Affiliate disclosure:</strong> {SITE.affiliateDisclosure} <Link href="/affiliate-disclosure" className="underline">Learn more</Link></p>
        <div className="mt-3 flex flex-wrap gap-1.5">{cats.map((c) => <span key={c} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{c}</span>)}</div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PRODUCTS.map((p) => (
          <Link key={p.slug} href={`/products/${p.slug}`} className="card-3d rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{p.category} · Demo</p>
            <h3 className="mt-1 font-bold leading-snug">{p.name}</h3>
            <p className="mt-1 line-clamp-2 text-[13px] text-stone-600 dark:text-stone-300">{p.short}</p>
            <p className="mt-2 text-xs text-stone-500">{p.ratingPlaceholder}</p>
            <p className="mt-1 text-sm font-bold text-emerald-700">{p.pricePlaceholder}</p>
            <span className="mt-2 inline-block rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white">{p.cta}</span>
          </Link>
        ))}
      </div>
      <div className="mt-8"><AdSlot slot="Products footer" /></div>
    </div>
  );
}
