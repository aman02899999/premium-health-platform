import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { DoshaMeals } from "@/components/health/dosha-meals";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Dosha Meals — Ayurveda Vata Pitta Kapha | Premium Health";
const seoDescription = "Get meals by dosha: Vata, Pitta, Kapha — Ayurveda + nutrition India.";
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
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Unique India</p>
        <h1 className="font-display mt-1 text-3xl font-black">Dosha Meals — Ayurveda Vata Pitta Kapha — Personalized</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Get meals by dosha: Vata, Pitta, Kapha — Ayurveda + nutrition India.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <DoshaMeals />
          <AffiliateProducts limit={4} title="Ayurveda Spices Kit — Affiliate" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Dosha meals footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
