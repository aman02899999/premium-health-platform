import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { BarcodeScanner } from "@/components/health/barcode-scanner";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Barcode Scanner — Food Label Analyzer India | BHG";
const seoDescription = "Scan barcode or enter ingredients: sugar, trans-fat, sodium alerts — FSSAI India focused. Unique India, premium + affiliate earning.";
const url = "/barcode-scanner";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Barcode Scanner — Food Label")}&category=${encodeURIComponent("Food Safety")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Food Safety" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Food Safety", item: "/barcode-scanner" }]}
        faqs={[{"q":"How to check if packaged food is healthy?","a":"Enter ingredients or scan barcode: checker flags sugar aliases, trans-fat, high sodium, palm oil, maida — FSSAI label education. Prefer <5g sugar, <0.2g trans-fat per 100g."},{"q":"What is FSSAI label reading trick?","a":"Check per 100g, not per serve — serving can be small. Look for sugar in first 3 ingredients, trans-fat hydrogenated, sodium >400mg/100g high."}]}
        howTo={{ name: "How to analyze food label", steps: ["Enter barcode or paste ingredients list from pack","View sugar, trans-fat, sodium, palm oil alerts + FSSAI tips","Get healthier swap: e.g., millet cookies vs maida","Save scans in premium, build healthy pantry"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-800 to-amber-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Unique India — Earning Platform — SEO Pro</p>
        <h1 className="font-display mt-1 text-3xl font-black">Barcode Scanner — Food Label Analyzer — FSSAI India</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Scan barcode or enter ingredients: sugar, trans-fat, sodium, palm oil alerts — FSSAI India focused. Unique India. SEO HowTo+FAQ+OG+PremiumCTA.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <BarcodeScanner />
          <AffiliateProducts limit={4} title="Healthy Pantry — Millet + Jaggery — Affiliate" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Food Safety is Unique India</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>India-first: Food Safety with Indian context, INR, FSSAI, ICMR</li>
              <li>Earning: affiliate + premium + lead gen + ad — pro platform</li>
              <li>SEO: FAQ (2) + HowTo 4 steps + Breadcrumb JSON-LD + OG /api/og + internal linking</li>
              <li>Digital marketing: UTM capture, gtag events, newsletter, exit-intent, sticky CTA</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Barcode footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
