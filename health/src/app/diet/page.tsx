import type { Metadata } from "next";
import { DIET_PLANS } from "@/data/nutrition";
import { Breadcrumbs, AdSlot, SafetyNote, DisclaimerBar } from "@/components/ui";
import { CheckCircle2 } from "lucide-react";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Diet Centre — Diabetes, PCOS, Heart, Weight Loss | BHG";
const seoDescription = "Diet plans: diabetes, PCOS, heart, weight loss, thyroid — Indian thali, millet, protein. Templates, not prescriptions. SEO pro + earning + FAQ+HowTo.";
const url = "/diet";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Diet — Plans India")}&category=${encodeURIComponent("Diet")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function DietPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Diet & Meal Plans" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Diet", item: "/diet" }]}
        faqs={[
          { q: "What is diabetes diet?", a: "Half veg, quarter millet, quarter dal/protein + curd, salad first, protein second, grain last, oil 3-4 tsp, salt <5g, 10 min post-meal walk. See /thali-builder + /millet-swap." },
          { q: "How to lose weight Indian diet?", a: "Calorie deficit 300-500, protein 1.2-1.6g/kg, fibre 30g, strength 3x/week, 8k steps, sleep 8h. Track via /nutrition-tracker + /health-calculators protein calc." },
        ]}
        howTo={{ name: "How to use diet centre", steps: ["Pick diet: diabetes, PCOS, heart, weight loss, thyroid", "View thali template + millet swap + GI + protein + fibre + principles", "Build personalized thali via /thali-builder + track nutrition", "Save plan in premium, get weekly PDF + WhatsApp tips + affiliate"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-800 to-teal-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">SEO Pro — Earning Platform — Diet Centre — ItemList + FAQ+HowTo+OG</p>
        <h1 className="font-display mt-1 text-3xl font-black md:text-4xl">Diet & Meal Plans — Indian Templates — Diabetes, Heart, PCOS & More — Pro SEO</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">Practical Indian templates with breakfast, lunch, dinner, snacks, beverages, shopping lists and portions. General education — personalise with dietitian if you have diabetes, kidney, heart disease or are pregnant. SEO HowTo+FAQ+OG+PremiumCTA+Affiliate.</p>
      </div>
      <div className="mt-4"><SafetyNote text="Generalised meal plans are not personalised medical prescriptions. If you take insulin, sulfonylureas, blood thinners or have kidney disease, get the plan personalised before following it strictly." /></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-5 lg:grid-cols-2">
            {DIET_PLANS.map((d) => (
              <article key={d.slug} id={d.slug} className="scroll-mt-28 rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">{d.audience}</p>
                <h2 className="font-display mt-1 text-2xl font-bold">{d.title}</h2>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{d.short}</p>
                <div className="mt-3 rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/40">
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">Principles</p>
                  <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
                    {d.principles.map((p) => <li key={p} className="flex gap-1.5 text-xs text-stone-700 dark:text-stone-200"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />{p}</li>)}
                  </ul>
                </div>
                <div className="mt-3 grid gap-3 text-[13px] sm:grid-cols-2">
                  {[["Breakfast", d.breakfast], ["Lunch", d.lunch], ["Dinner", d.dinner], ["Snacks", d.snacks]].map(([t, items]) => (
                    <div key={t as string} className="rounded-2xl border border-stone-100 p-3 dark:border-stone-800">
                      <p className="text-xs font-bold">{t as string}</p>
                      <ul className="mt-1 space-y-1 text-stone-600 dark:text-stone-300">{(items as string[]).map((i) => <li key={i}>• {i}</li>)}</ul>
                    </div>
                  ))}
                </div>
                <details className="mt-3 rounded-2xl bg-stone-50 p-3 text-[13px] dark:bg-stone-800/60">
                  <summary className="cursor-pointer font-bold">Shopping list + portions + beverages + cautions</summary>
                  <p className="mt-2"><strong>Shop:</strong> {d.shoppingList.join(" · ")}</p>
                  <p className="mt-1"><strong>Portions:</strong> {d.portionGuidance.join(" · ")}</p>
                  <p className="mt-1"><strong>Beverages:</strong> {d.beverages.join(" · ")}</p>
                  <p className="mt-1 text-amber-700 dark:text-amber-300"><strong>Caution:</strong> {d.cautions.join(" ")}</p>
                </details>
              </article>
            ))}
          </div>
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={4} title="Diet Plans — Affiliate + Premium" />
            <LatestArticles limit={4} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Diet Centre is SEO Pro + Earning</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>{DIET_PLANS.length} diet plans: diabetes, PCOS, heart, weight loss, thyroid — principles + breakfast + lunch + dinner + snacks + shopping + portions</li>
              <li>Earning: dietitian consults Rs250/lead via /api/lead + affiliate millet + protein + premium thali PDFs</li>
              <li>SEO: FAQ + HowTo + Breadcrumb + OG /api/og + ItemList JSON-LD + internal linking thali-builder/millet-swap/nutrition-tracker</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Diet footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
