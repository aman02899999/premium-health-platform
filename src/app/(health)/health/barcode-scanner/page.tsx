import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/health/components/ui";
import { BarcodeScanner } from "@/health/components/health/barcode-scanner";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/health/components/earning/AffiliateProducts";
import { LatestArticles } from "@/health/components/blog/LatestArticles";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { SITE } from "@/health/lib/site";

const seoTitle = "Barcode Scanner — Food Label Analyzer India";
const seoDescription = "Type a barcode number to check calories, sugar, fat, protein, Nutri-Score and processing level of packaged foods sold in India.";
const url = "/health/barcode-scanner";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Barcode Scanner — Food Label")}&category=${encodeURIComponent("Food Safety")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Food Safety" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Food Safety", item: "/health/barcode-scanner" }]}
        faqs={[{"q":"How to check if packaged food is healthy?","a":"Type the barcode number to see calories, sugar, fat, protein, Nutri-Score and processing level per 100 g. Then read the pack: compare per 100 g, and check whether sugar or maida is in the first three ingredients."},{"q":"What is FSSAI label reading trick?","a":"Compare per 100 g, not per serving, because servings can be tiny. Ingredients are listed from most to least, so sugar or maida in the first three means a lot of it."}]}
        howTo={{ name: "How to analyze food label", steps: ["Find the number under the barcode on the pack","Type it and tap Lookup","Compare calories, sugar, fat and protein per 100 g","Check the Nutri-Score (A best, E worst) and NOVA group (4 = ultra-processed)"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-800 to-amber-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">India-first</p>
        <h1 className="font-display mt-1 text-3xl font-black">Barcode Scanner: Check a Packaged Food</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Type the barcode number from any packaged food to see its calories, sugar, fat and protein, plus how processed it is.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <BarcodeScanner />
          <AffiliateProducts limit={4} title="Healthy pantry (affiliate links)" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Barcode footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
