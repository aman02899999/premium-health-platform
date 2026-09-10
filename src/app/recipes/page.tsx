import type { Metadata } from "next";
import Link from "next/link";
import { ChefHat, Clock } from "lucide-react";
import { FOODS } from "@/data/nutrition";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Recipes — Millet, Diabetes, Heart Healthy India | BHG";
const seoDescription = "Healthy Indian recipes: moong khichdi, millet pulao, raita, sprouts chaat — simple, budget-friendly, diabetes, heart & weight friendly. SEO pro + earning.";
const url = "/recipes";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Recipes — Healthy India")}&category=${encodeURIComponent("Recipes")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function RecipesPage() {
  const recipes = FOODS.flatMap((f) => f.recipes.map((r) => ({ ...r, food: f.name, href: `/nutrition/${f.slug}` })));
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Recipes" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Recipes", item: "/recipes" }]}
        faqs={[
          { q: "Which recipes low GI?", a: "Millet roti, dal + sabzi + curd, sprouts chaat, foxtail pulao — GI <55, high fibre. See /millet-swap + /thali-builder + /nutrition-tracker + /diet." },
          { q: "How to make diabetes-friendly recipe?", a: "Half veg, quarter millet, quarter dal/protein + curd, oil 1 tsp, salt <1g, salad first. Track via /nutrition-tracker + /health-calculators." },
        ]}
        howTo={{ name: "How to use recipes", steps: ["Pick category: millet, diabetes, heart, PCOS, weight loss", "View recipe: ingredients, GI, protein, fibre, steps, FSSAI tips + food guide link", "Build thali via /thali-builder + track nutrition", "Save favorites in premium, get weekly PDF + WhatsApp tips"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-orange-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">SEO Pro — Earning Platform — Recipes — ItemList + FAQ+HowTo+OG</p>
        <h1 className="font-display mt-1 flex items-center gap-2 text-3xl font-black md:text-4xl"><ChefHat className="h-7 w-7" /> Healthy Indian Recipes — Diabetes, Heart & Weight Friendly — Pro SEO</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">15-minute, budget-friendly dishes from our food guides — each linked to its nutrition profile with portions and cautions. {recipes.length} recipes from {FOODS.length} foods. SEO HowTo+FAQ+OG+PremiumCTA+Affiliate.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((r, i) => (
              <Link key={i} href={r.href} className="card-3d rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600"><Clock className="h-3 w-3" /> 15–25 min · {r.food} · Recipe</p>
                <h3 className="font-display mt-1 text-lg font-bold">{r.name}</h3>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{r.desc}</p>
                <span className="mt-2 inline-block text-[13px] font-bold text-emerald-700">View food guide →</span>
              </Link>
            ))}
          </div>
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={4} title="Healthy Recipes — Millet + Cooker — Affiliate" />
            <LatestArticles limit={4} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Recipes is SEO Pro + Earning</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>{recipes.length} recipes from {FOODS.length} Indian foods — 15-25 min, budget-friendly, diabetes, heart, weight friendly</li>
              <li>Earning: millet cooker + protein shaker + whey + millet combo affiliate + premium thali PDFs</li>
              <li>SEO: FAQ + HowTo + Breadcrumb + OG /api/og + ItemList JSON-LD + internal linking nutrition + thali-builder + diet</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Recipes footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
