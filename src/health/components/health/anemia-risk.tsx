"use client";

import { useState } from "react";
import { Droplets } from "lucide-react";

export function AnemiaRisk() {
  const [diet, setDiet] = useState("veg");
  const [fatigue, setFatigue] = useState(true);
  const [pallor, setPallor] = useState(false);
  const [heavyPeriods, setHeavyPeriods] = useState(false);
  const [teaCoffee, setTeaCoffee] = useState(true);

  const score = (diet === "veg" ? 2 : 0) + (fatigue ? 2 : 0) + (pallor ? 3 : 0) + (heavyPeriods ? 3 : 0) + (teaCoffee ? 1 : 0);
  const risk = score <= 2 ? "Low" : score <= 5 ? "Moderate" : "High";
  const color = risk === "Low" ? "bg-emerald-100 text-emerald-800" : risk === "Moderate" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800";

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Droplets className="h-4 w-4 text-rose-600" /> Anemia Risk — India Unique</h3>
      <p className="mt-1 text-[11px] text-stone-500">India has high iron deficiency. Educational screening only — confirm with hemoglobin, ferritin, B12.</p>
      <div className="mt-3 space-y-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={diet === "veg"} onChange={(e) => setDiet(e.target.checked ? "veg" : "nonveg")} /> Vegetarian (lower heme iron)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={fatigue} onChange={(e) => setFatigue(e.target.checked)} /> Persistent fatigue / breathlessness</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={pallor} onChange={(e) => setPallor(e.target.checked)} /> Pallor (pale inner eyelids/nails)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={heavyPeriods} onChange={(e) => setHeavyPeriods(e.target.checked)} /> Heavy periods (if applicable)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={teaCoffee} onChange={(e) => setTeaCoffee(e.target.checked)} /> Excess tea/coffee with meals (reduces iron absorption)</label>
      </div>
      <div className={`mt-4 rounded-2xl p-4 ${color}`}>
        <p className="text-sm font-bold">Risk: {risk} (score {score}/11)</p>
        <p className="mt-1 text-[12px]">{risk === "High" ? "High: Get CBC, ferritin, B12, stool occult if indicated. Eat iron-rich + vitamin C, avoid tea with meals." : risk === "Moderate" ? "Moderate: Improve diet (millets, green leafy, sprouts, egg), vitamin C with meals, re-check." : "Low: Maintain iron-rich diet, yearly hemoglobin if at risk."}</p>
      </div>
      <p className="mt-2 text-[11px] text-stone-400">Indian context: tea/coffee with meals, vegetarian diet, heavy periods, worm infestation are common contributors. Do not self-medicate iron without labs — excess iron harmful.</p>
    </div>
  );
}
