import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { IDRScalc } from "@/components/health/idrs-calc";
import { AnemiaRisk } from "@/components/health/anemia-risk";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "India Risk — IDRS Diabetes + Anemia Score | Unique India | BHG";
const seoDescription = "India-specific risk: IDRS diabetes score CURES validated + anemia screening — tea/coffee, veg, periods. Unique India tool, premium + lead gen earning.";
const url = "/india-risk";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("India Risk — IDRS Diabetes Score")}&category=${encodeURIComponent("India Risk")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "India Risk" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "India Risk", item: "/india-risk" }]}
        faqs={[{"q":"What is IDRS diabetes risk score?","a":"Indian Diabetes Risk Score — age, waist, activity, family history — validated in CURES by Mohan et al. ≥60 high risk, 30-50 moderate, <30 low. Educational screening, not diagnosis."},{"q":"How to check anemia risk in India?","a":"Tea/coffee with meals, vegetarian diet, heavy periods, pica, fatigue — screening checklist. Confirm with CBC + ferritin. Lead gen for lab test bookings Rs150-300 value."}]}
        howTo={{ name: "How to check India diabetes risk", steps: ["Enter age, waist, activity, family history in IDRS calculator","Get IDRS score: <30 low, 30-50 moderate, ≥60 high","Check anemia risk: tea/coffee timing, veg, periods, fatigue","Book lab test via lead form or consult — earning platform"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-indigo-800 to-rose-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-200">Unique India — Earning Platform — SEO Pro</p>
        <h1 className="font-display mt-1 text-3xl font-black">India Risk — IDRS + Anemia — Validated for Indians</h1>
        <p className="mt-2 max-w-2xl text-sm text-indigo-100/90">Validated for Indians: IDRS Mohan CURES + anemia screening (tea/coffee, veg, heavy periods). Educational only. SEO: HowTo + FAQ + OG /api/og + PremiumCTA + LeadGen.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
        <IDRScalc />
        <AnemiaRisk />
      </div>
          <AffiliateProducts limit={4} title="Glucometer + BP Monitor — Affiliate" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why India Risk is Unique India</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>India-first: India Risk with Indian context, INR, FSSAI, ICMR</li>
              <li>Earning: affiliate + premium + lead gen + ad — pro platform</li>
              <li>SEO: FAQ (2) + HowTo 4 steps + Breadcrumb JSON-LD + OG /api/og + internal linking</li>
              <li>Digital marketing: UTM capture, gtag events, newsletter, exit-intent, sticky CTA</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="India risk footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
