import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { DoshaMeals } from "@/components/health/dosha-meals";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Dosha Meals — Ayurveda Vata Pitta Kapha | BHG";
const seoDescription = "Get meals by dosha: Vata, Pitta, Kapha — Ayurveda + nutrition India. Unique India, premium + affiliate earning.";
const url = "/dosha-meals";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Dosha Meals — Vata Pitta Kapha")}&category=${encodeURIComponent("Ayurveda Meals")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Ayurveda Meals" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Ayurveda Meals", item: "/dosha-meals" }]}
        faqs={[{"q":"What are Vata Pitta Kapha meals?","a":"Ayurveda dosha-based meals: Vata = warm oily grounding, Pitta = cool sweet bitter, Kapha = light spicy. Educational, not dosha diagnosis."},{"q":"How to know my dosha?","a":"Quick prakriti quiz + symptoms — e.g., dry skin + anxiety Vata tendency, acidity Pitta, heaviness Kapha. Confirm with Ayurveda practitioner."}]}
        howTo={{ name: "How to get dosha meals", steps: ["Take quick dosha quiz: body, digestion, mind tendencies","Get Vata/Pitta/Kapha meal suggestions: millet, dal, veg, spices","Build thali with dosha meals + millet swap","Save plan in premium, get weekly dosha PDF"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-orange-800 to-amber-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Unique India — Earning Platform — SEO Pro</p>
        <h1 className="font-display mt-1 text-3xl font-black">Dosha Meals — Ayurveda Vata Pitta Kapha — Personalized</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Get meals by dosha: Vata, Pitta, Kapha — Ayurveda + nutrition India. Unique India, premium + affiliate. SEO HowTo+FAQ+OG+PremiumCTA.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <DoshaMeals />
          <AffiliateProducts limit={4} title="Ayurveda Spices Kit — Affiliate" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Ayurveda Meals is Unique India</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>India-first: Ayurveda Meals with Indian context, INR, FSSAI, ICMR</li>
              <li>Earning: affiliate + premium + lead gen + ad — pro platform</li>
              <li>SEO: FAQ (2) + HowTo 4 steps + Breadcrumb JSON-LD + OG /api/og + internal linking</li>
              <li>Digital marketing: UTM capture, gtag events, newsletter, exit-intent, sticky CTA</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Dosha meals footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
