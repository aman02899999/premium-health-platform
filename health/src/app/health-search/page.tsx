import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Health Search — Diseases Herbs Foods | Unified India | BHG";
const seoDescription = "Search all: diseases, herbs, medicines, nutrition, yoga — India-first. One query categorized: diseases, food, exercises, Ayurveda, PubMed, trials. SEO + earning.";
const url = "/health-search";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Health Search — All India")}&category=${encodeURIComponent("Health Search")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

async function getSearch(q: string) {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/health/search?q=${encodeURIComponent(q)}&limit=5`, { next: { revalidate: 60 } }).catch(() => null);
    if (!res?.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function HealthSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const query = sp.q?.trim() || "diabetes";
  const data = await getSearch(query);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Health Search" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Health Search", item: "/health-search" }]}
        faqs={[
          { q: "What can I search?", a: "Diseases (diabetes, thyroid), herbs (ashwagandha), medicines, nutrition, lab tests, yoga, thali, millet swap — one search across 290+ pages, India-first." },
          { q: "Is search India-specific?", a: "Yes — prioritizes Indian context: millets, thali, IDRS, FSSAI, Ayurveda, Hinglish, cost in INR + free keyless APIs: PubMed, trials, openFDA, USDA." },
        ]}
        howTo={{ name: "How to search health", steps: ["Type query: e.g., 'diabetes diet', 'ashwagandha dose'", "View results across diseases, herbs, blog, tools — ranked India-first", "Click + read + related internal links reduce bounce", "Save search history in premium, get personalized tips"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-800 to-indigo-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">Unique India — Earning Platform — SEO Pro — Unified Search</p>
        <h1 className="font-display mt-1 text-3xl font-black md:text-4xl">Health Search — Diseases Herbs Foods — India-First</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">One query → categorized: diseases, medicines, food, exercises, Ayurveda, homeopathy, PubMed, trials, chemicals, ICD-10. Example: diabetes, ashwagandha, hypertension. SEO HowTo+FAQ+OG+Premium.</p>
        <form className="mt-4 flex gap-2" action="/health-search">
          <input name="q" defaultValue={query} placeholder="Try diabetes, ashwagandha, chest pain…" className="h-11 w-full max-w-md rounded-xl border border-white/20 bg-white/10 px-4 text-sm placeholder:text-indigo-200/60 focus:border-amber-300 focus:outline-none" />
          <button className="h-11 rounded-xl bg-amber-500 px-6 text-sm font-bold text-emerald-950 hover:bg-amber-400">Search</button>
        </form>
        <p className="mt-2 text-[11px] text-indigo-200/70">Sources: {data?.sources?.join(", ") ?? "—"} · Total: {data?.total ?? 0} · Cached: {data?.cache ? "yes" : "—"} · SEO canonical+hreflang+OG</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 lg:grid-cols-2">
            {data?.categories ? (
              Object.entries(data.categories).map(([cat, items]) => (
                <div key={cat} className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
                  <h3 className="text-sm font-bold capitalize">{cat} ({Array.isArray(items) ? items.length : 0})</h3>
                  <ul className="mt-2 space-y-1.5">
                    {Array.isArray(items) &&
                      items.slice(0, 5).map((it: { id?: string; name?: string; title?: string; display?: string; slug?: string }, i: number) => (
                        <li key={i} className="text-[13px] text-stone-600 dark:text-stone-300">
                          {(it as { name?: string }).name ?? (it as { title?: string }).title ?? (it as { display?: string }).display ?? (it as { slug?: string }).slug ?? JSON.stringify(it).slice(0, 80)}
                        </li>
                      ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-500">No results — try /api/health/search?q={query}</p>
            )}
          </div>
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={4} title="Health Essentials — Affiliate" />
            <LatestArticles limit={4} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Health Search is Unique India</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>One query → diseases, herbs, food, exercises, Ayurveda, PubMed, trials</li>
              <li>India-first: millets, thali, IDRS, FSSAI, Ayurveda, Hinglish, INR</li>
              <li>Earning: affiliate + premium + lead gen + ad — pro platform</li>
              <li>SEO: FAQ + HowTo + Breadcrumb + OG /api/og + internal linking reduces bounce</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Health search footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
