"use client";

import { useState } from "react";
import { Dumbbell, Plus, Trash2 } from "lucide-react";

type Exercise = { id: string; name: string; category?: string; muscles: string[] };
type WorkoutExercise = { exerciseId: string; name: string; sets: number; reps: string; rest: number };

export function WorkoutBuilder() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [workout, setWorkout] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/health/exercises?q=${encodeURIComponent(q)}&limit=8`);
      if (res.ok) {
        const json = await res.json();
        setResults(json.data ?? []);
      }
    } catch {}
    setLoading(false);
  };

  const add = (ex: Exercise) => {
    setWorkout((prev) => [...prev, { exerciseId: ex.id, name: ex.name, sets: 3, reps: "10-12", rest: 60 }]);
  };

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Dumbbell className="h-4 w-4 text-violet-600" /> Workout Builder (local)</h3>
      <p className="mt-1 text-[11px] text-stone-500">Search wger exercises (AGPL-3.0, free) — build workout locally, educational only.</p>

      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); search(query); }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chest, squat, pushup…" className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm dark:border-stone-700 dark:bg-stone-800" />
        <button className="h-10 rounded-xl bg-violet-700 px-4 text-xs font-bold text-white">{loading ? "…" : "Search"}</button>
      </form>

      {results.length > 0 && (
        <ul className="mt-3 space-y-1">
          {results.map((ex) => (
            <li key={ex.id} className="flex items-center justify-between rounded-xl bg-stone-50 p-2 text-sm dark:bg-stone-800">
              <span>{ex.name} — {ex.category ?? "—"} · {ex.muscles?.slice(0, 2).join(", ")}</span>
              <button onClick={() => add(ex)} className="flex items-center gap-1 rounded-full bg-violet-100 px-2 py-1 text-xs font-bold text-violet-800"><Plus className="h-3 w-3" /> Add</button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Your workout ({workout.length} exercises)</h4>
        {workout.length === 0 ? <p className="mt-2 text-sm text-stone-500">No exercises added.</p> : (
          <ul className="mt-2 space-y-2">
            {workout.map((we, i) => (
              <li key={`${we.exerciseId}-${i}`} className="rounded-xl border border-stone-100 p-3 dark:border-stone-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{i + 1}. {we.name}</span>
                  <button onClick={() => setWorkout((prev) => prev.filter((_, idx) => idx !== i))} className="text-rose-500"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <label>Sets <input type="number" value={we.sets} onChange={(e) => { const v = Number(e.target.value); setWorkout((prev) => prev.map((x, idx) => idx === i ? { ...x, sets: v } : x)); }} className="mt-1 w-full rounded border px-2 py-1" /></label>
                  <label>Reps <input value={we.reps} onChange={(e) => setWorkout((prev) => prev.map((x, idx) => idx === i ? { ...x, reps: e.target.value } : x))} className="mt-1 w-full rounded border px-2 py-1" /></label>
                  <label>Rest (s) <input type="number" value={we.rest} onChange={(e) => { const v = Number(e.target.value); setWorkout((prev) => prev.map((x, idx) => idx === i ? { ...x, rest: v } : x)); }} className="mt-1 w-full rounded border px-2 py-1" /></label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
