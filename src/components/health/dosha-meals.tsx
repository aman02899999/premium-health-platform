"use client";

import { useState } from "react";
import { Leaf } from "lucide-react";

type Dosha = "vata" | "pitta" | "kapha";

const DOSHA_MEALS: Record<Dosha, { traits: string; foods: string[]; avoid: string[]; thali: string[] }> = {
  vata: {
    traits: "Dry, light, cold, irregular appetite — needs warm, unctuous, grounding",
    foods: ["Warm moong dal khichdi with ghee", "Ragi + jowar roti with sesame", "Steamed veggies: carrot, beet, spinach", "Warm milk with ashwagandha (if tolerated)", "Dates, soaked almonds, ghee"],
    avoid: ["Cold raw salads in excess", "Dry crackers, excess fasting", "Too much caffeine, cold drinks"],
    thali: ["Ragi roti + ghee", "Moong dal", "Carrot-beet sabzi", "Curd (room temp)", "Warm water with ginger"],
  },
  pitta: {
    traits: "Hot, sharp, intense digestion — needs cooling, sweet, bitter",
    foods: ["Barley, white rice (old), wheat", "Moong dal, green leafy (not too spicy)", "Cucumber, gourd, coconut", "Buttermilk, ghee in moderation", "Sweet fruits: melon, grapes, pear"],
    avoid: ["Excess chilli, fried, sour, alcohol", "Very hot, spicy, fermented", "Midday sun exertion"],
    thali: ["White rice / barley", "Moong dal", "Lauki sabzi", "Cucumber raita", "Coconut water"],
  },
  kapha: {
    traits: "Heavy, slow, oily — needs light, warm, pungent, active",
    foods: ["Barnyard / foxtail millet (light)", "Moong dal, horse gram", "Bitter gourd, methi, mustard greens", "Honey (small), ginger tea", "Warm soups, sprouts"],
    avoid: ["Heavy dairy, sweets, fried, cold", "Excess rice, curd at night", "Sedentary after meals"],
    thali: ["Foxtail millet", "Horse gram dal", "Bitter gourd sabzi", "Ginger tea", "Sprouts"],
  },
};

export function DoshaMeals() {
  const [dosha, setDosha] = useState<Dosha>("vata");

  const data = DOSHA_MEALS[dosha];

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Leaf className="h-4 w-4 text-emerald-600" /> Dosha-Based Meals — Unique Ayurveda + Modern Nutrition</h3>
      <p className="mt-1 text-[11px] text-stone-500">Traditional dosha framework + modern fibre/protein/GI logic — educational, not prescription. Consult Ayurveda practitioner + dietitian for medical conditions.</p>

      <div className="mt-3 flex gap-2">
        {(["vata", "pitta", "kapha"] as Dosha[]).map((d) => (
          <button key={d} onClick={() => setDosha(d)} className={`rounded-full px-4 py-1.5 text-xs font-bold capitalize ${dosha === d ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-600 dark:bg-stone-800"}`}>{d}</button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50 p-4 dark:from-stone-800 dark:to-stone-800">
        <p className="text-sm font-bold capitalize">{dosha} — {data.traits}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div><p className="text-xs font-bold">Wholesome</p><ul className="mt-1 list-disc pl-4 text-[12px]">{data.foods.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
          <div><p className="text-xs font-bold">Avoid / Limit</p><ul className="mt-1 list-disc pl-4 text-[12px]">{data.avoid.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
          <div><p className="text-xs font-bold">Sample thali</p><ul className="mt-1 list-disc pl-4 text-[12px]">{data.thali.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-stone-400">Evidence: Dosha = traditional, not biomarker. We map to modern: vata → need warm, regular meals, healthy fats; pitta → cooling, less chilli; kapha → light, fibre, activity. For diabetes, kidney, heart — clinician advice overrides.</p>
    </div>
  );
}
