"use client";

import { useState } from "react";
import { Salad, Plus, Trash2 } from "lucide-react";

type ThaliItem = {
  id: string;
  name: string;
  category: "grain" | "dal" | "veg" | "protein" | "curd" | "oil" | "fruit";
  portion: string;
  calories: number;
  protein: number;
  fibre: number;
  notes?: string;
};

const THALI_LIBRARY: ThaliItem[] = [
  { id: "ragi-roti", name: "Ragi roti (2)", category: "grain", portion: "2 medium", calories: 180, protein: 5, fibre: 4, notes: "High calcium, low GI millet" },
  { id: "brown-rice", name: "Brown rice", category: "grain", portion: "1 katori", calories: 170, protein: 4, fibre: 2, notes: "Better than white rice" },
  { id: "foxtail-millet", name: "Foxtail millet (kangni)", category: "grain", portion: "1 katori cooked", calories: 160, protein: 5, fibre: 3, notes: "Low GI, diabetic friendly" },
  { id: "toor-dal", name: "Toor dal", category: "dal", portion: "1 katori", calories: 120, protein: 7, fibre: 3, notes: "Protein + fibre" },
  { id: "moong-dal", name: "Moong dal", category: "dal", portion: "1 katori", calories: 110, protein: 8, fibre: 4, notes: "Easiest to digest" },
  { id: "bhindi", name: "Bhindi sabzi", category: "veg", portion: "1 katori", calories: 80, protein: 2, fibre: 3, notes: "Low cal, fibre" },
  { id: "palak", name: "Palak paneer (low oil)", category: "veg", portion: "1 katori", calories: 140, protein: 7, fibre: 2, notes: "Iron + protein" },
  { id: "curd", name: "Curd (dahi)", category: "curd", portion: "100g", calories: 60, protein: 3, fibre: 0, notes: "Probiotic, calcium" },
  { id: "sprouts", name: "Moong sprouts", category: "protein", portion: "1 katori", calories: 90, protein: 7, fibre: 4, notes: "High protein veg" },
  { id: "egg-bhurji", name: "Egg bhurji (2 eggs, low oil)", category: "protein", portion: "2 eggs", calories: 180, protein: 12, fibre: 0, notes: "Complete protein" },
  { id: "mustard-oil", name: "Mustard oil (kachi ghani)", category: "oil", portion: "1 tsp", calories: 45, protein: 0, fibre: 0, notes: "MUFA, rotate oils" },
  { id: "guava", name: "Guava", category: "fruit", portion: "1 medium", calories: 70, protein: 1, fibre: 5, notes: "Vitamin C + fibre, low GI fruit" },
];

export function ThaliBuilder() {
  const [thali, setThali] = useState<ThaliItem[]>([THALI_LIBRARY[0], THALI_LIBRARY[3], THALI_LIBRARY[5], THALI_LIBRARY[7]]);
  const [filter, setFilter] = useState<ThaliItem["category"] | "all">("all");

  const filtered = filter === "all" ? THALI_LIBRARY : THALI_LIBRARY.filter((i) => i.category === filter);
  const totals = thali.reduce((acc, it) => ({ calories: acc.calories + it.calories, protein: acc.protein + it.protein, fibre: acc.fibre + it.fibre }), { calories: 0, protein: 0, fibre: 0 });

  const balance = (() => {
    const hasGrain = thali.some((t) => t.category === "grain");
    const hasDal = thali.some((t) => t.category === "dal" || t.category === "protein");
    const hasVeg = thali.some((t) => t.category === "veg");
    const hasCurd = thali.some((t) => t.category === "curd");
    if (hasGrain && hasDal && hasVeg && hasCurd) return "Balanced — grain + dal/protein + veg + curd (ideal Indian thali)";
    if (hasGrain && hasDal && hasVeg) return "Good — add curd for probiotic + calcium";
    return "Incomplete — aim for grain + dal/protein + veg + curd";
  })();

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Salad className="h-4 w-4 text-emerald-600" /> Indian Thali Builder — Unique</h3>
      <p className="mt-1 text-[11px] text-stone-500">Build balanced Indian thali: half veg, quarter grain (millet preferred), quarter dal/protein + curd. Educational only.</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(["all", "grain", "dal", "veg", "protein", "curd", "fruit", "oil"] as const).map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`rounded-full px-3 py-1 text-xs font-bold ${filter === c ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-600 dark:bg-stone-800"}`}>{c}</button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {filtered.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl bg-stone-50 p-2.5 dark:bg-stone-800/60">
            <div>
              <p className="text-sm font-semibold">{item.name}</p>
              <p className="text-[11px] text-stone-500">{item.portion} · {item.calories} kcal · {item.protein}g protein · {item.fibre}g fibre</p>
              <p className="text-[10px] text-stone-400">{item.notes}</p>
            </div>
            <button onClick={() => setThali((prev) => [...prev, item])} className="rounded-full bg-emerald-100 p-1.5 text-emerald-700"><Plus className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50 p-4 dark:from-stone-800 dark:to-stone-800">
        <h4 className="text-sm font-bold">Your thali ({thali.length} items) — {balance}</h4>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {thali.map((it, idx) => (
            <span key={`${it.id}-${idx}`} className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium shadow-sm dark:bg-stone-900">
              {it.name} <button onClick={() => setThali((prev) => prev.filter((_, i) => i !== idx))} className="text-rose-500"><Trash2 className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-white p-2 dark:bg-stone-900"><p className="text-lg font-black">{totals.calories}</p><p>kcal</p></div>
          <div className="rounded-xl bg-white p-2 dark:bg-stone-900"><p className="text-lg font-black">{totals.protein}g</p><p>protein</p></div>
          <div className="rounded-xl bg-white p-2 dark:bg-stone-900"><p className="text-lg font-black">{totals.fibre}g</p><p>fibre</p></div>
        </div>
        <p className="mt-2 text-[11px] text-stone-500">Tip: Salad first, protein second, grain last — lowers post-meal sugar spikes. Rotate oils (mustard, groundnut, sesame) and cap at 3-4 tsp/day.</p>
      </div>
    </div>
  );
}
