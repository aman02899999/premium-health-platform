"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { CATEGORY_LABEL, FOODS, foodById, totals, type Diet, type FoodCategory, type Portion } from "@/lib/fitness/foods";
import { useStored } from "./useStored";

const DIET_BADGE: Record<Diet, string> = { veg: "bg-emerald-500", egg: "bg-amber-400", nonveg: "bg-red-500" };

function Ring({ value, target, label, unit, color }: { value: number; target: number; label: string; unit: string; color: string }) {
  const pct = Math.min(1, target ? value / target : 0);
  const c = 2 * Math.PI * 34;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r="34" stroke="#2a2a35" strokeWidth="8" fill="none" />
        <circle cx="40" cy="40" r="34" stroke={color} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset .6s" }} />
      </svg>
      <div className="-mt-[66px] mb-8 text-center">
        <div className="text-lg font-bold text-white">{Math.round(value)}</div>
        <div className="text-[10px] text-white/50">/ {target}{unit}</div>
      </div>
      <div className="text-xs uppercase tracking-wider text-white/60">{label}</div>
    </div>
  );
}

export function NutritionTracker() {
  const [log, setLog] = useStored<Portion[]>("rfc-food-log", []);
  const [target, setTarget] = useStored("rfc-food-target", { kcal: 2000, protein: 100 });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<FoodCategory | "all">("all");
  const [sort, setSort] = useState<"name" | "protein" | "kcal">("protein");

  const t = totals(log);
  const foods = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return FOODS.filter((f) => (cat === "all" || f.category === cat) && (!needle || f.name.toLowerCase().includes(needle))).sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : b[sort] - a[sort],
    );
  }, [q, cat, sort]);

  const add = (id: string) =>
    setLog((l) => (l.some((p) => p.id === id) ? l.map((p) => (p.id === id ? { ...p, qty: p.qty + 1 } : p)) : [...l, { id, qty: 1 }]));
  const bump = (id: string, d: number) => setLog((l) => l.map((p) => (p.id === id ? { ...p, qty: Math.max(0.5, p.qty + d) } : p)));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <label className="relative block flex-1">
            <span className="sr-only">Search foods</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search roti, paneer, chicken…" className="field pl-9" />
          </label>
          <select value={cat} onChange={(e) => setCat(e.target.value as FoodCategory | "all")} className="field sm:w-48" aria-label="Category">
            <option value="all">All categories</option>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="field sm:w-44" aria-label="Sort by">
            <option value="protein">Most protein</option>
            <option value="kcal">Most calories</option>
            <option value="name">A–Z</option>
          </select>
        </div>
        <div className="glass overflow-x-auto rounded-3xl">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-gold">
              <tr>
                <th className="px-4 py-3">Food</th>
                <th className="px-2 py-3">Serving</th>
                <th className="px-2 py-3 text-right">kcal</th>
                <th className="px-2 py-3 text-right">Protein</th>
                <th className="px-2 py-3 text-right">Carbs</th>
                <th className="px-2 py-3 text-right">Fat</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {foods.map((f) => (
                <tr key={f.id} className="border-t border-white/5 hover:bg-white/[.03]">
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2 text-white">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${DIET_BADGE[f.diet]}`} title={f.diet} />
                      {f.name}
                    </span>
                  </td>
                  <td className="px-2 text-white/55">{f.serving}</td>
                  <td className="px-2 text-right text-white/80">{f.kcal}</td>
                  <td className="px-2 text-right font-semibold text-gold">{f.protein}g</td>
                  <td className="px-2 text-right text-white/70">{f.carbs}g</td>
                  <td className="px-2 text-right text-white/70">{f.fat}g</td>
                  <td className="px-4 text-right">
                    <button type="button" onClick={() => add(f.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 text-gold hover:bg-gold hover:text-black" aria-label={`Add ${f.name}`}>
                      <Plus className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-white/45">Approximate values for typical home recipes (IFCT/USDA based). Green = veg, yellow = egg, red = non-veg.</p>
      </div>

      <aside className="glass gold-border h-fit rounded-3xl p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-2xl text-white">Today&apos;s log</h2>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Ring value={t.kcal} target={target.kcal} label="Calories" unit="" color="#d4a94a" />
          <Ring value={t.protein} target={target.protein} label="Protein" unit="g" color="#34d399" />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
          {[
            ["Carbs", t.carbs],
            ["Fat", t.fat],
            ["Fibre", t.fibre],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-black/30 py-2">
              <div className="font-bold text-white">{Math.round(v as number)}g</div>
              <div className="text-white/50">{l}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
          <label>
            <span className="text-white/55">Calorie target</span>
            <input type="number" value={target.kcal} onChange={(e) => setTarget({ ...target, kcal: Number(e.target.value) || 0 })} className="field mt-1 py-1.5 text-sm" />
          </label>
          <label>
            <span className="text-white/55">Protein target (g)</span>
            <input type="number" value={target.protein} onChange={(e) => setTarget({ ...target, protein: Number(e.target.value) || 0 })} className="field mt-1 py-1.5 text-sm" />
          </label>
        </div>
        <ul className="mt-5 max-h-72 space-y-2 overflow-y-auto">
          {log.length === 0 && <li className="text-sm text-white/50">Tap + on any food to log it.</li>}
          {log.map((p) => {
            const food = foodById(p.id);
            if (!food) return null;
            return (
              <li key={p.id} className="flex items-center gap-2 rounded-xl bg-black/30 px-3 py-2 text-sm">
                <span className="flex-1 text-white">
                  {food.name}
                  <span className="block text-xs text-white/45">
                    {Math.round(food.kcal * p.qty)} kcal · {Math.round(food.protein * p.qty)}g protein
                  </span>
                </span>
                <button type="button" onClick={() => bump(p.id, -0.5)} className="rounded p-1 text-white/60" aria-label="Less">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center font-semibold text-white">{p.qty}×</span>
                <button type="button" onClick={() => bump(p.id, 0.5)} className="rounded p-1 text-white/60" aria-label="More">
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setLog((l) => l.filter((x) => x.id !== p.id))} className="rounded p-1 text-red-300/70" aria-label="Remove">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
        {log.length > 0 && (
          <button type="button" onClick={() => setLog([])} className="mt-4 text-xs text-white/50 underline">
            Clear day
          </button>
        )}
        <p className="mt-4 text-[11px] text-white/40">Saved only in this browser.</p>
      </aside>
    </div>
  );
}
