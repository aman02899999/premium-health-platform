import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/health/components/ui";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { SITE } from "@/health/lib/site";
import { AFFILIATE_PRODUCTS } from "@/health/lib/monetization/config";
import { AffiliateProductCard } from "@/health/components/monetization/ProductCards";
import { AdBanner } from "@/health/components/monetization/AdComponents";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import { LatestArticles } from "@/health/components/blog/LatestArticles";

const seoTitle = "Affiliate Products — Modular Engine | Bharat Health Guide";
const seoDescription = "Central affiliate product engine: diabetes, BP, heart, weight, yoga, nutrition — modular config, tracking impressions/clicks/CTR, disclosure, no fabricated ratings.";
const url = "/health/affiliate-products";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Affiliate Products Engine")}&category=${encodeURIComponent("Monetization")}&type=Product`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  // Internal setup page — and empty until real affiliate links are added.
  robots: { index: false, follow: true },
};

export default function AffiliateProductsPage() {
  const categories = Array.from(new Set(AFFILIATE_PRODUCTS.map((p) => p.category)));
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Affiliate Products" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Affiliate Products", item: "/health/affiliate-products" }]}
        faqs={[
          { q: "Why do you recommend products?", a: "We list a few health products our readers often ask about. Some links are affiliate links: if you buy, the shop may pay us a small commission at no extra cost to you." },
          { q: "Do commissions affect your advice?", a: "No. We never invent ratings or reviews, and a product's commission has no effect on our health advice." },
        ]}
        howTo={{ name: "How to buy a recommended product", steps: ["Read the product summary and check it suits you", "Tap the button to open the seller's page", "Check the latest price, reviews and return policy on the seller's site", "Buy directly from the seller"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-900 to-amber-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Affiliate Product Engine — Tracking + Disclosure</p>
        <h1 className="font-display mt-1 text-3xl font-black">Affiliate Products — Central Config Engine — {AFFILIATE_PRODUCTS.length} Products</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">Modular affiliate engine — not hardcoded. Categories: Diabetes, BP, Heart, Weight, Fitness, Nutrition, Ayurveda, Yoga, Women&apos;s, Men&apos;s, Senior, Devices, Books, Healthy Foods, Supplements, Wellness. Tracking: impressions, clicks, CTR, destination, product ID, page source. Disclosure on every card.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{categories.map((c) => <span key={c} className="rounded-full bg-white/15 px-3 py-1 text-xs">{c}</span>)}</div>
      </div>
      <div className="mt-4"><AdBanner placement="products_sidebar" page="/health/affiliate-products" /></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
          {AFFILIATE_PRODUCTS.filter((p) => p.active).map((p) => <AffiliateProductCard key={p.id} product={p} page="/health/affiliate-products" />)}
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <LatestArticles limit={4} />
        </div>
      </div>
      <div className="mt-8 space-y-4"><AdSlot slot="Affiliate footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
