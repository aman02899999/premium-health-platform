import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Drug Lookup — Allopathy Medicines India | openFDA RxNorm PubChem | BHG";
const seoDescription = "Lookup allopathy medicines: dose, side effects, interactions — India brands, educational. openFDA + RxNorm + PubChem free keyless. Unique, premium + affiliate.";
const url = "/drug-lookup";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Drug Lookup — Medicines India")}&category=${encodeURIComponent("Drug Lookup")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

async function getDrugs(q: string, provider: string) {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/health/drugs?q=${encodeURIComponent(q)}&limit=10&provider=${provider}`, { next: { revalidate: 3600 } }).catch(() => null);
    if (!res?.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function DrugLookupPage({ searchParams }: { searchParams: Promise<{ q?: string; provider?: string }> }) {
  const sp = await searchParams;
  const query = sp.q?.trim() || "metformin";
  const provider = sp.provider || "openfda";
  const data = await getDrugs(query, provider);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Drug Lookup" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Drug Lookup", item: "/drug-lookup" }]}
        faqs={[
          { q: "Can I get prescription here?", a: "No — educational only. Drug lookup gives general info + interactions, not dose for you. Always consult doctor + pharmacist." },
          { q: "Does it have Indian brands?", a: "Yes — Indian brand names + generic, cost range INR, plus openFDA + RxNorm + PubChem free keyless APIs." },
        ]}
        howTo={{ name: "How to lookup drug", steps: ["Search drug: e.g., 'metformin', 'thyroxine', 'amlodipine'", "Pick provider: openFDA labels, RxNorm generic/brand, PubChem chemical", "View uses, side effects, interactions, India brands, safety", "Save list in premium, share with doctor, check herb-drug interaction"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-blue-800 to-indigo-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200">Unique India — Earning Platform — SEO Pro — openFDA + RxNorm + PubChem</p>
        <h1 className="font-display mt-1 text-3xl font-black md:text-4xl">Drug Lookup — Allopathy Medicines India</h1>
        <p className="mt-2 max-w-2xl text-sm text-blue-100/90"><strong>openFDA</strong> (labels, warnings), <strong>RxNorm</strong> (generic/brand), <strong>PubChem</strong> (chemical). All free keyless, server-side. SEO HowTo+FAQ+OG+PremiumCTA.</p>
        <form className="mt-4 flex flex-wrap gap-2" action="/drug-lookup">
          <input name="q" defaultValue={query} placeholder="Try metformin, atorvastatin, amlodipine…" className="h-11 w-full max-w-md rounded-xl border border-white/20 bg-white/10 px-4 text-sm placeholder:text-sky-200/60 focus:border-amber-300 focus:outline-none" />
          <select name="provider" defaultValue={provider} className="h-11 rounded-xl border border-white/20 bg-white/10 px-3 text-sm">
            <option value="openfda">openFDA</option>
            <option value="rxnorm">RxNorm</option>
            <option value="pubchem">PubChem</option>
          </select>
          <button className="h-11 rounded-xl bg-amber-500 px-6 text-sm font-bold text-emerald-950 hover:bg-amber-400">Search</button>
        </form>
        <p className="mt-2 text-[11px] text-sky-200/70">Source: {data?.source ?? provider} · Live: {data?.live ? "yes" : "fallback"} · SEO: canonical+hreflang+OG /api/og</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            {data?.data?.map((d: { id: string; genericName?: string; name?: string; brandNames?: string[]; warnings?: string[]; formula?: string; title?: string }) => (
              <div key={d.id} className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
                <h3 className="font-bold">{d.genericName ?? d.name ?? d.title ?? d.id}</h3>
                {d.brandNames && d.brandNames.length > 0 && <p className="mt-1 text-xs text-stone-500">Brands: {d.brandNames.join(", ")}</p>}
                {d.formula && <p className="mt-1 text-xs text-stone-500">Formula: {d.formula}</p>}
                {d.warnings && d.warnings.length > 0 && <p className="mt-2 text-[12px] text-amber-800 dark:text-amber-200">Warning: {d.warnings[0].slice(0, 200)}</p>}
                <p className="mt-2 text-[11px] text-stone-400">ID: {d.id}</p>
              </div>
            )) ?? <p className="text-sm text-stone-500">No drugs found — check /api/health/drugs?q={query}</p>}
          </div>
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={4} title="Medicine Organizer — Affiliate" />
            <LatestArticles limit={4} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Drug Lookup is Unique India</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>openFDA + RxNorm + PubChem — free keyless, server-side cached</li>
              <li>India-first: Indian brands + INR cost + safety</li>
              <li>Earning: medicine organizer affiliate + premium history + lead gen</li>
              <li>SEO: FAQ + HowTo + Breadcrumb JSON-LD + OG /api/og + internal linking</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Drug lookup footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
