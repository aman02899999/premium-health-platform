import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/health/components/ui";
import { NutritionTracker } from "@/health/components/health/nutrition-tracker";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/health/components/earning/AffiliateProducts";
import { LatestArticles } from "@/health/components/blog/LatestArticles";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { SITE } from "@/health/lib/site";

const seoTitle = "Nutrition Tracker — Indian Foods Calories";
const seoDescription = "Track Indian foods: roti, dal, sabzi — calories, protein, fibre, GI.";
const url = "/health/nutrition-tracker";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Nutrition Tracker — Indian Foods")}&category=${encodeURIComponent("Nutrition Tracker")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Nutrition Tracker" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Nutrition Tracker", item: "/health/nutrition-tracker" }]}
        faqs={[{"q":"How do I track calories here?","a":"Search a packaged food by name, tap Add, and the tracker adds up today's calories, protein, carbs and fat per 100 g. Your log stays on your phone."},{"q":"Does it have home-cooked Indian foods?","a":"This tracker searches packaged foods from Open Food Facts. For roti, dal and sabzi, use the Indian food tracker on royalfitnesclub.in/nutrition, which has home-style portions."}]}
        howTo={{ name: "How to track nutrition", steps: ["Type a packaged food or brand name","Tap Add on the right product","See today's calories, protein, carbs and fat add up","Remove an item with the bin icon"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-green-800 to-emerald-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-green-200">India-first</p>
        <h1 className="font-display mt-1 text-3xl font-black">Nutrition Tracker: Today&apos;s Calories and Protein</h1>
        <p className="mt-2 max-w-2xl text-sm text-green-100/90">Search packaged foods, add what you ate, and see today&apos;s calories and protein add up.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <NutritionTracker />
          <AffiliateProducts limit={4} title="Kitchen Scale + Protein — Affiliate" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Nutrition tracker footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
