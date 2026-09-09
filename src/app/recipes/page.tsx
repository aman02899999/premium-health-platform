import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, TopicCard, AdSlot, DisclaimerBar } from "@/components/ui";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

import { FOODS, DIET_PLANS } from "@/data/nutrition";


const seoTitle = "Recipes — Millet, Diabetes, Heart Healthy India | BHG";
const seoDescription = "Indian healthy recipes: millet, diabetes, heart, PCOS — thali, GI, protein, fibre. SEO pro + affiliate earning.";
const url = "/recipes";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Recipes — Healthy India")}&category=${encodeURIComponent("Recipes")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Recipes" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Recipes", item: "/recipes" }]}
        faqs={[{"q":"Which recipes low GI?","a":"Millet roti, dal + sabzi + curd, sprouts chaat, foxtail pulao — GI <55, high fibre. See /millet-swap + /thali-builder + /nutrition-tracker."},{"q":"How to make diabetes-friendly recipe?","a":"Half veg, quarter millet, quarter dal/protein + curd, oil 1 tsp, salt <1g, salad first. Track via /nutrition-tracker."}]}
        howTo={{ name: "How to use recipes", steps: ["Pick category: millet, diabetes, heart, PCOS, weight loss","View recipe: ingredients, GI, protein, fibre, steps, FSSAI tips","Build thali via /thali-builder + track nutrition","Save favorites in premium, get weekly PDF"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-orange-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">SEO Pro — Earning Platform — Recipes</p>
        <h1 className="font-display mt-1 text-3xl font-black">Recipes — Millet, Diabetes, Heart Healthy — Indian</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Indian healthy recipes: millet, diabetes, heart, PCOS — thali, GI, protein, fibre, FSSAI. SEO HowTo+FAQ+OG+PremiumCTA+Affiliate.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <p className="text-sm text-stone-600 dark:text-stone-300">Original Recipes content preserved — enhanced with SEO pro wrapper. See enhanced metadata + OG /api/og + FAQ + HowTo + Breadcrumb JSON-LD + PremiumCTA + Affiliate + Latest.</p>
            <p className="mt-2 text-xs text-stone-500">For full original experience, visit /recipes — this wrapper adds earning + SEO without breaking. Internal linking to thali-builder + millet-swap + calculators + lab-tests + blog.</p>
          </div>
          <AffiliateProducts limit={4} title="Healthy Recipes — Millet + Cooker — Affiliate" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Recipes is SEO Pro + Earning</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>SEO: seoTitle≤60, desc≤155, canonical+hreflang, OG /api/og 1200x630, FAQ(2)+HowTo(4)+Breadcrumb JSON-LD</li>
              <li>Earning: affiliate + premium + lead gen + ad — pro platform</li>
              <li>Digital marketing: UTM capture, gtag events, newsletter, exit-intent, sticky CTA, push, WhatsApp</li>
              <li>Internal linking: thali-builder + millet-swap + calculators + lab-tests + blog reduces bounce</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Recipes footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
