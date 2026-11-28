import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/health/components/ui";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/health/components/earning/AffiliateProducts";
import { LatestArticles } from "@/health/components/blog/LatestArticles";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { SITE } from "@/health/lib/site";
import { openFoodFactsProvider } from "@/health/services/health/providers/openfoodfacts/provider";
import { BarcodeScanner } from "@/health/components/health/barcode-scanner";

const seoTitle = "Food Database — Indian Packaged Foods, Calories and Protein";
const seoDescription = "Search packaged foods sold in India by name or barcode: calories, protein, carbs, fat, Nutri-Score and processing level, from Open Food Facts.";
const url = "/health/food-database";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Food Database — Indian Foods")}&category=${encodeURIComponent("Food Database")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

async function getFoods(q: string) {
  // Call the provider directly — a server page fetching its own API by URL breaks whenever the base URL is wrong.
  try {
    return await openFoodFactsProvider.search({ query: q, limit: 12 });
  } catch {
    return null;
  }
}

export default async function FoodDatabasePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const query = sp.q?.trim() || "paneer";
  const data = await getFoods(query);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Food Database" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Food Database", item: "/health/food-database" }]}
        faqs={[
          { q: "What is GI of Indian foods?", a: "White rice 73, brown rice 68, foxtail millet 50.8, little millet 52, dal 25-35, roti 62 — low GI <55 better for sugar." },
          { q: "Which Indian food high protein?", a: "Soya chunks 52g/100g, paneer 18g, dal 9g cooked, sprouts 7g, egg 6g. Search a packaged food here to see its protein per 100 g." },
        ]}
        howTo={{ name: "How to search food database", steps: ["Type a packaged food or brand name, e.g. paneer, atta or poha", "Compare calories, protein, carbs and fat per 100 g", "Or type the barcode number from the pack to see that exact product", "Check the label on the pack too: database values can be out of date"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-yellow-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">India-first</p>
        <h1 className="font-display mt-1 text-3xl font-black md:text-4xl">Food Database: Search by Name or Barcode</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Search packaged foods sold in India by name and see calories, protein, carbs and fat per 100 g. Data from Open Food Facts.</p>
        <form className="mt-4 flex flex-wrap gap-2" action="/health/food-database">
          <label htmlFor="food-q" className="sr-only">Food name</label>
          <input id="food-q" name="q" defaultValue={query} placeholder="Try apple, maggi, atta, milk…" className="h-11 w-full max-w-md rounded-xl border border-white/20 bg-white/10 px-4 text-sm placeholder:text-emerald-200/60 focus:border-amber-300 focus:outline-none" />
          <button className="h-11 rounded-xl bg-amber-500 px-6 text-sm font-bold text-emerald-950 hover:bg-amber-400">Search</button>
        </form>
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
            ))}
            {!data?.data?.length && <p className="text-sm text-stone-500">No foods found for “{query}”. Try a different spelling or a brand name.</p>}
          </div>
          <div className="mt-8">
            <BarcodeScanner />
          </div>
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={4} title="High protein foods (affiliate links)" />
            <LatestArticles limit={4} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Food DB footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
