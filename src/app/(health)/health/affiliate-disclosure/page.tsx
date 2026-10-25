import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/health/components/ui";
import { SITE } from "@/health/lib/site";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/health/components/earning/AffiliateProducts";

const seoTitle = "Affiliate Disclosure — How We Earn | Bharat Health Guide";
const seoDescription = "How affiliate links work on Bharat Health Guide: clearly labelled, around 8% commission, never influencing evidence ratings or editorial content.";
const url = "/health/affiliate-disclosure";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Affiliate Disclosure — BHG")}&category=${encodeURIComponent("Affiliate")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Affiliate Disclosure" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Affiliate Disclosure", item: "/health/affiliate-disclosure" }]}
        faqs={[
          { q: "How does affiliate earning work?", a: "When you buy through one of our Amazon links, Amazon pays us a small commission — the rate depends on the product category and is set by Amazon. You pay the same price. We count clicks on these links to see which recommendations are useful; we never sell your data." },
          { q: "Does affiliate influence editorial?", a: "No — evidence badges, safety warnings, limitations written before monetisation. Negative findings never hidden to protect sale. Disclosure on every page + /affiliate-disclosure + /deals + /products." },
        ]}
        howTo={{ name: "How our affiliate links work", steps: ["Some product buttons link to a seller such as Amazon", "If you buy, the seller may pay us a small commission", "You pay the same price", "Commissions never affect our health advice"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-emerald-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Affiliate Disclosure</p>
        <h1 className="font-display mt-1 text-3xl font-black">Affiliate Disclosure — How We Earn — Transparent</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Clearly labelled, around 8% commission, never influencing evidence ratings or editorial content.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 text-[14px] leading-relaxed text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
            <p><strong>Disclosure:</strong> {SITE.affiliateDisclosure}</p>
            <p><strong>How it works:</strong> Each product shows the seller, a guide price and a button that opens the seller&apos;s own page. We count clicks on these buttons (without collecting personal details) so we know which recommendations are useful.</p>
            <p><strong>Editorial independence:</strong> Evidence badges, safety warnings and limitations sections written before any monetisation. Negative findings never hidden to protect sale. See /about editorial policy.</p>
            <p><strong>Prices:</strong> Prices shown are a guide only; always check the current price on the seller&apos;s site before you buy.</p>
          </div>
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={6} title="Products we recommend" />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Affiliate disclosure footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
