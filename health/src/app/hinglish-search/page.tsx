import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { HinglishSearch } from "@/components/health/hinglish-search";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Hinglish Health Search — Hindi + English Mix | BHG";
const seoDescription = "Search health in Hinglish: 'madhumeh ke lakshan' — understands Hindi + English mix. Unique India, SEO + premium earning.";
const url = "/hinglish-search";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Hinglish Search — Health India")}&category=${encodeURIComponent("Hinglish Search")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Hinglish Search" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Hinglish Search", item: "/hinglish-search" }]}
        faqs={[{"q":"What is Hinglish health search?","a":"Search in mix Hindi+English: 'diabetes ke liye best atta', 'thyroid me kya khana chahiye' — engine maps to English medical + Indian foods."},{"q":"Does it support Hindi?","a":"Yes — Hindi, Hinglish, English. Example: 'madhumeh', 'motapa', 'thyroid', 'PCOS diet' — all understood."}]}
        howTo={{ name: "How to search in Hinglish", steps: ["Type in Hinglish: e.g., 'sugar kam karne ke liye kya khaye'","View results: diseases, herbs, thali, millet swap — India context","Click to read full page + related articles","Save search in premium, get Hinglish weekly tips"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-fuchsia-800 to-indigo-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-fuchsia-200">Unique India — Earning Platform — SEO Pro</p>
        <h1 className="font-display mt-1 text-3xl font-black">Hinglish Health Search — Hindi + English Mix — Unique India</h1>
        <p className="mt-2 max-w-2xl text-sm text-fuchsia-100/90">Search health in Hinglish: 'madhumeh ke lakshan' — understands Hindi + English mix. Unique India. SEO HowTo+FAQ+OG+PremiumCTA+LatestArticles.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <HinglishSearch />
          <AffiliateProducts limit={4} title="Hindi Health Books — Affiliate" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Hinglish Search is Unique India</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>India-first: Hinglish Search with Indian context, INR, FSSAI, ICMR</li>
              <li>Earning: affiliate + premium + lead gen + ad — pro platform</li>
              <li>SEO: FAQ (2) + HowTo 4 steps + Breadcrumb JSON-LD + OG /api/og + internal linking</li>
              <li>Digital marketing: UTM capture, gtag events, newsletter, exit-intent, sticky CTA</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Hinglish footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
