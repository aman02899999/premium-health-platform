"use client";

import { useState } from "react";
import { Apple, Plus, Trash2 } from "lucide-react";

type FoodLog = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
};

export function NutritionTracker() {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; nutrients: { calories?: number; protein?: number; carbs?: number; fat?: number } }[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/health/food?q=${encodeURIComponent(q)}&limit=5`);
      if (res.ok) {
        const json = await res.json();
        setSearchResults(json.data ?? []);
      }
    } catch {}
    setLoading(false);
  };

  const add = (food: { id: string; name: string; nutrients: { calories?: number; protein?: number; carbs?: number; fat?: number } }) => {
    setLogs((prev) => [
      ...prev,
      {
        id: `${food.id}-${Date.now()}`,
        name: food.name,
        calories: food.nutrients.calories ?? 0,
        protein: food.nutrients.protein ?? 0,
        carbs: food.nutrients.carbs ?? 0,
        fat: food.nutrients.fat ?? 0,
        quantity: 100,
        unit: "g",
      },
    ]);
  };

  const totals = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + (l.calories * l.quantity) / 100,
      protein: acc.protein + (l.protein * l.quantity) / 100,
      carbs: acc.carbs + (l.carbs * l.quantity) / 100,
      fat: acc.fat + (l.fat * l.quantity) / 100,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Apple className="h-4 w-4 text-emerald-600" /> Nutrition Tracker (local)</h3>
      <p className="mt-1 text-[11px] text-stone-500">Search foods via Open Food Facts (free) + USDA (key) — logs stored locally, not medical advice.</p>

      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); search(query); }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search apple, dal, milk…" className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm dark:border-stone-700 dark:bg-stone-800" />
        <button className="h-10 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white">{loading ? "…" : "Search"}</button>
      </form>

      {searchResults.length > 0 && (
        <ul className="mt-3 space-y-1">
          {searchResults.map((f) => (
            <li key={f.id} className="flex items-center justify-between rounded-xl bg-stone-50 p-2 text-sm dark:bg-stone-800">
              <span>{f.name} — {f.nutrients.calories ?? "—"} kcal/100g</span>
              <button onClick={() => add(f)} className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800"><Plus className="h-3 w-3" /> Add</button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Today&apos;s log</h4>
        {logs.length === 0 ? <p className="mt-2 text-sm text-stone-500">No foods logged yet.</p> : (
          <ul className="mt-2 space-y-1">
            {logs.map((l) => (
              <li key={l.id} className="flex items-center justify-between rounded-xl border border-stone-100 p-2 text-sm dark:border-stone-800">
                <span>{l.name} — {l.quantity}g — {((l.calories * l.quantity) / 100).toFixed(0)} kcal</span>
                <button onClick={() => setLogs((prev) => prev.filter((x) => x.id !== l.id))} className="text-rose-500"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded-xl bg-emerald-50 p-2 dark:bg-emerald-950/30"><p className="font-black">{totals.calories.toFixed(0)}</p><p>kcal</p></div>
          <div className="rounded-xl bg-stone-50 p-2 dark:bg-stone-800"><p className="font-black">{totals.protein.toFixed(1)}g</p><p>protein</p></div>
          <div className="rounded-xl bg-stone-50 p-2 dark:bg-stone-800"><p className="font-black">{totals.carbs.toFixed(1)}g</p><p>carbs</p></div>
          <div className="rounded-xl bg-stone-50 p-2 dark:bg-stone-800"><p className="font-black">{totals.fat.toFixed(1)}g</p><p>fat</p></div>
        </div>
      </div>
    </div>
  );
}
