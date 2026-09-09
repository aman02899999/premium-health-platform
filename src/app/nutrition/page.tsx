import type { Metadata } from "next";
import Link from "next/link";
import { Salad } from "lucide-react";
import { FOODS, DIET_PLANS } from "@/data/nutrition";
import { Breadcrumbs, TopicCard, AdSlot } from "@/components/ui";

export const metadata: Metadata = {
  title: "Nutrition Portal — Indian Foods, Millets, Protein & More",
  description: "Indian nutrition education: food profiles, nutrients, servings, cooking methods, cautions and diet plans for diabetes, heart, PCOS and more.",
};

export default function NutritionPage() {
  const cats = Array.from(new Set(FOODS.map((f) => f.category)));
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Nutrition" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-emerald-800 p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-black md:text-4xl">Nutrition Portal</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90">Protein, fibre, millets, pulses, fermented foods and smart Indian cooking — every food shows nutrients, portions and who needs caution.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {cats.map((c) => <span key={c} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{c}</span>)}
        </div>
      </div>
      <h2 className="font-display mt-8 text-2xl font-bold">Food guides</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FOODS.map((f) => (
          <TopicCard key={f.slug} href={`/nutrition/${f.slug}`} title={f.name} hindi={f.hindiName} desc={f.short} icon={<Salad className="h-5 w-5" />} badge={<span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800 dark:bg-amber-900 dark:text-amber-200">{f.category}</span>} />
        ))}
      </div>
      <h2 className="font-display mt-10 text-2xl font-bold">Diet plans</h2>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">General templates — not personalised prescriptions. <Link href="/diet" className="font-bold text-emerald-700 underline">Open diet centre →</Link></p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DIET_PLANS.slice(0, 4).map((d) => (
          <Link key={d.slug} href="/diet" className="card-3d rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">{d.audience}</p>
            <h3 className="mt-1 font-bold">{d.title}</h3>
            <p className="mt-1 line-clamp-2 text-[13px] text-stone-600 dark:text-stone-300">{d.short}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8"><AdSlot slot="Directory footer" /></div>
    </div>
  );
}
