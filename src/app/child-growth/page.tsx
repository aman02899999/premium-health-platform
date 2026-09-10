import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { ChildGrowthTracker } from "@/components/health/child-growth";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Child Growth Tracker — WHO India Percentiles | BHG";
const seoDescription = "Track child height, weight, head circumference vs WHO India percentiles — growth chart, alerts. Unique India, premium + lead gen.";
const url = "/child-growth";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Child Growth — WHO India")}&category=${encodeURIComponent("Child Health")}&type=tool`;

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
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Child Health", item: "/child-growth" }]}
        faqs={[{"q":"What is WHO growth percentile?","a":"WHO charts show where child stands vs peers — e.g., 50th percentile median. <3rd or >97th may need evaluation. Indian Academy of Pediatrics uses WHO for under 5."},{"q":"When to worry about child growth?","a":"Crossing 2 percentile lines down, <3rd percentile, no weight gain 2 months, short stature + fatigue — consult pediatrician. Tracker alerts, not diagnosis."}]}
        howTo={{ name: "How to track child growth", steps: ["Enter child age, sex, height, weight, head circumference","View WHO percentile + growth chart + IAP India reference","Track monthly, see trend, get alerts if crossing percentiles","Save history in premium, share PDF with pediatrician"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-sky-800 to-emerald-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-200">Unique India — Earning Platform — SEO Pro</p>
        <h1 className="font-display mt-1 text-3xl font-black">Child Growth Tracker — WHO Percentiles India</h1>
        <p className="mt-2 max-w-2xl text-sm text-sky-100/90">Track child height, weight, head circumference vs WHO India percentiles — growth chart, alerts. Educational. SEO HowTo+FAQ+OG+PremiumCTA+LeadGen.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <ChildGrowthTracker />
          <AffiliateProducts limit={4} title="Child Nutrition — Affiliate Picks" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Child Health is Unique India</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>India-first: Child Health with Indian context, INR, FSSAI, ICMR</li>
              <li>Earning: affiliate + premium + lead gen + ad — pro platform</li>
              <li>SEO: FAQ (2) + HowTo 4 steps + Breadcrumb JSON-LD + OG /api/og + internal linking</li>
              <li>Digital marketing: UTM capture, gtag events, newsletter, exit-intent, sticky CTA</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Child growth footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
