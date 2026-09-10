import type { Metadata } from "next";
import SolutionsClient from "./SolutionsClient";
import { Breadcrumbs, AdSlot, DisclaimerBar, Newsletter } from "@/components/ui";
import { SITE } from "@/lib/site";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";

const seoTitle = "Solutions — Diabetes, Thyroid, PCOS, Heart | BHG";
const seoDescription = "Health solutions: diabetes, thyroid, PCOS, heart, fatty liver — diet, exercise, medicines, Ayurveda. SEO pro + ItemList + earning + FAQ+HowTo.";
const url = "/solutions";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Solutions — Health India")}&category=${encodeURIComponent("Solutions")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function SolutionsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Medical Solutions" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Solutions", item: "/solutions" }]}
        faqs={[
          { q: "What are health solutions?", a: "Curated bundles: diabetes = thali-builder + millet-swap + IDRS + HbA1c + yoga-timer + diet + blog guide — India-first solution, not just disease page." },
          { q: "Are solutions medical advice?", a: "No — educational bundles linking diseases, herbs, nutrition, calculators, tools, blog. Always consult doctor. Disclaimer on every page." },
        ]}
        howTo={{ name: "How to use solutions", steps: ["Pick condition: diabetes, thyroid, PCOS, heart, fatty liver", "View solution bundle: thali, millet, calculators, lab tests, yoga, blog, diet", "Follow steps + track via premium + WhatsApp tips", "Book consult via lead form if needed"] }}
      />
      <div className="relative mt-3 overflow-hidden rounded-3xl bg-stone-950 p-6 text-white md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300">Modern · Ayurveda · Herbs · Nutrition · Yoga · Mind — SEO Pro + Earning Platform</p>
        <h1 className="font-display mt-2 max-w-3xl text-3xl font-black leading-tight md:text-5xl">Every condition. Every responsible solution. One page. — Pro SEO</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-300 md:text-[15px]">No single system has all answers. Compare modern treatment, Ayurvedic perspective, nutrition, lifestyle and testing for 24 common Indian conditions — with evidence grades and emergency red flags on every card. SEO: FAQ+HowTo+OG+ItemList+PremiumCTA.</p>
      </div>
      <div className="mt-8"><SolutionsClient /></div>
      <div className="mt-8 space-y-6"><AdSlot slot="Solutions footer" /><Newsletter compact /><DisclaimerBar /></div>
    </div>
  );
}
