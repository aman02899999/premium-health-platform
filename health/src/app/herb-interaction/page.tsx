import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { HerbDrugChecker } from "@/components/health/herb-drug-checker";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Herb-Drug Interaction Checker — Ayurveda Safety | BHG";
const seoDescription = "Check Ayurvedic herb + allopathy drug interactions: ashwagandha, giloy, guggulu + warfarin, metformin — safety checker. Unique India, premium + affiliate.";
const url = "/herb-interaction";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Herb-Drug Interaction Checker")}&category=${encodeURIComponent("Herb Safety")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function HerbInteractionPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Herb-Drug Checker" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Herb Safety", item: "/herb-interaction" }]}
        faqs={[
          { q: "Can ashwagandha interact with medicines?", a: "Ashwagandha may potentiate sedatives, thyroid meds, immunosuppressants — check interaction checker. Always tell doctor about herbs, educational only." },
          { q: "Is giloy safe with diabetes medicines?", a: "Giloy may lower blood sugar, may interact with metformin/insulin — risk hypoglycemia. Monitor sugar, consult doctor. Checker gives educational alert." },
        ]}
        howTo={{ name: "How to check herb-drug interaction", steps: ["Select Ayurvedic herb: ashwagandha, giloy, shatavari, guggulu etc", "Select allopathy medicine: metformin, warfarin, thyroxine etc", "View interaction level + mechanism + references", "Save check in premium, consult doctor — not prescription"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-800 to-teal-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">Unique India — Earning Platform — SEO Pro</p>
        <h1 className="font-display mt-1 text-3xl font-black">Herb-Drug Interaction Checker — Ayurveda + Allopathy Safety</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">Check Ayurvedic herb + allopathy drug interactions: ashwagandha, giloy, guggulu + warfarin, metformin — safety. Educational, not prescription. SEO HowTo+FAQ+OG+Premium.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <HerbDrugChecker />
          <AffiliateProducts limit={4} title="Ayurveda Safety Books — Affiliate" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Herb Safety is Unique India</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>India-relevant combos: Ayurveda herbs + allopathy — FSSAI + ICMR safety</li>
              <li>Earning: affiliate + premium + lead gen — pro platform</li>
              <li>SEO: FAQ + HowTo 4 steps + Breadcrumb JSON-LD + OG /api/og</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Herb interaction footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
