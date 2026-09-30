import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { SITE } from "@/lib/site";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";

const seoTitle = "Affiliate Disclosure — How BHG Earns | BHG";
const seoDescription = "How affiliate links work on Bharat Health Guide: clearly labelled, Product JSON-LD, 8% avg commission, never influencing evidence ratings or editorial content. SEO pro + E-E-A-T.";
const url = "/affiliate-disclosure";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Affiliate Disclosure — BHG")}&category=${encodeURIComponent("Affiliate")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function AffiliatePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Affiliate Disclosure" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Affiliate Disclosure", item: "/affiliate-disclosure" }]}
        faqs={[
          { q: "How does affiliate earning work?", a: "When you buy via our link, merchant pays 8% avg commission — e.g., glucometer Rs1999 * 8% = Rs160. No extra cost to you. Tracked via gtag affiliate_click + UTM + /api/affiliate/click + localStorage bhg-aff-clicks + Product JSON-LD." },
          { q: "Does affiliate influence editorial?", a: "No — evidence badges, safety warnings, limitations written before monetisation. Negative findings never hidden to protect sale. Disclosure on every page + /affiliate-disclosure + /deals + /products." },
        ]}
        howTo={{ name: "How affiliate disclosure works", steps: ["Product pages show merchant, price placeholder, rating placeholder, CTA View Product/Check Price/Learn More", "Links resolve via configurable affiliate URLs in DB — never hardcoded", "Click tracked via UTM + gtag + /api/affiliate/click POST productId", "Buy on merchant, commission supports independent health journalism"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-emerald-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">SEO Pro — E-E-A-T — Trust — Affiliate Disclosure — Earning Platform — Product JSON-LD</p>
        <h1 className="font-display mt-1 text-3xl font-black">Affiliate Disclosure — How BHG Earns — Transparent</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Clearly labelled, Product JSON-LD, 8% avg commission, never influencing evidence ratings or editorial content. SEO FAQ+HowTo+OG+canonical+hreflang+internal linking.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 text-[14px] leading-relaxed text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
            <p><strong>Disclosure:</strong> {SITE.affiliateDisclosure}</p>
            <p><strong>How it works:</strong> Product pages show merchant, price placeholder, rating placeholder and CTA (View Product / Check Price / Learn More). Links resolve via configurable affiliate URLs stored in DB — never hardcoded in components. Tracked via gtag affiliate_click + UTM source/campaign + localStorage + /api/affiliate/click + /api/affiliate/stats.</p>
            <p><strong>Editorial independence:</strong> Evidence badges, safety warnings and limitations sections written before any monetisation. Negative findings never hidden to protect sale. See /about editorial policy.</p>
            <p><strong>Current status:</strong> All products clearly marked Demo with placeholder prices until real merchant integrations configured. 10 products: glucometer, BP monitor, mustard oil, millet combo, yoga mat, whey protein, herbs book, steamer, millet cooker, protein shaker — each Product JSON-LD.</p>
            <p><strong>Earning APIs:</strong> /api/affiliate/click POST productId + UTM, /api/affiliate/stats GET aggregated, /api/earn/stats GET total monthly, /admin/earning dashboard MRR + affiliate + ads + lead.</p>
          </div>
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={6} title="Affiliate Products — Demo — Product JSON-LD" />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Affiliate Disclosure is E-E-A-T + SEO Pro</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>E-E-A-T: About + Contact + Privacy + Terms + Disclaimer + Affiliate Disclosure — trust signals</li>
              <li>Product JSON-LD for rich results — price, rating, availability, brand</li>
              <li>SEO: FAQ + HowTo + Breadcrumb + OG /api/og + canonical+hreflang + internal linking to /deals + /products</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Affiliate disclosure footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
