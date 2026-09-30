import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { NutritionTracker } from "@/components/health/nutrition-tracker";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Nutrition Tracker — Indian Foods Calories | BHG";
const seoDescription = "Track Indian foods: roti, dal, sabzi — calories, protein, fibre, GI. Unique India, premium + affiliate earning.";
const url = "/nutrition-tracker";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Nutrition Tracker — Indian Foods")}&category=${encodeURIComponent("Nutrition Tracker")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Nutrition Tracker" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Nutrition Tracker", item: "/nutrition-tracker" }]}
        faqs={[{"q":"How to track roti calories?","a":"1 phulka ~70 kcal, 1 tbsp ghee ~45 kcal, dal 1 katori ~120 kcal — tracker sums + fibre + protein. Educational, not prescription."},{"q":"Does it have Indian foods?","a":"Yes — 200+ Indian foods: roti, paratha, idli, dosa, dal, sabzi, biryani, mithai — with GI, fibre, protein, FSSAI tips."}]}
        howTo={{ name: "How to track nutrition", steps: ["Add foods: e.g., 2 roti + dal + sabzi + curd","View calories, protein, fibre, GI load + balanced thali score","Get swap suggestions: millet roti, more dal, less ghee","Save day log in premium, export weekly PDF"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-green-800 to-emerald-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-green-200">Unique India — Earning Platform — SEO Pro</p>
        <h1 className="font-display mt-1 text-3xl font-black">Nutrition Tracker — Indian Foods Calories — Unique</h1>
        <p className="mt-2 max-w-2xl text-sm text-green-100/90">Track Indian foods: roti, dal, sabzi — calories, protein, fibre, GI. Unique India, premium history + PDF. SEO HowTo+FAQ+OG+PremiumCTA.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <NutritionTracker />
          <AffiliateProducts limit={4} title="Kitchen Scale + Protein — Affiliate" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Nutrition Tracker is Unique India</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>India-first: Nutrition Tracker with Indian context, INR, FSSAI, ICMR</li>
              <li>Earning: affiliate + premium + lead gen + ad — pro platform</li>
              <li>SEO: FAQ (2) + HowTo 4 steps + Breadcrumb JSON-LD + OG /api/og + internal linking</li>
              <li>Digital marketing: UTM capture, gtag events, newsletter, exit-intent, sticky CTA</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Nutrition tracker footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
