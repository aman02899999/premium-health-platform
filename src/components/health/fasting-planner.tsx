"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";

type Fast = {
  id: string;
  name: string;
  when: string;
  allowed: string[];
  avoid: string[];
  safeTip: string;
};

const FASTS: Fast[] = [
  { id: "ekadashi", name: "Ekadashi (twice monthly)", when: "11th lunar day, 2x/month", allowed: ["Fruits, milk, nuts", "Samak rice (barnyard millet), sabudana (if tolerated)", "Water, coconut water"], avoid: ["Grains (wheat, rice) traditionally", "Beans, onion-garlic (traditional)", "Excess salt, fried"], safeTip: "If diabetic, on meds, pregnant, elderly — do NOT fast without clinician. If fasting, monitor sugar, stay hydrated, avoid hypoglycemia." },
  { id: "navratri", name: "Navratri (9 days)", when: "Sharad / Chaitra", allowed: ["Samak, kuttu (buckwheat), singhara", "Fruits, curd, paneer, nuts", "Rock salt (sendha) in moderation"], avoid: ["Wheat, rice, regular salt (traditional)", "Alcohol, non-veg (traditional)", "Deep fried daily"], safeTip: "Rotate millets (samak best low GI), add protein (paneer, curd, peanuts), avoid only fried aloo. Check BP if low salt + diuretics." },
  { id: "if", name: "Intermittent fasting 14:10", when: "Daily, Indian adapted", allowed: ["Early dinner 7 PM, breakfast 9 AM", "Water, black tea/coffee (no sugar) in fast", "Balanced thali in eating window"], avoid: ["Late night heavy", "Skipping protein", "Overeating after fast"], safeTip: "Not for type 1 diabetes, eating disorders, pregnancy, underweight. For type 2 — clinician approval, monitor meds." },
];

export function FastingPlanner() {
  const [selected, setSelected] = useState<Fast>(FASTS[0]);

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Moon className="h-4 w-4 text-violet-600" /> Fasting Planner — Ekadashi / Navratri / IF — Unique India</h3>
      <p className="mt-1 text-[11px] text-stone-500">Traditional Indian fasting + modern safety — educational. Fasting not for all — diabetes, kidney, heart, pregnancy need clinician.</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {FASTS.map((f) => (
          <button key={f.id} onClick={() => setSelected(f)} className={`rounded-full px-3 py-1 text-xs font-bold ${selected.id === f.id ? "bg-violet-700 text-white" : "bg-stone-100 text-stone-600 dark:bg-stone-800"}`}>{f.name}</button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-gradient-to-br from-violet-50 to-amber-50 p-4 dark:from-stone-800 dark:to-stone-800">
        <p className="text-sm font-bold">{selected.name} — {selected.when}</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div><p className="text-xs font-bold">Allowed (traditional + healthier)</p><ul className="mt-1 list-disc pl-4 text-[12px]">{selected.allowed.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
          <div><p className="text-xs font-bold">Avoid / Limit</p><ul className="mt-1 list-disc pl-4 text-[12px]">{selected.avoid.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
        </div>
        <div className="mt-3 rounded-xl bg-white p-3 dark:bg-stone-900">
          <p className="flex items-center gap-1 text-xs font-bold"><Sun className="h-3 w-3 text-amber-500" /> Safety</p>
          <p className="mt-1 text-[12px]">{selected.safeTip}</p>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-stone-400">Disclaimer: Traditional fasting practices — evidence mixed. If on insulin, sulfonylureas, BP meds, blood thinners, or have kidney/heart disease — discuss with clinician before fasting.</p>
    </div>
  );
}
