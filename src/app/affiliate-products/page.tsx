import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";
import { AFFILIATE_PRODUCTS } from "@/lib/monetization/config";
import { AffiliateProductCard } from "@/components/monetization/ProductCards";
import { AdBanner } from "@/components/monetization/AdComponents";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { LatestArticles } from "@/components/blog/LatestArticles";

const seoTitle = "Affiliate Products — Modular Engine | BHG";
const seoDescription = "Central affiliate product engine: diabetes, BP, heart, weight, yoga, nutrition — modular config, tracking impressions/clicks/CTR, disclosure, no fabricated ratings.";
const url = "/affiliate-products";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Affiliate Products Engine")}&category=${encodeURIComponent("Monetization")}&type=Product`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
};

export default function AffiliateProductsPage() {
  const categories = Array.from(new Set(AFFILIATE_PRODUCTS.map((p) => p.category)));
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Affiliate Products" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Affiliate Products", item: "/affiliate-products" }]}
        faqs={[
          { q: "How affiliate system works?", a: "Central config AFFILIATE_PRODUCTS in src/lib/monetization/config.ts — id, title, description, category, image, price, originalPrice, currency, affiliateUrl, merchant, rating (only if legit), disclosure, active, featured, priority, CTA, trackingId. Track impressions, clicks, CTR, destination, product ID, page source via /api/monetization/analytics + gtag + localStorage. No personal health info stored." },
          { q: "How to create affiliate product?", a: "Add entry to AFFILIATE_PRODUCTS with id, slug, title, description, category (Diabetes, BP, Heart, Weight, Fitness, Nutrition, Ayurveda, Yoga, Women's, Men's, Senior, Devices, Books, Healthy Foods, Supplements, Wellness), image, price, merchant, affiliateUrl, disclosure, active, featured, priority, ctaText, trackingId. Set active true. Test /api/monetization/products?category=Diabetes." },
        ]}
        howTo={{ name: "How to create affiliate product", steps: ["Add to AFFILIATE_PRODUCTS config with all required fields — never fabricate ratings/reviews", "Set affiliateUrl (real merchant URL) + disclosure 'Affiliate link — we may earn commission'", "Set category, tags, priority for contextual recommendations", "Test impression + click tracking via /api/monetization/analytics + gtag"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-900 to-amber-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Affiliate Product Engine — Modular — Tracking + Disclosure</p>
        <h1 className="font-display mt-1 text-3xl font-black">Affiliate Products — Central Config Engine — {AFFILIATE_PRODUCTS.length} Products</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">Modular affiliate engine — not hardcoded. Categories: Diabetes, BP, Heart, Weight, Fitness, Nutrition, Ayurveda, Yoga, Women's, Men's, Senior, Devices, Books, Healthy Foods, Supplements, Wellness. Tracking: impressions, clicks, CTR, destination, product ID, page source. Disclosure on every card.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{categories.map((c) => <span key={c} className="rounded-full bg-white/15 px-3 py-1 text-xs">{c}</span>)}</div>
      </div>
      <div className="mt-4"><AdBanner placement="products_sidebar" page="/affiliate-products" /></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
          {AFFILIATE_PRODUCTS.filter((p) => p.active).map((p) => <AffiliateProductCard key={p.id} product={p} page="/affiliate-products" />)}
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <LatestArticles limit={4} />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Setup Instructions — Affiliate</h3>
            <ol className="mt-2 list-decimal pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>Create merchant account (Amazon, etc.) — get affiliate ID</li>
              <li>Set NEXT_PUBLIC_AFFILIATE_DEFAULT_MERCHANT in .env</li>
              <li>Update AFFILIATE_PRODUCTS affiliateUrl with real URL + trackingId + utm</li>
              <li>Enable click tracking: /api/affiliate/click + /api/monetization/analytics + gtag affiliate_product_click</li>
              <li>Test: click product → check localStorage bhg-aff-clicks + /api/monetization/analytics?type=affiliate_product_click</li>
              <li>Add disclosure to footer + /affiliate-disclosure</li>
            </ol>
          </div>
        </div>
      </div>
      <div className="mt-8 space-y-4"><AdSlot slot="Affiliate footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
