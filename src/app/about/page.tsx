import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, EvidenceBadge, AdSlot, DisclaimerBar } from "@/components/ui";
import { SITE } from "@/lib/site";
import { WorldBankIndia } from "@/components/worldbank";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";

const seoTitle = "About — Editorial Policy, Evidence & Medical Review | BHG";
const seoDescription = "Who we are, how we write, how we grade evidence, and our medical-review workflow for trustworthy Indian health publication. Live World Bank India indicators, SEO pro.";
const url = "/about";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("About — BHG Editorial Policy")}&category=${encodeURIComponent("About")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "About", item: "/about" }]}
        faqs={[
          { q: "Who writes BHG articles?", a: "BHG Editorial Team — evidence-reviewed health writers + medical review pending placeholder — E-E-A-T optimized, citations PubMed/ICMR/FSSAI, author + reviewer + published/updated dates." },
          { q: "How is evidence graded?", a: "Strong, moderate, limited, mixed, insufficient — EvidenceBadge component. Every intervention labelled by evidence strength, safety, interactions, responsible language." },
        ]}
        howTo={{ name: "How BHG creates content", steps: ["Draft with PubMed/ICMR/FSSAI citations + Indian context", "Editorial review for clarity + responsible language", "Medical review for safety + interactions + red flags", "SEO review: title≤60, desc≤155, FAQ+HowTo+Breadcrumb JSON-LD, OG /api/og"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-800 to-emerald-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">SEO Pro — E-E-A-T — About — Trust & Earning Platform</p>
        <h1 className="font-display mt-1 text-3xl font-black md:text-4xl">About {SITE.name} — Editorial Policy, Evidence & Review</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-100/90">{SITE.tagline}. We are building scalable Indian health-media platform — 1000+ articles eventually — that respects both modern medicine and Indian tradition without confusing the two. SEO HowTo+FAQ+OG+PremiumCTA.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="prose-health mt-2 space-y-6 text-[15px] leading-relaxed">
            <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
              <h2 className="font-display text-xl font-bold">What we promise — E-E-A-T</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-stone-700 dark:text-stone-200">
                <li>Responsible language: understand, manage, support, prevent — never cure-all claims.</li>
                <li>Clear separation of modern medicine, Ayurveda, homeopathy, herbs, nutrition and lifestyle.</li>
                <li>Every intervention labelled by evidence strength, with safety and interactions.</li>
                <li>No personalised doses, no stop-change advice, no fear marketing, no fake doctors or testimonials.</li>
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["strong", "moderate", "limited", "mixed", "insufficient"] as const).map((l) => <EvidenceBadge key={l} level={l} />)}
              </div>
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
              <h2 className="font-display text-xl font-bold">Live India health indicators — World Bank Open Data</h2>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">Real, keyless public data from World Bank Open Data (CC BY 4.0) — life expectancy, mortality, health expenditure, beds, physicians and more. Server-side, cached 24h, graceful fallback.</p>
              <div className="mt-4"><WorldBankIndia /></div>
              <p className="mt-3 text-[11px] text-stone-500">Indicators: SP.DYN.LE00.IN (life expectancy), SP.POP.TOTL (population), SH.DYN.MORT (under-5 mortality), SH.DYN.NMRT (neonatal), SH.STA.MMRT (maternal), SP.DYN.TFRT.IN (fertility), SH.XPD.CHEX.GD.ZS (health spend %GDP), SH.MED.BEDS.ZS (beds), SH.MED.PHYS.ZS (physicians), SH.STA.STNT.ZS (stunting). Source: api.worldbank.org/v2 — free, no key.</p>
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
              <h2 className="font-display text-xl font-bold">Live data stack (free keyless APIs) — SEO + Earning</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-stone-700 dark:text-stone-200">
                <li><strong>PubMed (NCBI E-utilities)</strong>: latest peer-reviewed studies per condition — /api/realtime/pubmed</li>
                <li><strong>ClinicalTrials.gov API v2</strong>: registered trials per condition — /api/realtime/trials</li>
                <li><strong>World Bank Open Data</strong>: India health indicators on /about — /api/realtime/worldbank</li>
                <li><strong>Open-Meteo</strong>: weather + AQI + UV + sunrise/sunset in Live Pulse — /api/realtime/pulse</li>
                <li><strong>openFDA + Open Food Facts + disease.sh</strong>: drug labels, food Nutri-Score, COVID — existing live stack</li>
                <li>All server-side, cached (10min–24h), with live:false graceful fallbacks — no keys, no secrets</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
              <h2 className="font-display text-xl font-bold">Content workflow — E-E-A-T SEO</h2>
              <p className="mt-2">Draft → Editorial review → Medical review → SEO review → Publish. Medically sensitive pages require approval before publication and carry author, reviewer, published and updated dates. Current reviewer slots show Medical review pending — placeholder until legitimate reviewers are assigned; we do not invent credentials.</p>
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
              <h2 className="font-display text-xl font-bold">Earning Platform — How we sustain</h2>
              <ul className="mt-2 list-disc pl-5 text-sm">
                <li>Premium ₹199/mo MRR — ad-free + unlimited unique India features</li>
                <li>Affiliate 8% avg — glucometer, BP monitor, millet, yoga mat, protein — Product JSON-LD + gtag + UTM</li>
                <li>AdSense optimized slots — premium ad-free, free monetized, no CLS</li>
                <li>Lead gen — lab tests, dietitian, insurance — high-ticket India</li>
                <li>Digital products — thali PDFs, fasting calendars — zero marginal cost</li>
              </ul>
            </section>
          </div>
          <p className="mt-6 text-sm">Questions? <Link href="/contact" className="font-bold text-emerald-700 underline">Contact us</Link> · <Link href="/disclaimer" className="font-bold text-emerald-700 underline">Disclaimer</Link> · <Link href="/privacy" className="font-bold text-emerald-700 underline">Privacy</Link> · <Link href="/earn" className="font-bold text-emerald-700 underline">Earning →</Link></p>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <AffiliateProducts limit={3} />
          <LatestArticles limit={4} />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why About is SEO Pro + E-E-A-T</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>E-E-A-T: author + reviewer + citations PubMed/ICMR/FSSAI + editorial policy + contact + about</li>
              <li>SEO: FAQ + HowTo + Breadcrumb + OG /api/og + canonical+hreflang + internal linking</li>
              <li>Trust signals: World Bank live data + evidence badges + workflow + brand config</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="About footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
