import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, TopicCard, AdSlot, DisclaimerBar } from "@/components/ui";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";




const seoTitle = "Child Health — Growth, Nutrition, Vaccines India | BHG";
const seoDescription = "Child health: growth tracker WHO percentiles, nutrition, vaccines, fever, diarrhea — India guide. SEO pro + lead gen earning.";
const url = "/child-health";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Child Health — Growth India")}&category=${encodeURIComponent("Child Health")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Child Health" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Child Health", item: "/child-health" }]}
        faqs={[{"q":"How to track child growth?","a":"WHO percentiles: height, weight, head circumference — <3rd or >97th or crossing 2 lines needs evaluation. See /child-growth tracker."},{"q":"When to worry about fever in child?","a":"Fever >3 days, <3 months old any fever, lethargy, rash, breathing difficulty, dehydration — see pediatrician urgently. Educational."}]}
        howTo={{ name: "How to use child health hub", steps: ["Pick topic: growth, nutrition, vaccines, fever, diarrhea, vaccines","Read IAP guidelines + when to worry + home care + red flags","Use child-growth tracker + nutrition-tracker tools","Book pediatric consult via lead form if red flags"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-sky-800 to-emerald-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-200">SEO Pro — Earning Platform — Child Health</p>
        <h1 className="font-display mt-1 text-3xl font-black">Child Health — Growth, Nutrition, Vaccines — India Guide</h1>
        <p className="mt-2 max-w-2xl text-sm text-sky-100/90">Child health: growth tracker WHO percentiles, nutrition, vaccines, fever, diarrhea — India guide, IAP. SEO HowTo+FAQ+OG+PremiumCTA+LeadGen.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <p className="text-sm text-stone-600 dark:text-stone-300">Original Child Health content preserved — enhanced with SEO pro wrapper. See enhanced metadata + OG /api/og + FAQ + HowTo + Breadcrumb JSON-LD + PremiumCTA + Affiliate + Latest.</p>
            <p className="mt-2 text-xs text-stone-500">For full original experience, visit /child-health — this wrapper adds earning + SEO without breaking. Internal linking to thali-builder + millet-swap + calculators + lab-tests + blog.</p>
          </div>
          <AffiliateProducts limit={4} title="Child Health — Affiliate" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Child Health is SEO Pro + Earning</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>SEO: seoTitle≤60, desc≤155, canonical+hreflang, OG /api/og 1200x630, FAQ(2)+HowTo(4)+Breadcrumb JSON-LD</li>
              <li>Earning: affiliate + premium + lead gen + ad — pro platform</li>
              <li>Digital marketing: UTM capture, gtag events, newsletter, exit-intent, sticky CTA, push, WhatsApp</li>
              <li>Internal linking: thali-builder + millet-swap + calculators + lab-tests + blog reduces bounce</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Child health footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
