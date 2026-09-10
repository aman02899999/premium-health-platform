import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, TopicCard, AdSlot, DisclaimerBar } from "@/components/ui";
import { getDisease } from "@/data/diseases-index";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Men's Health — Heart, Prostate, Testosterone, Fitness | BHG";
const seoDescription = "Indian men's health hub: early heart risk, belly fat, prostate, testosterone and healthy aging with practical plans. SEO pro + earning + ItemList.";
const url = "/mens-health";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Men's Health — India")}&category=${encodeURIComponent("Men's Health")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function MensPage() {
  const slugs = ["mens-heart-health", "mens-weight-management", "prostate-health", "testosterone-health", "male-pattern-hair-loss", "erectile-dysfunction", "mens-nutrition", "mens-fitness", "mens-healthy-aging"];
  const items = slugs.map(getDisease).filter(Boolean);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Men's Health" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Men's Health", item: "/mens-health" }]}
        faqs={[
          { q: "Why do Indian men get heart attacks early?", a: "Belly fat, smoking, sleep apnea, unchecked BP/sugar, low activity — Indian men face heart attacks a decade early vs Western. Heart-risk calculators + BMI + waist-height + lipid + HbA1c + BP monitoring help early." },
          { q: "When to check prostate?", a: "PSA discussion 50+ or 45+ if family history — not routine for all. See doctor if urinary frequency, nocturia, weak stream, blood. See /diseases/prostate-health." },
        ]}
        howTo={{ name: "How to use men's health hub", steps: ["Pick topic: heart, weight, prostate, testosterone, hair loss, ED, nutrition, fitness, aging", "Read symptoms, causes, tests, treatment, nutrition, India cost", "Check calculators + lab tests + blog + thali-builder + workout-builder", "Book consult via lead form if red flags"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-slate-800 to-emerald-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-200">SEO Pro — Earning Platform — Men's Health — ItemList + FAQ+HowTo+OG</p>
        <h1 className="font-display mt-1 text-3xl font-black md:text-4xl">Men's Health — Heart, Prostate, Testosterone, Weight & Fitness — India</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90">Indian men face heart attacks a decade early — belly fat, smoking, sleep apnea and unchecked BP/sugar drive it. Practical, stigma-free guides below. SEO HowTo+FAQ+OG+PremiumCTA+Affiliate.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((d) => d && <TopicCard key={d.slug} href={`/diseases/${d.slug}`} title={d.name} hindi={d.hindiName} desc={d.short} />)}
          </div>
          <p className="mt-6 text-sm">Start here: <Link href="/health-calculators" className="font-bold text-emerald-700 underline">heart-risk + BMI calculators</Link> · <Link href="/diseases/mens-heart-health" className="font-bold text-emerald-700 underline">men's heart guide</Link> · <Link href="/workout-builder" className="font-bold text-emerald-700 underline">workout builder →</Link> · <Link href="/nutrition-tracker" className="font-bold text-emerald-700 underline">nutrition tracker →</Link></p>
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={4} title="Men's Health — Affiliate" />
            <LatestArticles limit={4} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Men's Health is SEO Pro + Earning</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>9 topics: heart, weight, prostate, testosterone, hair loss, ED, nutrition, fitness, aging — India context</li>
              <li>Earning: lab tests + BP monitor + protein + workout gear affiliate + premium + lead gen</li>
              <li>SEO: FAQ + HowTo + Breadcrumb + OG /api/og + ItemList JSON-LD + internal linking calculators/lab-tests/blog</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Mens health footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
