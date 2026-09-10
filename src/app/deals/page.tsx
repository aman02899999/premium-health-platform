import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Deals — Health Products Affiliate Earning | BHG";
const seoDescription = "Best deals on glucometer, BP monitor, millets, yoga mat, protein — affiliate earning optimized, Product JSON-LD, SEO + UTM + gtag tracked.";
const url = "/deals";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Deals — Health Products")}&category=${encodeURIComponent("Affiliate Earning")}&type=Product`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function DealsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Deals" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Deals", item: "/deals" }]}
        faqs={[
          { q: "How does affiliate earning work?", a: "When you buy via our link, merchant pays 8% avg commission — e.g., glucometer Rs1999 * 8% = Rs160. No extra cost to you. Tracked via gtag affiliate_click + UTM + /api/affiliate/click." },
          { q: "Are deals medically reviewed?", a: "Products are handpicked for Indian health: glucometer, BP monitor, millet combo, yoga mat, protein. Educational, not prescription. Disclosure on every page + affiliate-disclosure." },
        ]}
        howTo={{ name: "How to get best health deals", steps: ["Browse deals by category: diabetes, BP, millet, yoga, protein", "Click affiliate link — tracked via UTM + gtag + /api/affiliate/click", "Buy on merchant site — 8% avg commission supports independent health journalism", "Save favorites in premium, get price drop alerts"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-emerald-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Earning Platform — Affiliate — SEO Pro — Product JSON-LD</p>
        <h1 className="font-display mt-1 text-3xl font-black">Deals — Health Products — Affiliate Earning Optimized</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Handpicked health products — glucometer, BP monitor, millet combo, yoga mat, protein — affiliate links tracked via gtag + UTM + /api/affiliate/click. SEO: Product JSON-LD, FAQ, HowTo, OG /api/og, internal linking.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <AffiliateProducts limit={8} title="Top Deals — Affiliate Earning Optimized — Product JSON-LD" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Deals is Earning Platform</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>8% avg commission — glucometer Rs1999 → Rs160/sale — tracked via gtag + UTM + /api/affiliate/click</li>
              <li>Product JSON-LD for rich results — price, rating, availability</li>
              <li>SEO: FAQ (affiliate how it works, medically reviewed) + HowTo 4 steps + Breadcrumb + OG</li>
              <li>Digital marketing: UTM capture, exit-intent, sticky CTA, newsletter lead magnet</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Deals footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
