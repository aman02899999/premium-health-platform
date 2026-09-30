import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { HealthQA } from "@/components/health/health-qa";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Health Q&A — Evidence-Based Answers India | BHG";
const seoDescription = "Ask health questions — evidence-based answers with citations: PubMed, ICMR, FSSAI. Unique India, premium + affiliate + ad earning.";
const url = "/health-qa";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Health Q&A — Evidence India")}&category=${encodeURIComponent("Health Q&A")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Health Q&A" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Health Q&A", item: "/health-qa" }]}
        faqs={[{"q":"Are answers medically reviewed?","a":"Answers use PubMed/ICMR/FSSAI citations + AI draft + placeholder review tag. Always consult doctor. Premium gets priority Q&A with citations."},{"q":"Can I ask in Hinglish?","a":"Yes — health-qa supports Hinglish + English + Hindi. Try hinglish-search for better Hinglish understanding."}]}
        howTo={{ name: "How to ask health question", steps: ["Type question in English/Hinglish/Hindi — e.g., diabetes millet","View evidence answer with PubMed/ICMR citations + disclaimer","Ask follow-up, save Q&A in premium","For personal advice, book dietitian via lead form"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-800 to-teal-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">Unique India — Earning Platform — SEO Pro</p>
        <h1 className="font-display mt-1 text-3xl font-black">Health Q&A — Evidence-Based Answers — India Focus</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">Ask health questions — evidence-based answers with citations: PubMed, ICMR, FSSAI. Unique India, premium unlimited + affiliate. SEO FAQ+HowTo+OG.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <HealthQA />
          <AffiliateProducts limit={4} title="Health Books — Affiliate" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Health Q&A is Unique India</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>India-first: Health Q&A with Indian context, INR, FSSAI, ICMR</li>
              <li>Earning: affiliate + premium + lead gen + ad — pro platform</li>
              <li>SEO: FAQ (2) + HowTo 4 steps + Breadcrumb JSON-LD + OG /api/og + internal linking</li>
              <li>Digital marketing: UTM capture, gtag events, newsletter, exit-intent, sticky CTA</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Health QA footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
