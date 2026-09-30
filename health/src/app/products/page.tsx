import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { PRODUCTS } from "@/data/editorial";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Products — Glucometer, BP Monitor, Millet | BHG";
const seoDescription = "Affiliate-ready product catalogue with honest benefits, limitations and disclosures. Demo data — Product JSON-LD, SEO pro + affiliate earning.";
const url = "/products";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Products — Health India")}&category=${encodeURIComponent("Products")}&type=Product`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function ProductsPage() {
  const cats = Array.from(new Set(PRODUCTS.map((p) => p.category)));
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Products" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Products", item: "/products" }]}
        faqs={[
          { q: "How to choose glucometer?", a: "Check ISO 15197 accuracy, strip cost (real cost), app sync, lancet pain. Demo product — compare before buying. Affiliate tracked via /api/affiliate/click + gtag." },
          { q: "Are products medically reviewed?", a: "Handpicked for Indian health: glucometer, BP monitor, millet, yoga mat, protein. Educational, not prescription. Disclosure on every page + /affiliate-disclosure." },
        ]}
        howTo={{ name: "How to buy health product", steps: ["Browse by category: monitors, healthy foods, books, yoga gear", "Compare specs: accuracy, strip cost, material, protein per scoop", "Click affiliate link — tracked via UTM + gtag + /api/affiliate/click", "Buy on merchant, support independent health journalism"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-emerald-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Earning Platform — Affiliate — SEO Pro — Product JSON-LD — ItemList</p>
        <h1 className="font-display mt-1 flex items-center gap-2 text-3xl font-black md:text-4xl"><ShoppingBag className="h-7 w-7" /> Products — Health Essentials — Affiliate Earning</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Demo catalogue across monitors, healthy foods, books and yoga gear. Affiliate links configurable via DB, never hardcoded. We never make false medical claims to sell. SEO: Product JSON-LD, FAQ, HowTo, OG, internal linking.</p>
        <p className="mt-2 text-[11px] text-amber-200"><strong>Affiliate disclosure:</strong> {SITE.affiliateDisclosure} <Link href="/affiliate-disclosure" className="underline">Learn more</Link></p>
        <div className="mt-3 flex flex-wrap gap-1.5">{cats.map((c) => <span key={c} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{c}</span>)}</div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((p) => (
              <Link key={p.slug} href={`/products/${p.slug}`} className="card-3d rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{p.category} · Demo · Product JSON-LD</p>
                <h3 className="mt-1 font-bold leading-snug">{p.name}</h3>
                <p className="mt-1 line-clamp-2 text-[13px] text-stone-600 dark:text-stone-300">{p.short}</p>
                <p className="mt-2 text-xs text-stone-500">{p.ratingPlaceholder}</p>
                <p className="mt-1 text-sm font-bold text-emerald-700">{p.pricePlaceholder}</p>
                <span className="mt-2 inline-block rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white">{p.cta}</span>
              </Link>
            ))}
          </div>
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={8} title="Top Deals — Affiliate Earning Optimized — Product JSON-LD" />
            <LatestArticles limit={4} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Products is Earning Platform</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>8 demo products with Product JSON-LD — price, rating, availability, brand</li>
              <li>8% avg commission — glucometer Rs1999 → Rs160/sale — tracked via gtag + UTM + /api/affiliate/click</li>
              <li>SEO: FAQ + HowTo + Breadcrumb + OG /api/og + ItemList JSON-LD + internal linking to /deals</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Products footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
