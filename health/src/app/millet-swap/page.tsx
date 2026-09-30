import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { MilletSwapEngine } from "@/components/health/millet-swap";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Millet Swap Engine — Replace White Rice with Low-GI Millets | BHG";
const seoDescription = "Swap white rice/wheat with Indian millets: foxtail GI 50.8, little millet GI 52, barnyard GI 50 — lower GI, more fibre, diabetic-friendly. Unique India tool, premium + affiliate earning.";
const url = "/millet-swap";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Millet Swap — Low-GI India")}&category=${encodeURIComponent("Nutrition India")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: {
    title: seoTitle,
    description: seoDescription,
    url: absoluteUrl,
    type: "website",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "Millet Swap Engine — Low-GI Millets India" }],
  },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function MilletSwapPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Millet Swap" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Millet Swap", item: "/millet-swap" }]}
        faqs={[
          { q: "Which millet is best for diabetes?", a: "Little millet GI 52, foxtail millet GI 50.8, barnyard millet GI 50, kodo millet GI 65 — all lower than white rice GI 73. Start 50:50 mix, watch portion, pair with dal + veg for balanced GI." },
          { q: "How to start millet without digestion issues?", a: "Start 50:50 white rice + millet for 1 week, soak 6h, rinse well, cook soft. Gradually increase to 100% millet. Drink water, add curd/buttermilk. Consult dietitian if IBS." },
        ]}
        howTo={{ name: "How to swap rice with millets", steps: ["Enter your usual rice/wheat portion in MilletSwapEngine", "Pick millet: foxtail for roti, little/barnyard for rice, kodo for pulao", "Start 50:50 for 1 week to adapt gut, soak 6h", "Track GI load, fibre, protein — save plan in premium"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-orange-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Unique India — Earning Platform</p>
        <h1 className="font-display mt-1 text-3xl font-black">Millet Swap Engine — Replace White Rice with Low-GI Millets</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Replace high-GI white rice (GI 70-80) with low-GI millets (42-55). Foxtail, little, barnyard, kodo — diabetic-friendly, fibre-rich, India’s ancient grains. SEO: HowTo + FAQ JSON-LD, OG /api/og, internal linking to thali-builder + blog.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <MilletSwapEngine />
          <AffiliateProducts limit={4} title="Millet Combo + Cooker — Affiliate Picks" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Millet Swap is Unique India</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>White rice GI 73 vs foxtail 50.8, little 52, barnyard 50 — ICMR/ICAR data</li>
              <li>Start 50:50 — avoids bloating, improves adherence</li>
              <li>Earning: affiliate millet combo ₹399 + cooker + premium thali plans</li>
              <li>SEO: FAQ (best millet for diabetes, digestion) + HowTo 4 steps + Breadcrumb JSON-LD</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Millet footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
