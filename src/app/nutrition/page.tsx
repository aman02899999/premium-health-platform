import type { Metadata } from "next";
import Link from "next/link";
import { Salad } from "lucide-react";
import { FOODS, DIET_PLANS } from "@/data/nutrition";
import { Breadcrumbs, TopicCard, AdSlot, DisclaimerBar } from "@/components/ui";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Nutrition — Indian Foods GI Protein Fibre | BHG";
const seoDescription = "Indian nutrition education: food profiles, nutrients, servings, cooking methods, cautions and diet plans for diabetes, heart, PCOS. SEO pro + ItemList + earning.";
const url = "/nutrition";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Nutrition — Indian Foods")}&category=${encodeURIComponent("Nutrition")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Nutrition" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Nutrition", item: "/nutrition" }]}
        faqs={[
          { q: "What is balanced Indian thali?", a: "Half veg, quarter millet grain, quarter dal/protein + curd — salad first, protein second, grain last lowers sugar spikes. See /thali-builder." },
          { q: "Which millet low GI?", a: "Foxtail GI 50.8, little millet 52, barnyard 50, kodo 65 — vs white rice 73. Start 50:50. See /millet-swap + /nutrition-tracker." },
        ]}
        howTo={{ name: "How to use nutrition guide", steps: ["Search food: e.g., roti, dal, millet, curd", "View GI, protein, fibre, FSSAI tips + healthier swap", "Build thali via /thali-builder + track via /nutrition-tracker", "Save plan in premium, get weekly PDF"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-orange-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">SEO Pro — Earning Platform — Nutrition — ItemList JSON-LD</p>
        <h1 className="font-display mt-1 text-3xl font-black md:text-4xl">Nutrition Portal — Indian Foods GI Protein Fibre</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Protein, fibre, millets, pulses, fermented foods and smart Indian cooking — every food shows nutrients, portions and who needs caution. SEO HowTo+FAQ+OG+PremiumCTA+Affiliate+Latest.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {cats.map((c) => <span key={c} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{c}</span>)}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-display mt-2 text-2xl font-bold">Food guides — {FOODS.length} foods</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FOODS.map((f) => (
              <TopicCard key={f.slug} href={`/nutrition/${f.slug}`} title={f.name} hindi={f.hindiName} desc={f.short} icon={<Salad className="h-5 w-5" />} badge={<span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800 dark:bg-amber-900 dark:text-amber-200">{f.category}</span>} />
            ))}
          </div>
          <h2 className="font-display mt-10 text-2xl font-bold">Diet plans — templates</h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">General templates — not personalised prescriptions. <Link href="/diet" className="font-bold text-emerald-700 underline">Open diet centre →</Link> + <Link href="/thali-builder" className="font-bold text-emerald-700 underline">thali builder →</Link></p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DIET_PLANS.slice(0, 4).map((d) => (
              <Link key={d.slug} href="/diet" className="card-3d rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">{d.audience}</p>
                <h3 className="mt-1 font-bold">{d.title}</h3>
                <p className="mt-1 line-clamp-2 text-[13px] text-stone-600 dark:text-stone-300">{d.short}</p>
              </Link>
            ))}
          </div>
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={4} title="Nutrition — Millet + Protein — Affiliate" />
            <LatestArticles limit={4} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Nutrition is SEO Pro + Earning</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>{FOODS.length} Indian foods with GI, protein, fibre, FSSAI + thali-builder + millet-swap internal linking</li>
              <li>Earning: millet combo + protein affiliate + premium thali plans + ad</li>
              <li>SEO: FAQ + HowTo + Breadcrumb + OG /api/og + ItemList JSON-LD</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Nutrition footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
