import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { FastingPlanner } from "@/components/health/fasting-planner";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Fasting Planner — Navratri Ekadashi Intermittent | BHG";
const seoDescription = "Plan fasting: Navratri, Ekadashi, intermittent 16:8 — safe, India-specific. Unique India, premium + affiliate earning.";
const url = "/fasting-planner";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Fasting Planner — Navratri Ekadashi")}&category=${encodeURIComponent("Fasting India")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Fasting India" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Fasting India", item: "/fasting-planner" }]}
        faqs={[{"q":"Is fasting safe for diabetes?","a":"Fasting may cause hypo if on insulin/sulfonylurea. Avoid if HbA1c >10, elderly, pregnant. If fasting, monitor sugar, hydrate, break if <70 or >250. Consult doctor."},{"q":"What to eat during Navratri fasting?","a":"Kuttu, singhara, sama, sabudana — but watch GI: sabudana high GI. Prefer kuttu + curd + fruits + nuts. Hydrate, avoid fried. Planner gives balanced Navratri thali."}]}
        howTo={{ name: "How to plan fasting", steps: ["Pick fast type: Navratri, Ekadashi, 16:8, weekly","Check safety: diabetes, pregnancy, elderly, meds — disclaimer","Get meal plan: what to eat, hydration, breaking fast","Save fast calendar in premium, get WhatsApp reminder"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-orange-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Unique India — Earning Platform — SEO Pro</p>
        <h1 className="font-display mt-1 text-3xl font-black">Fasting Planner — Navratri Ekadashi Intermittent — Safe</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Plan fasting: Navratri, Ekadashi, intermittent 16:8 — safe, India-specific. Who should avoid fasting, hydration, breaking fast. SEO HowTo+FAQ+OG.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <FastingPlanner />
          <AffiliateProducts limit={4} title="Fasting Foods — Kuttu Sama — Affiliate" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Fasting India is Unique India</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>India-first: Fasting India with Indian context, INR, FSSAI, ICMR</li>
              <li>Earning: affiliate + premium + lead gen + ad — pro platform</li>
              <li>SEO: FAQ (2) + HowTo 4 steps + Breadcrumb JSON-LD + OG /api/og + internal linking</li>
              <li>Digital marketing: UTM capture, gtag events, newsletter, exit-intent, sticky CTA</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Fasting footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
