import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Salad, CheckCircle2, ChefHat } from "lucide-react";
import { FOODS, getFood } from "@/data/nutrition";
import { getDisease } from "@/data/diseases-index";
import { Breadcrumbs, FaqAccordion, ShareButtons, AdSlot, DisclaimerBar, LikeButton, Newsletter } from "@/components/ui";
import { NutrientDonut } from "@/components/charts";
import { articleJsonLd, faqJsonLd } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { AdBanner, AdInArticle, AdRectangle } from "@/components/monetization/AdComponents";
import { HealthProductRecommendations } from "@/components/monetization/HealthProductRecommendations";
import { MonetizationCTA } from "@/components/monetization/MonetizationCTA";
import { DIGITAL_PRODUCTS } from "@/lib/monetization/config";

export function generateStaticParams() { return FOODS.map((f) => ({ slug: f.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const f = getFood(slug);
  if (!f) return { title: "Food not found" };
  return { title: `${f.name} — Nutrients, Benefits, Servings & Recipes`, description: f.short, alternates: { canonical: `/nutrition/${slug}` } };
}

// The valid slug set is fixed and known at build time — anything else must 404.
// Without this, unknown slugs are rendered on demand, and because the root
// loading.tsx streams the response shell with a 200 before notFound() throws,
// they were served as soft 404s (HTTP 200 with "not found" content).
export const dynamicParams = false;

export default async function FoodPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const f = getFood(slug);
  if (!f) notFound();
  const related = f.relatedDiseases.map(getDisease).filter(Boolean);
  const Sec = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="mt-2 text-[15px] leading-relaxed text-stone-700 dark:text-stone-200">{children}</div>
    </section>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Nutrition", href: "/nutrition" }, { label: f.name }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ title: f.name, description: f.short, slug: `/nutrition/${slug}`, category: f.category })) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(f.faqs)) }} />

      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50 p-6 md:p-8 dark:border dark:border-stone-700 dark:from-stone-900 dark:to-stone-900">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-600 text-white"><Salad className="h-6 w-6" /></span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900 dark:text-amber-200">{f.category}</span>
        </div>
        <h1 className="font-display mt-3 text-3xl font-black md:text-4xl">{f.name}</h1>
        {f.hindiName && <p className="text-stone-500">{f.hindiName}</p>}
        <p className="mt-2 max-w-3xl leading-relaxed">{f.short}</p>
        <p className="mt-2 text-xs text-stone-500">Updated: {formatDate(f.updatedAt)} <LikeButton id={slug} /></p>
        <div className="mt-2"><ShareButtons title={f.name} path={`/nutrition/${slug}`} /></div>
      </div>

      <div className="mt-5 space-y-4">
        <Sec title="Nutritional profile">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b text-xs uppercase text-stone-500"><th className="py-2 pr-3">Nutrient</th><th className="py-2 pr-3">Amount</th><th className="py-2">Note</th></tr></thead>
              <tbody>{f.nutrients.map((n) => <tr key={n.nutrient} className="border-b last:border-0 dark:border-stone-800"><td className="py-2 pr-3 font-medium">{n.nutrient}</td><td className="py-2 pr-3">{n.amount}</td><td className="py-2 text-stone-500">{n.note || "—"}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="mt-4"><NutrientDonut title={`${f.name}: why it fits Indian plates (illustrative)`} source="BHG editorial; precise values in table above" data={[{ name: "Fibre + protein value", value: 55 }, { name: "Micronutrients", value: 30 }, { name: "Energy density", value: 15 }]} /></div>
        </Sec>
        <div className="grid gap-4 sm:grid-cols-2">
          <Sec title="Potential benefits"><ul className="space-y-1.5">{f.benefits.map((b, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />{b}</li>)}</ul></Sec>
          <Sec title="Limitations"><ul className="space-y-1.5">{f.limitations.map((b, i) => <li key={i} className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />{b}</li>)}</ul></Sec>
        </div>
        <Sec title="Serving, cooking & caution">
          <p className="rounded-2xl bg-emerald-50 p-3 text-sm dark:bg-emerald-950/40"><strong>Serving:</strong> {f.serving}</p>
          <p className="mb-1 mt-3 text-sm font-bold">Indian cooking methods</p>
          <ul className="space-y-1">{f.cookingMethods.map((c, i) => <li key={i} className="text-sm">• {c}</li>)}</ul>
          <p className="mb-1 mt-3 text-sm font-bold">Who may need caution</p>
          <ul className="space-y-1">{f.caution.map((c, i) => <li key={i} className="text-sm">• {c}</li>)}</ul>
        </Sec>

        {/* Monetization: Middle — Ad + Premium Guide */}
        <AdInArticle placement="article_middle" page={`/nutrition/${slug}`} />
        <div className="rounded-3xl border border-amber-200 bg-white p-5 dark:border-amber-800 dark:bg-stone-900">
          <h3 className="font-bold">Premium Nutrition Guide — Educational Resource</h3>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">Free: nutrients, benefits, limitations, serving, cooking, caution. Premium: detailed meal plans, thali templates, 7-day checklist, food swaps, questions for dietitian — educational, not prescription.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {DIGITAL_PRODUCTS.filter((p) => p.category === "Diet Plans" || p.category === "Health Guides" || p.tags?.some((t) => t.toLowerCase().includes("nutrition"))).slice(0, 2).map((p) => (
              <div key={p.id} className="rounded-xl border border-stone-200 p-3 dark:border-stone-700">
                <p className="text-[11px] font-bold uppercase text-emerald-600">{p.category} · {p.pages} pages</p>
                <p className="mt-1 text-sm font-bold">{p.title}</p>
                <Link href={`/store/${p.slug}`} className="mt-2 inline-block rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white">{p.ctaText}</Link>
              </div>
            ))}
          </div>
        </div>

        <HealthProductRecommendations category="Nutrition" tags={[f.category.toLowerCase(), f.slug]} limit={4} page={`/nutrition/${slug}`} title={`Products for ${f.name} — Educational`} />
        <MonetizationCTA pageType="nutrition" page={`/nutrition/${slug}`} />
        <AdSlot slot="In-content" />
        <Sec title="Recipes">
          <div className="grid gap-2 sm:grid-cols-2">
            {f.recipes.map((r) => (
              <div key={r.name} className="rounded-2xl bg-stone-50 p-4 dark:bg-stone-800/60">
                <p className="flex items-center gap-1.5 font-bold"><ChefHat className="h-4 w-4 text-amber-600" />{r.name}</p>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{r.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-sm"><Link href="/recipes" className="font-bold text-emerald-700 underline">All recipes →</Link></p>
        </Sec>
        <Sec title="FAQs"><FaqAccordion faqs={f.faqs} /></Sec>
        <Sec title="References">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-stone-600 dark:text-stone-300">{f.references.map((r, i) => <li key={i}>{r.title} — <em>{r.source}</em></li>)}</ol>
        </Sec>
        {related.length > 0 && (
          <section className="rounded-3xl border border-stone-200 bg-emerald-50/50 p-5 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-display text-xl font-bold">Related diseases</h2>
            <div className="mt-2 flex flex-wrap gap-2">{related.map((d) => d && <Link key={d.slug} href={`/diseases/${d.slug}`} className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold shadow-sm hover:bg-emerald-100 dark:bg-stone-800\">{d.name}</Link>)}</div>
          </section>
        )}
        <AdRectangle placement="article_bottom" page={`/nutrition/${slug}`} />
        <AdBanner placement="products_sidebar" page={`/nutrition/${slug}`} />
        <Newsletter compact />
        <DisclaimerBar />
      </div>
    </div>
  );
}
