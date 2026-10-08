"use client";
import { Clock } from "lucide-react";
import { MEASURE_LEGEND, household, mealTime } from "@/lib/diet-pro/household";
import type { PlannedDay, PlannedMeal } from "@/lib/diet-pro/meals";
import type { ClientProfile } from "@/lib/diet-pro/types";
import { Tilt } from "./ui";

/** One line per food, in household measures ("2 phulka", "1 katori dal"). */
export function chartLines(m: PlannedMeal, p: ClientProfile) {
  return m.items.map((it) => {
    const h = household(it.food.id, it.grams, m.template, p.useWhey ? p.whey : undefined);
    return { name: it.food.name.replace(/\s*\((raw|dry|cooked|for roti\/phulka)[^)]*\)/i, ""), qty: h.qty, note: h.note };
  });
}

/** The client-facing chart: time, meal, dish and what to put on the plate. */
export function DietChart({ days, day, setDay, p }: { days: PlannedDay[]; day: number; setDay: (d: number) => void; p: ClientProfile }) {
  const d = days[day];
  if (!d) return null;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {days.map((x, i) => (
          <button key={i} type="button" onClick={() => setDay(i)} className={`rounded-xl px-3 py-2 text-xs font-bold ring-1 transition ${day === i ? "bg-brand text-white ring-brand" : "bg-white/5 text-white/60 ring-white/10 hover:text-white"}`}>
            Day {x.day}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-white/45">Wake-up {p.wakeTime || "06:30"} · {Math.round(d.total.kcal)} kcal · {Math.round(d.total.p)} g protein</span>
      </div>

      <Tilt className="overflow-hidden p-0" strength={0.8}>
        <ol className="divide-y divide-white/5">
          <li className="flex gap-3 px-4 py-3 text-xs text-white/70">
            <span className="w-16 shrink-0 font-bold text-sky">{mealTime("Wake", p.wakeTime, p.mealsPerDay)}</span>
            <span>On waking: 1–2 glasses of water. {p.style === "vrat" ? "" : "Optional: soaked methi or jeera water."}</span>
          </li>
          {d.meals.map((m, mi) => (
            <li key={mi} className="grid gap-2 px-4 py-3 sm:grid-cols-[4rem_1fr]">
              <span className="flex items-center gap-1 text-xs font-bold text-sky sm:block">
                <Clock className="h-3 w-3 sm:hidden" />
                {mealTime(m.label, p.wakeTime, p.mealsPerDay)}
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-soft">{m.label}</p>
                <h4 className="font-display text-base leading-tight">{m.template}</h4>
                <ul className="mt-1.5 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  {chartLines(m, p).map((l, i) => (
                    <li key={i} className="flex items-baseline gap-2">
                      <b className="shrink-0 text-white">{l.qty}</b>
                      <span className="text-white/70">{l.name}</span>
                      {l.note && <span className="text-[10px] text-white/35">({l.note})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </Tilt>

      <Tilt className="p-4" strength={0.8}>
        <h4 className="font-display text-base">Week at a glance</h4>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[640px] text-[11px]">
            <thead className="text-left text-[10px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="py-1 pr-2 font-semibold">Day</th>
                {d.meals.map((m) => (
                  <th key={m.label} className="pr-2 font-semibold">
                    {m.label.replace(" snack", "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((x, i) => (
                <tr key={i} className={`border-t border-white/5 align-top ${i === day ? "bg-white/5" : ""}`}>
                  <td className="py-1.5 pr-2 font-bold">{x.day}</td>
                  {x.meals.map((m, mi) => (
                    <td key={mi} className="py-1.5 pr-2 text-white/75">
                      {m.template}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tilt>

      <div className="grid gap-3 text-[11px] text-white/50 md:grid-cols-2">
        <div>
          <p className="mb-1 font-bold uppercase tracking-wider text-white/60">Measures used</p>
          <p>{MEASURE_LEGEND.join(" · ")}</p>
        </div>
        <div>
          <p className="mb-1 font-bold uppercase tracking-wider text-white/60">Simple rules</p>
          <p>Cook with the measured oil only, use salt sparingly (under 1 tsp a day in all), and keep the dal, sabzi and salad portions as written. If a meal is missed, don&apos;t double the next one. Grains and dals are measured raw; the cooked katori is a guide.</p>
        </div>
      </div>
    </div>
  );
}
