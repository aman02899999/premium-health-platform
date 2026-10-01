"use client";

import { useState } from "react";
import { Baby } from "lucide-react";

export function ChildGrowthTracker() {
  const [ageMonths, setAgeMonths] = useState(24);
  const [weight, setWeight] = useState(12);
  const [height, setHeight] = useState(85);
  const [sex, setSex] = useState<"boy" | "girl">("boy");

  // Very simplified WHO median approx (not accurate for clinical) — educational only
  const whoMedianWeight = sex === "boy" ? 12.2 + (ageMonths - 24) * 0.15 : 11.5 + (ageMonths - 24) * 0.15;
  const whoMedianHeight = sex === "boy" ? 87 + (ageMonths - 24) * 0.5 : 86 + (ageMonths - 24) * 0.5;
  const weightPct = ((weight / whoMedianWeight) * 100).toFixed(0);
  const heightPct = ((height / whoMedianHeight) * 100).toFixed(0);

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Baby className="h-4 w-4 text-emerald-600" /> Child Growth Tracker — WHO Simplified (Unique)</h3>
      <p className="mt-1 text-[11px] text-stone-500">Educational only — not clinical diagnosis. Use official WHO Anthro app / MCP card for real percentile. Consult pediatrician.</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-sm">Sex
          <select value={sex} onChange={(e) => setSex(e.target.value as any)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm">
            <option value="boy">Boy</option>
            <option value="girl">Girl</option>
          </select>
        </label>
        <label className="text-sm">Age months: {ageMonths}
          <input type="range" min={0} max={60} value={ageMonths} onChange={(e) => setAgeMonths(Number(e.target.value))} className="w-full" />
        </label>
        <label className="text-sm">Weight kg: {weight}
          <input type="range" min={2} max={25} step={0.1} value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full" />
        </label>
        <label className="text-sm sm:col-span-3">Height cm: {height}
          <input type="range" min={45} max={120} value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full" />
        </label>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
          <p className="text-xs font-bold">Weight vs median</p>
          <p className="text-lg font-black">{weight} kg — {weightPct}% of median ({whoMedianWeight.toFixed(1)} kg median)</p>
          <p className="mt-1 text-[11px]">{Number(weightPct) < 80 ? "Below expected — check diet, infections, get MCP card plotted." : Number(weightPct) > 120 ? "Above median — check diet, activity." : "Near median — continue balanced diet."}</p>
        </div>
        <div className="rounded-2xl bg-sky-50 p-3 dark:bg-sky-950/30">
          <p className="text-xs font-bold">Height vs median</p>
          <p className="text-lg font-black">{height} cm — {heightPct}% of median ({whoMedianHeight.toFixed(1)} cm median)</p>
          <p className="mt-1 text-[11px]">{Number(heightPct) < 90 ? "Short — consider chronic nutrition, thyroid, referral." : "Near median."}</p>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-stone-400">Indian context: Use Mother Child Protection card, Anganwadi growth monitoring, IAP charts. This simplified calc is NOT replacement — it exists to demonstrate unique child health feature.</p>
    </div>
  );
}
