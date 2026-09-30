import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AYURVEDA_TOPICS } from "@/data/editorial";
import { HERBS } from "@/data/herbs";
import { Breadcrumbs, TopicCard, InfoNote, AdSlot, EvidenceBadge, DisclaimerBar, Newsletter } from "@/components/ui";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";
import { AdBanner, AdInArticle, AdRectangle } from "@/components/monetization/AdComponents";
import { HealthProductRecommendations } from "@/components/monetization/HealthProductRecommendations";
import { MonetizationCTA } from "@/components/monetization/MonetizationCTA";

const seoTitle = "Ayurveda — Dosha, Dinacharya, Ritucharya | BHG";
const seoDescription = "Dosha, dinacharya, ritucharya, nutrition, panchakarma education and herb safety — traditional wisdom distinguished from clinical evidence. SEO pro + ItemList + monetization pro.";
const url = "/ayurveda";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Ayurveda — Dosha India")}&category=${encodeURIComponent("Ayurveda")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function AyurvedaPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Ayurveda" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Ayurveda", item: "/ayurveda" }]}
        faqs={[
          { q: "What is dosha?", a: "Vata (movement), Pitta (transformation), Kapha (structure) — traditional mind-body typology. Not modern diagnosis. Use for routine + diet variety, not to delay medical care. See dosha-meals + ritucharya planner." },
          { q: "Is Ayurveda safe?", a: "Food-level spices safe; extracts + bhasma need supervision. Check herb-drug interaction via /herb-interaction. Buy AYUSH-licensed, tested brands — loose powders risk heavy metals." },
        ]}
        howTo={{ name: "How to explore Ayurveda", steps: ["Read dosha basics, dinacharya daily routine, ritucharya seasonal", "Check pathya-apathya nutrition + panchakarma education + safety", "Use dosha-meals + ritucharya planner + herb-drug checker tools", "Consult qualified Vaidya + doctor for integration"] }}
      />
      <div className="hero-pattern mt-3 rounded-3xl border border-emerald-100 p-6 md:p-8 dark:border-stone-700">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600"><Sparkles className="h-4 w-4" /> Traditional wellness, responsibly presented — SEO Pro + Earning Platform + Monetization Pro</p>
        <h1 className="font-display mt-2 text-3xl font-black md:text-4xl">Ayurveda Portal — Dosha, Dinacharya, Ritucharya</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600 dark:text-stone-300">Ayurveda offers time-tested lifestyle wisdom — routine, seasonal eating, herbs and mind practices. We present traditional concepts clearly <em>as traditional concepts</em>, separate from modern clinical evidence, so you can integrate safely. SEO: FAQ+HowTo+OG+PremiumCTA+Affiliate + Monetization: AdBanner, HealthProductRecommendations, MonetizationCTA, Store.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[["Dosha Basics", "/ayurveda/dosha-basics"], ["Dinacharya", "/ayurveda/dinacharya-daily-routine"], ["Nutrition", "/ayurveda/ayurvedic-nutrition"], ["Panchakarma", "/ayurveda/panchakarma-education"], ["All Herbs", "/herbs"], ["Dosha Meals", "/dosha-meals"], ["Ritucharya Planner", "/ritucharya"], ["Premium Store", "/store"]].map(([l, h]) => (
            <Link key={h} href={h} className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600">{l}</Link>
          ))}
        </div>
      </div>
      <div className="mt-4"><InfoNote text="Ayurvedic formulations can interact with modern medicines and affect liver/kidney. Always coordinate a qualified Vaidya and your doctor, and buy tested, AYUSH-licensed products. Check /herb-interaction." /></div>

      <div className="mt-4"><AdBanner placement="homepage_top" page="/ayurveda" /></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-display mt-2 text-2xl font-bold">Core topics — {AYURVEDA_TOPICS.length} topics</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AYURVEDA_TOPICS.map((t) => (
              <TopicCard key={t.slug} href={`/ayurveda/${t.slug}`} title={t.title} hindi={t.category} desc={t.excerpt} icon={<Sparkles className="h-5 w-5" />} />
            ))}
          </div>

          <div className="mt-6"><AdInArticle placement="article_middle" page="/ayurveda" /></div>

          <h2 className="font-display mt-10 text-2xl font-bold">Flagship herbs — evidence graded</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HERBS.slice(0, 4).map((h) => (
              <TopicCard key={h.slug} href={`/herbs/${h.slug}`} title={h.name} hindi={h.hindiName} desc={h.short} badge={<EvidenceBadge level={h.evidenceLevel} />} />
            ))}
          </div>
          <div className="mt-6 space-y-4">
            <HealthProductRecommendations category="Ayurveda" limit={4} page="/ayurveda" title="Ayurveda Products — Educational" />
            <MonetizationCTA pageType="ayurveda" page="/ayurveda" />
            <AffiliateProducts limit={4} title="Ayurveda Books + Kit — Affiliate" />
            <AdRectangle placement="article_bottom" page="/ayurveda" />
            <LatestArticles limit={4} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <AdBanner placement="products_sidebar" page="/ayurveda" />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Ayurveda is SEO Pro + Earning Pro</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>{AYURVEDA_TOPICS.length} topics + {HERBS.length} herbs with evidence level + safety + interactions</li>
              <li>Earning: Ayurveda kit + books affiliate + premium dosha meals + ritucharya planner + store guides + product recommendations</li>
              <li>SEO: FAQ + HowTo + Breadcrumb + OG /api/og + ItemList JSON-LD + internal linking to dosha-meals/ritucharya/herb-interaction + AdBanner + MonetizationCTA</li>
            </ul>
          </div>
          <Newsletter compact />
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Ayurveda footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
