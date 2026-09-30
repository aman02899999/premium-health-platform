import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { LiveHealthAdvisory } from "@/components/health/live-advisory";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Live Health Advisory — India Weather + Air | BHG";
const seoDescription = "Live advisory: weather, AQI, UV + health tips — asthma, diabetes, elderly. Open-Meteo + India-specific. Unique, premium + affiliate.";
const url = "/live-advisory";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Live Advisory — Weather Health")}&category=${encodeURIComponent("Live Advisory")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function LiveAdvisoryPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Live Advisory" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Live Advisory", item: "/live-advisory" }]}
        faqs={[
          { q: "How does weather affect health?", a: "High AQI worsens asthma, heat raises dehydration risk in elderly/diabetes, cold increases BP. Live advisory gives personalized tips by condition." },
          { q: "What is live health advisory?", a: "Real-time weather + AQI + UV + health tips — e.g., if AQI >150, wear N95, avoid outdoor exercise; if heat >40C, ORS + light thali." },
        ]}
        howTo={{ name: "How to use live advisory", steps: ["Allow location or pick city — get live weather + AQI + UV", "Select health conditions: asthma, diabetes, elderly, child", "View personalized tips: hydration, mask, exercise timing", "Subscribe premium for WhatsApp alerts"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-slate-800 to-emerald-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">Unique India — Earning Platform — SEO Pro</p>
        <h1 className="font-display mt-1 text-3xl font-black">Live Health Advisory — Weather + AQI + Health Tips</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">Live advisory: weather, AQI, UV + health tips — asthma, diabetes, elderly. Open-Meteo + India-specific. Unique. SEO HowTo+FAQ+OG+Premium.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <LiveHealthAdvisory />
          <AffiliateProducts limit={4} title="N95 Mask + ORS — Affiliate" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Live Advisory is Unique India</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>Open-Meteo live + India public health calendar: monsoon dengue, summer heat, winter smog</li>
              <li>Earning: N95 mask + ORS affiliate + premium WhatsApp alerts</li>
              <li>SEO: FAQ + HowTo + Breadcrumb JSON-LD + OG /api/og</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Live advisory footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
