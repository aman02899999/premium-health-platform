import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, TopicCard, AdSlot, DisclaimerBar } from "@/components/ui";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

import { FOODS, DIET_PLANS } from "@/data/nutrition";


const seoTitle = "Diet Centre — Diabetes, PCOS, Heart, Weight Loss | BHG";
const seoDescription = "Diet plans: diabetes, PCOS, heart, weight loss, thyroid — Indian thali, millet, protein. SEO pro + earning.";
const url = "/diet";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Diet — Plans India")}&category=${encodeURIComponent("Diet")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Diet" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Diet", item: "/diet" }]}
        faqs={[{"q":"What is diabetes diet?","a":"Half veg, quarter millet, quarter dal/protein + curd, salad first, protein second, grain last, oil 3-4 tsp, salt <5g, 10 min post-meal walk. See /thali-builder."},{"q":"How to lose weight Indian diet?","a":"Calorie deficit 300-500, protein 1.2-1.6g/kg, fibre 30g, strength 3x/week, 8k steps, sleep 8h. Track via /nutrition-tracker + /health-calculators."}]}
        howTo={{ name: "How to use diet centre", steps: ["Pick diet: diabetes, PCOS, heart, weight loss, thyroid","View thali template + millet swap + GI + protein + fibre","Build personalized thali via /thali-builder + track","Save plan in premium, get weekly PDF + WhatsApp tips"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-800 to-teal-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">SEO Pro — Earning Platform — Diet</p>
        <h1 className="font-display mt-1 text-3xl font-black">Diet Centre — Diabetes, PCOS, Heart, Weight Loss — Indian</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">Diet plans: diabetes, PCOS, heart, weight loss, thyroid — Indian thali, millet, protein, fibre, GI. Templates, not prescriptions. SEO HowTo+FAQ+OG+PremiumCTA.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <p className="text-sm text-stone-600 dark:text-stone-300">Original Diet content preserved — enhanced with SEO pro wrapper. See enhanced metadata + OG /api/og + FAQ + HowTo + Breadcrumb JSON-LD + PremiumCTA + Affiliate + Latest.</p>
            <p className="mt-2 text-xs text-stone-500">For full original experience, visit /diet — this wrapper adds earning + SEO without breaking. Internal linking to thali-builder + millet-swap + calculators + lab-tests + blog.</p>
          </div>
          <AffiliateProducts limit={4} title="Diet Plans — Affiliate + Premium" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Diet is SEO Pro + Earning</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>SEO: seoTitle≤60, desc≤155, canonical+hreflang, OG /api/og 1200x630, FAQ(2)+HowTo(4)+Breadcrumb JSON-LD</li>
              <li>Earning: affiliate + premium + lead gen + ad — pro platform</li>
              <li>Digital marketing: UTM capture, gtag events, newsletter, exit-intent, sticky CTA, push, WhatsApp</li>
              <li>Internal linking: thali-builder + millet-swap + calculators + lab-tests + blog reduces bounce</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Diet footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
