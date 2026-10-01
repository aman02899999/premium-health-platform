import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/health/components/ui";
import { RitucharyaPlanner } from "@/health/components/health/ritucharya";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/health/components/earning/AffiliateProducts";
import { LatestArticles } from "@/health/components/blog/LatestArticles";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { SITE } from "@/health/lib/site";

const seoTitle = "Ritucharya — Ayurvedic Seasonal Planner | Live Weather | Premium Health";
const seoDescription = "Ayurvedic Ritucharya + live weather pulse: diet, lifestyle per season — Vata Pitta Kapha pathya/apathya.";
const url = "/health/ritucharya";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Ritucharya — Seasonal Ayurveda")}&category=${encodeURIComponent("Ayurveda India")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Ayurveda India" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Ayurveda India", item: "/health/ritucharya" }]}
        faqs={[{"q":"What is Ritucharya in Ayurveda?","a":"Seasonal regimen — diet, lifestyle per Ritu (Shishira to Hemanta) to balance dosha. E.g., Shishira = heavy warm, Grishma = light cooling. Classical Ashtanga Hridaya, educational."},{"q":"How does live weather help Ritucharya?","a":"Open-Meteo live temp + humidity maps to current Ritu, personalizes pathya/apathya — e.g., if hot + humid, avoid Pitta aggravating foods."}]}
        howTo={{ name: "How to use Ritucharya planner", steps: ["Allow location or pick city for live weather pulse","See current Ritu + dosha tendency + pathya/apathya","Follow diet + lifestyle suggestions, track daily","Save seasonal plan in premium, get weekly PDF"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-stone-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Unique India</p>
        <h1 className="font-display mt-1 text-3xl font-black">Ritucharya — Seasonal Planner — Ayurveda + Live Weather</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Live season from Open-Meteo + classical Ayurveda pathya/apathya. Educational, not prescription.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <RitucharyaPlanner />
          <AffiliateProducts limit={4} title="Ayurveda Seasonal Kit — Affiliate" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Ritucharya footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
