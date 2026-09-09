import type { Metadata } from "next";
import Link from "next/link";
import { ChefHat, Clock } from "lucide-react";
import { FOODS } from "@/data/nutrition";
import { Breadcrumbs, AdSlot } from "@/components/ui";

export const metadata: Metadata = {
  title: "Healthy Indian Recipes — Diabetes, Heart & Weight Friendly",
  description: "Moong khichdi, millet pulao, raita, sprouts chaat and more — simple Indian recipes drawn from our food guides.",
};

export default function RecipesPage() {
  const recipes = FOODS.flatMap((f) => f.recipes.map((r) => ({ ...r, food: f.name, href: `/nutrition/${f.slug}` })));
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Recipes" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-orange-700 to-emerald-800 p-6 text-white md:p-8">
        <h1 className="font-display flex items-center gap-2 text-3xl font-black md:text-4xl"><ChefHat className="h-7 w-7" /> Healthy Indian Recipes</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90">15-minute, budget-friendly dishes from our food guides — each linked to its nutrition profile with portions and cautions.</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((r, i) => (
          <Link key={i} href={r.href} className="card-3d rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600"><Clock className="h-3 w-3" /> 15–25 min · {r.food}</p>
            <h3 className="font-display mt-1 text-lg font-bold">{r.name}</h3>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{r.desc}</p>
            <span className="mt-2 inline-block text-[13px] font-bold text-emerald-700">View food guide →</span>
          </Link>
        ))}
      </div>
      <div className="mt-8"><AdSlot slot="Recipes footer" /></div>
    </div>
  );
}
