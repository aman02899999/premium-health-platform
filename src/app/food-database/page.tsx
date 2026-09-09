import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Food Database — Indian Foods GI Protein | Open Food Facts USDA | BHG";
const seoDescription = "Search Indian foods: GI, protein, fibre, FSSAI — roti, dal, millet + Open Food Facts barcode + USDA. Unique India, SEO + affiliate earning.";
const url = "/food-database";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Food Database — Indian Foods")}&category=${encodeURIComponent("Food Database")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

async function getFoods(q: string, provider: string) {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/health/food?q=${encodeURIComponent(q)}&limit=12&provider=${provider}`, { next: { revalidate: 3600 } }).catch(() => null);
    if (!res?.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function FoodDatabasePage({ searchParams }: { searchParams: Promise<{ q?: string; provider?: string }> }) {
  const sp = await searchParams;
  const query = sp.q?.trim() || "apple";
  const provider = sp.provider || "openfoodfacts";
  const data = await getFoods(query, provider);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Food Database" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Food Database", item: "/food-database" }]}
        faqs={[
          { q: "What is GI of Indian foods?", a: "White rice 73, brown rice 68, foxtail millet 50.8, little millet 52, dal 25-35, roti 62 — low GI <55 better for sugar. Database has 200+ foods + Open Food Facts barcode." },
          { q: "Which Indian food high protein?", a: "Soya chunks 52g/100g, paneer 18g, dal 9g cooked, sprouts 7g, egg 6g — database filters by protein, fibre, GI, veg + USDA + Open Food Facts." },
        ]}
        howTo={{ name: "How to search food database", steps: ["Search food: e.g., 'millet', 'dal', 'roti' or barcode 8901030875020", "Filter by GI low, high protein, veg, diabetic-friendly", "View GI, protein, fibre, FSSAI tips + Nutri-Score + healthier swap", "Save favorites in premium, build thali, scan barcode"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-yellow-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Unique India — Earning Platform — SEO Pro — Open Food Facts + USDA</p>
        <h1 className="font-display mt-1 text-3xl font-black md:text-4xl">Food Database — Indian Foods GI Protein — Search + Barcode</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90"><strong>Open Food Facts</strong> (ODbL, free keyless, barcode) + <strong>USDA FoodData Central</strong> (public domain) + India GI protein fibre. SEO HowTo+FAQ+OG+Premium.</p>
        <form className="mt-4 flex flex-wrap gap-2" action="/food-database">
          <input name="q" defaultValue={query} placeholder="Try apple, maggi, atta, milk…" className="h-11 w-full max-w-md rounded-xl border border-white/20 bg-white/10 px-4 text-sm placeholder:text-emerald-200/60 focus:border-amber-300 focus:outline-none" />
          <select name="provider" defaultValue={provider} className="h-11 rounded-xl border border-white/20 bg-white/10 px-3 text-sm">
            <option value="openfoodfacts">Open Food Facts</option>
            <option value="usda">USDA (requires key)</option>
          </select>
          <button className="h-11 rounded-xl bg-amber-500 px-6 text-sm font-bold text-emerald-950 hover:bg-amber-400">Search</button>
        </form>
        <p className="mt-2 text-[11px] text-amber-200/70">Source: {data?.source ?? provider} · Live: {data?.live ? "yes" : "fallback"} · Barcode: /api/health/barcode/8901030875020</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.data?.map((f: { id: string; name: string; brand?: string; barcode?: string; nutrients: { calories?: number; protein?: number; carbs?: number; fat?: number }; nutriScore?: string }) => (
              <div key={f.id} className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
                <h3 className="font-bold">{f.name}</h3>
                <p className="text-xs text-stone-500">{f.brand ?? "—"} {f.barcode ? `· ${f.barcode}` : ""} {f.nutriScore ? `· Nutri-Score ${f.nutriScore}` : ""}</p>
                <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[11px]">
                  <div className="rounded bg-stone-50 p-1 dark:bg-stone-800"><p className="font-bold">{f.nutrients.calories ?? "—"}</p><p>kcal</p></div>
                  <div className="rounded bg-stone-50 p-1 dark:bg-stone-800"><p className="font-bold">{f.nutrients.protein ?? "—"}g</p><p>protein</p></div>
                  <div className="rounded bg-stone-50 p-1 dark:bg-stone-800"><p className="font-bold">{f.nutrients.carbs ?? "—"}g</p><p>carbs</p></div>
                  <div className="rounded bg-stone-50 p-1 dark:bg-stone-800"><p className="font-bold">{f.nutrients.fat ?? "—"}g</p><p>fat</p></div>
                </div>
              </div>
            )) ?? <p className="text-sm text-stone-500">No foods found — check /api/health/food?q={query}</p>}
          </div>
          <div className="mt-8">
            <h2 className="text-sm font-bold">Barcode Lookup — Open Food Facts India</h2>
            <p className="mt-1 text-xs text-stone-500">Open Food Facts supports barcode: try 8901030875020 (Parle) or 8901058849412 — India brands</p>
            <form className="mt-2 flex gap-2" action="/api/health/barcode/8901030875020">
              <input name="code" placeholder="Enter 8-14 digit barcode" className="h-10 w-full max-w-xs rounded-xl border border-stone-200 bg-white px-3 text-sm dark:border-stone-700 dark:bg-stone-900" />
              <button className="h-10 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white">Lookup via API</button>
            </form>
            <p className="mt-2 text-[11px] text-stone-400">Frontend: /food-database · API: /api/health/barcode/:code (validates format, 24h cache) — SEO + earning</p>
          </div>
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={4} title="High Protein Foods — Affiliate" />
            <LatestArticles limit={4} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Food Database is Unique India</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>200+ Indian foods GI + protein + fibre + FSSAI + Open Food Facts barcode</li>
              <li>Earning: high protein foods affiliate + premium thali + ad</li>
              <li>SEO: FAQ + HowTo + Breadcrumb + OG /api/og + internal linking</li>
              <li>APIs: /api/health/food + /api/health/barcode/:code — free keyless</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Food DB footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
