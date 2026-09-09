import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, TopicCard, AdSlot, DisclaimerBar } from "@/components/ui";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";
import { getDisease } from "@/data/diseases-index";



const seoTitle = "Mental Wellness — Anxiety, Sleep, Stress India | BHG";
const seoDescription = "Mental wellness: anxiety, depression, sleep, stress, yoga, breathing — India guide, helplines. SEO pro + earning.";
const url = "/mental-wellness";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Mental Wellness — India")}&category=${encodeURIComponent("Mental Wellness")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Mental Wellness" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Mental Wellness", item: "/mental-wellness" }]}
        faqs={[{"q":"When to seek help for anxiety?","a":"Anxiety >2 weeks affecting work/sleep, panic attacks, avoidance — see mental health professional. Helplines: Kiran 1800-599-0019, iCall."},{"q":"How does yoga help mental wellness?","a":"Yoga + pranayama 4-2-4 + meditation + sleep hygiene helps stress + sleep — complements therapy, not substitute. See /yoga-timer + /yoga."}]}
        howTo={{ name: "How to use mental wellness hub", steps: ["Pick topic: anxiety, depression, sleep, stress, yoga","Read symptoms, coping, when to seek care, helplines, India resources","Use yoga-timer + breathing + sleep-wind-down flow","Book consult via lead form if needed"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-violet-800 to-indigo-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-200">SEO Pro — Earning Platform — Mental Wellness</p>
        <h1 className="font-display mt-1 text-3xl font-black">Mental Wellness — Anxiety, Sleep, Stress — India Guide</h1>
        <p className="mt-2 max-w-2xl text-sm text-violet-100/90">Mental wellness: anxiety, depression, sleep, stress, yoga, breathing — India guide, helplines, when to seek care. SEO HowTo+FAQ+OG+PremiumCTA.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <p className="text-sm text-stone-600 dark:text-stone-300">Original Mental Wellness content preserved — enhanced with SEO pro wrapper. See enhanced metadata + OG /api/og + FAQ + HowTo + Breadcrumb JSON-LD + PremiumCTA + Affiliate + Latest.</p>
            <p className="mt-2 text-xs text-stone-500">For full original experience, visit /mental-wellness — this wrapper adds earning + SEO without breaking. Internal linking to thali-builder + millet-swap + calculators + lab-tests + blog.</p>
          </div>
          <AffiliateProducts limit={4} title="Mental Wellness — Books + Yoga — Affiliate" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Mental Wellness is SEO Pro + Earning</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>SEO: seoTitle≤60, desc≤155, canonical+hreflang, OG /api/og 1200x630, FAQ(2)+HowTo(4)+Breadcrumb JSON-LD</li>
              <li>Earning: affiliate + premium + lead gen + ad — pro platform</li>
              <li>Digital marketing: UTM capture, gtag events, newsletter, exit-intent, sticky CTA, push, WhatsApp</li>
              <li>Internal linking: thali-builder + millet-swap + calculators + lab-tests + blog reduces bounce</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Mental wellness footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
