import type { Metadata } from "next";
import Link from "next/link";
import { Salad } from "lucide-react";
import { FOODS, DIET_PLANS } from "@/health/data/nutrition";
import { Breadcrumbs, TopicCard, AdSlot, DisclaimerBar, Newsletter } from "@/health/components/ui";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/health/components/earning/AffiliateProducts";
import { LatestArticles } from "@/health/components/blog/LatestArticles";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { SITE } from "@/health/lib/site";
import { AdBanner, AdInArticle, AdRectangle } from "@/health/components/monetization/AdComponents";
import { HealthProductRecommendations } from "@/health/components/monetization/HealthProductRecommendations";
import { MonetizationCTA } from "@/health/components/monetization/MonetizationCTA";

const seoTitle = "Nutrition — Indian Foods GI Protein Fibre | Premium Health";
const seoDescription = "Indian nutrition education: food profiles, nutrients, servings, cooking methods, cautions and diet plans for diabetes, heart, PCOS..";
const url = "/health/nutrition";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Nutrition — Indian Foods")}&category=${encodeURIComponent("Nutrition")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function NutritionPage() {
  const cats = Array.from(new Set(FOODS.map((f) => f.category)));
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Nutrition" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Nutrition", item: "/health/nutrition" }]}
        faqs={[
          { q: "What is balanced Indian thali?", a: "Half veg, quarter millet grain, quarter dal/protein + curd — salad first, protein second, grain last lowers sugar spikes. See /thali-builder." },
          { q: "Which millet low GI?", a: "Foxtail GI 50.8, little millet 52, barnyard 50, kodo 65 — vs white rice 73. Start 50:50. See /millet-swap + /nutrition-tracker." },
        ]}
        howTo={{ name: "How to use nutrition guide", steps: ["Search food: e.g., roti, dal, millet, curd", "View GI, protein, fibre, FSSAI tips + healthier swap", "Build thali via /thali-builder + track via /nutrition-tracker", "Save plan in premium, get weekly PDF"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-orange-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Nutrition</p>
        <h1 className="font-display mt-1 text-3xl font-black md:text-4xl">Nutrition Portal — Indian Foods GI Protein Fibre</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Protein, fibre, millets, pulses, fermented foods and smart Indian cooking — every food shows nutrients, portions and who needs caution.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {cats.map((c) => <span key={c} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{c}</span>)}
        </div>
      </div>

      <div className="mt-4"><AdBanner placement="homepage_top" page="/health/nutrition" /></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-display mt-2 text-2xl font-bold">Food guides — {FOODS.length} foods</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FOODS.map((f) => (
              <TopicCard key={f.slug} href={`/health/nutrition/${f.slug}`} title={f.name} hindi={f.hindiName} desc={f.short} icon={<Salad className="h-5 w-5" />} badge={<span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800 dark:bg-amber-900 dark:text-amber-200">{f.category}</span>} />
            ))}
          </div>

          <div className="mt-6"><AdInArticle placement="article_middle" page="/health/nutrition" /></div>

          <h2 className="font-display mt-10 text-2xl font-bold">Diet plans — templates + Premium Guides</h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">General templates — not personalised prescriptions. <Link href="/health/diet" className="font-bold text-emerald-700 underline">Open diet centre →</Link> + <Link href="/health/thali-builder" className="font-bold text-emerald-700 underline">thali builder →</Link> + <Link href="/health/store" className="font-bold text-amber-600 underline">Premium store →</Link></p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DIET_PLANS.slice(0, 4).map((d) => (
              <Link key={d.slug} href="/health/diet" className="card-3d rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">{d.audience}</p>
                <h3 className="mt-1 font-bold">{d.title}</h3>
                <p className="mt-1 line-clamp-2 text-[13px] text-stone-600 dark:text-stone-300">{d.short}</p>
              </Link>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <HealthProductRecommendations category="Nutrition" limit={4} page="/health/nutrition" title="Nutrition Products — Educational" />
            <MonetizationCTA pageType="nutrition" page="/health/nutrition" />
            <AffiliateProducts limit={4} title="Nutrition — Millet + Protein — Affiliate" />
            <AdRectangle placement="article_bottom" page="/health/nutrition" />
            <LatestArticles limit={4} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <AdBanner placement="products_sidebar" page="/health/nutrition" />
          <Newsletter compact />
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Nutrition footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
