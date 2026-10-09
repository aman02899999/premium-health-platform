import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ShieldCheck, ShoppingBag } from "lucide-react";
import { AFFILIATE_PRODUCTS } from "@/health/lib/monetization/config";
import { AffiliateProductCard } from "@/health/components/monetization/ProductCards";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/health/components/ui";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/health/components/earning/AffiliateProducts";
import { LatestArticles } from "@/health/components/blog/LatestArticles";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { SITE } from "@/health/lib/site";

const seoTitle = "Trusted Health Products on Amazon | Premium Health";
const seoDescription = "Trusted-brand health products on Amazon India — BP monitors, glucometers, healthy foods and fitness gear — with tips to buy from genuine sellers.";
const url = "/health/products";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Products — Health India")}&category=${encodeURIComponent("Products")}&type=Product`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

const PRODUCTS = AFFILIATE_PRODUCTS.filter((p) => p.active).sort((a, b) => b.priority - a.priority);

export default function ProductsPage() {
  const cats = Array.from(new Set(PRODUCTS.map((p) => p.category)));
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Products" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Products", item: "/health/products" }]}
        faqs={[
          { q: "How to choose glucometer?", a: "Check ISO 15197 accuracy, the cost per strip (the real running cost), app sync and how painful the lancets are. Compare a few models before buying." },
          { q: "Are products medically reviewed?", a: "Handpicked for Indian health: glucometer, BP monitor, millet, yoga mat, protein. Educational, not prescription. Disclosure on every page + /affiliate-disclosure." },
        ]}
        howTo={{ name: "How to buy health product", steps: ["Browse by category: monitors, healthy foods, books, yoga gear", "Compare specs: accuracy, strip cost, material, protein per scoop", "Click affiliate link — tracked via UTM + gtag + /api/affiliate/click", "Buy on merchant, support independent health journalism"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-emerald-800 p-6 text-white md:p-8">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-100"><BadgeCheck className="h-3.5 w-3.5" /> Trusted-seller picks on Amazon</p>
        <h1 className="font-display mt-2 flex items-center gap-2 text-3xl font-black md:text-4xl"><ShoppingBag className="h-7 w-7" /> Products — Health Essentials</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Only well-known brands, linked to their own listings on Amazon India — no unbranded copies from unknown sellers. Monitors, healthy foods and fitness gear we&apos;d use ourselves. We never make medical claims to sell a product.</p>
        <p className="mt-2 text-[11px] text-amber-200"><strong>Affiliate disclosure:</strong> {SITE.affiliateDisclosure} <Link href="/health/affiliate-disclosure" className="underline">Learn more</Link></p>
        <div className="mt-3 flex flex-wrap gap-1.5">{cats.map((c) => <span key={c} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{c}</span>)}</div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {PRODUCTS.length === 0 && (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center dark:border-stone-700 dark:bg-stone-900">
              <p className="font-bold">Our product picks are being updated.</p>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">Meanwhile, browse our evidence-based guides.</p>
              <Link href="/library" className="mt-3 inline-block rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white">Premium Library →</Link>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((p) => (
              <AffiliateProductCard key={p.id} product={p} page="/health/products" />
            ))}
          </div>
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={8} title="Top Deals" />
            <LatestArticles limit={4} />
          </div>
        </div>
        <div className="space-y-4">
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
            <h2 className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200"><ShieldCheck className="h-5 w-5" /> How to be sure it&apos;s genuine</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-stone-700 dark:text-stone-300">
              <li>Under the price, &ldquo;Sold by&rdquo; should be the brand&apos;s own store, or the listing should say &ldquo;Fulfilled by Amazon&rdquo;.</li>
              <li>Tap the seller name: look for a high positive-feedback score built over many ratings.</li>
              <li>On delivery, check the seal, batch number and expiry. Supplement brands print an authenticity code — scan it.</li>
              <li>Anything wrong? Use Amazon&apos;s return window. Don&apos;t consume a product with a broken seal.</li>
            </ol>
            <p className="mt-3 text-[11px] text-stone-500">Sellers on a listing can change from day to day, so we can&apos;t guarantee who will sell to you — these checks take a minute and protect you.</p>
          </section>
          <PremiumCTA compact />
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Products footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
