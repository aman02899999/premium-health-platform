"use client";

import { useState } from "react";
import { Wheat } from "lucide-react";

type Millet = {
  id: string;
  name: string;
  hindi: string;
  gi: string;
  protein: number;
  fibre: number;
  bestFor: string[];
  swap: string;
};

const MILLETS: Millet[] = [
  { id: "ragi", name: "Finger millet (Ragi)", hindi: "रागी", gi: "Low (55-60)", protein: 7.3, fibre: 3.5, bestFor: ["Calcium", "Diabetes", "Weight"], swap: "Replace white rice 4x/week, 50:50 start" },
  { id: "foxtail", name: "Foxtail millet (Kangni)", hindi: "कंगनी", gi: "Low (50-55)", protein: 12.3, fibre: 8, bestFor: ["Diabetes", "Cholesterol"], swap: "Best for diabetic-friendly khichdi" },
  { id: "barnyard", name: "Barnyard millet (Samak)", hindi: "सामक", gi: "Very low (42-45)", protein: 11, fibre: 10, bestFor: ["Fasting", "Diabetes", "Weight"], swap: "Fasting alternative to sago, low GI" },
  { id: "little", name: "Little millet (Kutki)", hindi: "कुटकी", gi: "Low (52)", protein: 9.7, fibre: 7.6, bestFor: ["Gut", "Diabetes"], swap: "Upma, poha replacement" },
  { id: "kodo", name: "Kodo millet (Kodra)", hindi: "कोदरा", gi: "Low", protein: 8.3, fibre: 9, bestFor: ["Weight", "Diabetes"], swap: "Pulao, biryani style" },
  { id: "bajra", name: "Pearl millet (Bajra)", hindi: "बाजरा", gi: "Medium-low", protein: 11.6, fibre: 1.2, bestFor: ["Iron", "Winter"], swap: "Winter roti, high iron" },
  { id: "jowar", name: "Sorghum (Jowar)", hindi: "ज्वार", gi: "Medium", protein: 10.4, fibre: 6, bestFor: ["Gluten-free", "Summer"], swap: "Summer roti, gluten-free" },
];

export function MilletSwapEngine() {
  const [selected, setSelected] = useState<Millet>(MILLETS[0]);
  const [currentGrain, setCurrentGrain] = useState("white rice");

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Wheat className="h-4 w-4 text-amber-600" /> Millet Swap Engine — Unique India</h3>
      <p className="mt-1 text-[11px] text-stone-500">India-specific: swap rice/wheat with millets for lower GI, more fibre. Educational, not prescription.</p>

      <div className="mt-3">
        <label className="text-xs font-bold">Your current grain</label>
        <select value={currentGrain} onChange={(e) => setCurrentGrain(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800">
          <option>white rice</option>
          <option>white wheat roti</option>
          <option>maida / bread</option>
          <option>brown rice</option>
          <option>whole wheat</option>
        </select>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {MILLETS.map((m) => (
          <button key={m.id} onClick={() => setSelected(m)} className={`rounded-2xl border p-3 text-left ${selected.id === m.id ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30" : "border-stone-100 bg-stone-50/60 dark:border-stone-800 dark:bg-stone-800/50"}`}>
            <p className="text-sm font-bold">{m.name}</p>
            <p className="text-[11px] text-stone-500">{m.hindi} · GI {m.gi} · {m.protein}g protein · {m.fibre}g fibre</p>
            <p className="mt-1 text-[11px] text-stone-600 dark:text-stone-300">{m.bestFor.join(" · ")}</p>
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:from-stone-800 dark:to-stone-800">
        <p className="text-sm font-bold">Swap: {currentGrain} → {selected.name}</p>
        <p className="mt-1 text-sm text-stone-700 dark:text-stone-200">{selected.swap}</p>
        <p className="mt-2 text-[12px] text-stone-600 dark:text-stone-300">Why: GI {selected.gi} vs white rice GI 70-80. More fibre ({selected.fibre}g vs 0.2g white rice) + protein ({selected.protein}g). Start 50:50 with current grain for adherence.</p>
        <p className="mt-2 text-[11px] text-stone-500">Tip: Soak millets 6-8h, rinse, pressure cook 2-3 whistles. Add veggies + dal for complete protein. Not for kidney disease without clinician advice (potassium).</p>
      </div>
    </div>
  );
}
