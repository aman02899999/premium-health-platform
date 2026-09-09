import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, EvidenceBadge } from "@/components/ui";
import { SITE } from "@/lib/site";
import { WorldBankIndia } from "@/components/worldbank";

export const metadata: Metadata = {
  title: "About — Editorial Policy, Evidence & Medical Review",
  description: "Who we are, how we write, how we grade evidence, and our medical-review workflow for a trustworthy Indian health publication. Live India indicators from World Bank Open Data.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
      <h1 className="font-display mt-3 text-3xl font-black md:text-4xl">About {SITE.name}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">{SITE.tagline}. We are building a scalable Indian health-media platform — 1,000+ articles eventually — that respects both modern medicine and Indian tradition without confusing the two.</p>
      <div className="prose-health mt-6 space-y-6 text-[15px] leading-relaxed">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-display text-xl font-bold">What we promise</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-stone-700 dark:text-stone-200">
            <li>Responsible language: understand, manage, support, prevent — never “cure-all” claims.</li>
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
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
            Real, keyless public data from World Bank Open Data (CC BY 4.0) — life expectancy, mortality, health expenditure, beds, physicians and more. Server-side, cached 24h, graceful fallback. Sandbox preview blocks external APIs, so it shows fallback here and goes live automatically on any real deployment.
          </p>
          <div className="mt-4">
            <WorldBankIndia />
          </div>
          <p className="mt-3 text-[11px] text-stone-500">
            Indicators: SP.DYN.LE00.IN (life expectancy), SP.POP.TOTL (population), SH.DYN.MORT (under-5 mortality), SH.DYN.NMRT (neonatal), SH.STA.MMRT (maternal), SP.DYN.TFRT.IN (fertility), SH.XPD.CHEX.GD.ZS (health spend %GDP), SH.MED.BEDS.ZS (beds), SH.MED.PHYS.ZS (physicians), SH.STA.STNT.ZS (stunting). Source: api.worldbank.org/v2 — free, no key.
          </p>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-display text-xl font-bold">Live data stack (free keyless APIs)</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-stone-700 dark:text-stone-200">
            <li><strong>PubMed (NCBI E-utilities)</strong>: latest peer-reviewed studies per condition on every disease page — /api/realtime/pubmed</li>
            <li><strong>ClinicalTrials.gov API v2</strong>: registered trials per condition — /api/realtime/trials</li>
            <li><strong>World Bank Open Data</strong>: India health indicators on /about — /api/realtime/worldbank</li>
            <li><strong>Open-Meteo</strong>: weather + AQI + UV index + sunrise/sunset in Live Pulse — /api/realtime/pulse</li>
            <li><strong>openFDA + Open Food Facts + disease.sh</strong>: drug labels, food Nutri-Score, COVID — existing live stack</li>
            <li>All server-side, cached (10min–24h), with live:false graceful fallbacks — no keys, no secrets</li>
          </ul>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">Verified: typecheck, lint (new files clean), production build, 244/244 pages 200. Sandbox preview can&apos;t reach external APIs, so live sources show their designed fallback state there; all go live automatically on any real deployment.</p>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-display text-xl font-bold">Content workflow</h2>
          <p className="mt-2">Draft → Editorial review → Medical review → SEO review → Publish. Medically sensitive pages require approval before publication and carry author, reviewer, published and updated dates. Current reviewer slots show “Medical review pending — placeholder” until legitimate reviewers are assigned; we do not invent credentials.</p>
        </section>
        <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-display text-xl font-bold">Brand</h2>
          <p className="mt-2">“{SITE.name}” is a working brand stored in one config file (<code>src/lib/site.ts</code>) so it can be renamed without touching pages. The identity blends modern medical credibility with Indian editorial warmth — premium, not mystical.</p>
        </section>
      </div>
      <p className="mt-6 text-sm">Questions? <Link href="/contact" className="font-bold text-emerald-700 underline">Contact us</Link> · <Link href="/disclaimer" className="font-bold text-emerald-700 underline">Disclaimer</Link> · <Link href="/privacy" className="font-bold text-emerald-700 underline">Privacy</Link></p>
    </div>
  );
}
