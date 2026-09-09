import type { Metadata } from "next";
import { DIET_PLANS } from "@/data/nutrition";
import { Breadcrumbs, AdSlot, SafetyNote } from "@/components/ui";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Diet & Meal Plans — Indian Templates for Diabetes, Heart, PCOS & More",
  description: "Indian breakfast, lunch, dinner, snacks, shopping lists and portion guidance. General templates — not personalised prescriptions.",
};

export default function DietPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Diet & Meal Plans" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-800 to-amber-700 p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-black md:text-4xl">Diet & Meal Plans</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90">Practical Indian templates with breakfast, lunch, dinner, snacks, beverages, shopping lists and portions. General education — personalise with a dietitian if you have diabetes, kidney, heart disease or are pregnant.</p>
      </div>
      <div className="mt-4"><SafetyNote text="Generalised meal plans are not personalised medical prescriptions. If you take insulin, sulfonylureas, blood thinners or have kidney disease, get the plan personalised before following it strictly." /></div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
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
              <summary className="cursor-pointer font-bold">Shopping list + portions</summary>
              <p className="mt-2"><strong>Shop:</strong> {d.shoppingList.join(" · ")}</p>
              <p className="mt-1"><strong>Portions:</strong> {d.portionGuidance.join(" · ")}</p>
              <p className="mt-1"><strong>Beverages:</strong> {d.beverages.join(" · ")}</p>
              <p className="mt-1 text-amber-700 dark:text-amber-300"><strong>Caution:</strong> {d.cautions.join(" ")}</p>
            </details>
          </article>
        ))}
      </div>
      <div className="mt-8"><AdSlot slot="Diet footer" /></div>
    </div>
  );
}
