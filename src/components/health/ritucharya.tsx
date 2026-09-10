"use client";

import { useEffect, useState } from "react";
import { CloudSun, Leaf, Droplets } from "lucide-react";
import type { IndiaPulse } from "@/lib/realtime";

export function RitucharyaPlanner() {
  const [pulse, setPulse] = useState<IndiaPulse | null>(null);

  useEffect(() => {
    fetch("/api/realtime/pulse").then((r) => (r.ok ? r.json() : null)).then(setPulse).catch(() => {});
  }, []);

  const season = pulse?.season ?? "Loading…";
  const advice = pulse?.seasonAdvice ?? "Seasonal advice loading…";

  const ritucharyaMap: Record<string, { diet: string[]; lifestyle: string[]; avoid: string[] }> = {
    "Winter (Shishira)": {
      diet: ["Warm, unctuous foods: ghee, milk, millets (bajra), sesame, jaggery", "Protein: dal, paneer, eggs, sprouts", "Spices: ginger, pepper, cinnamon (ushna)"],
      lifestyle: ["Abhyanga (oil massage) with sesame oil", "Early morning sun for vitamin D", "Strength training, less intense cardio in smog"],
      avoid: ["Cold, raw, refrigerated foods", "Late nights, excess fasting in winter"],
    },
    "Summer (Grishma)": {
      diet: ["Cooling: buttermilk, curd, coconut water, cucumber, watermelon", "Light: moong dal, barley, old rice", "Fluids 2.5-3L unless restricted"],
      lifestyle: ["Avoid 12-4 PM sun, hat + sunglasses", "Light exercise early morning/evening", "Sheetali pranayama (cooling breath)"],
      avoid: ["Alcohol, excess spicy, fried, heavy non-veg in peak heat", "Dehydration, ORS if exertion"],
    },
    "Monsoon (Varsha)": {
      diet: ["Fresh, hot, light: moong dal khichdi, soups, steamed", "Boiled/filtered water, avoid street food", "Ginger, turmeric, pepper for agni"],
      lifestyle: ["Empty stagnant water weekly (dengue/malaria)", "Mosquito repellents, full sleeves", "Light exercise indoors if heavy rain"],
      avoid: ["Leafy greens if waterlogged (contamination risk)", "Heavy, oily, fermented foods if low agni"],
    },
  };

  const current = Object.entries(ritucharyaMap).find(([k]) => season.includes(k.split(" ")[0]))?.[1] ?? ritucharyaMap["Monsoon (Varsha)"];

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><CloudSun className="h-4 w-4 text-amber-600" /> Ritucharya — Seasonal Planner (Unique India)</h3>
      <p className="mt-1 text-[11px] text-stone-500">Live season from Open-Meteo pulse + classical Ayurveda Ritucharya — traditional framework + modern safety, educational only.</p>

      <div className="mt-3 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:from-stone-800 dark:to-stone-800">
        <p className="text-sm font-bold">{season} — Live</p>
        <p className="mt-1 text-sm text-stone-700 dark:text-stone-200">{advice}</p>
        {pulse?.cities?.[0]?.sunrise && <p className="mt-1 text-[11px] text-stone-500">Sunrise {pulse.cities[0].sunrise} · Sunset {pulse.cities[0].sunset} · UV {pulse.cities[0].uvIndex ?? "—"} ({pulse.cities[0].uvMax ? `max ${pulse.cities[0].uvMax}` : ""})</p>}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
          <p className="flex items-center gap-1 text-xs font-bold"><Leaf className="h-3 w-3" /> Pathya (wholesome)</p>
          <ul className="mt-1 list-disc pl-4 text-[12px]">{current.diet.map((d, i) => <li key={i}>{d}</li>)}</ul>
        </div>
        <div className="rounded-2xl bg-sky-50 p-3 dark:bg-sky-950/30">
          <p className="flex items-center gap-1 text-xs font-bold"><CloudSun className="h-3 w-3" /> Lifestyle</p>
          <ul className="mt-1 list-disc pl-4 text-[12px]">{current.lifestyle.map((d, i) => <li key={i}>{d}</li>)}</ul>
        </div>
        <div className="rounded-2xl bg-rose-50 p-3 dark:bg-rose-950/30">
          <p className="flex items-center gap-1 text-xs font-bold"><Droplets className="h-3 w-3" /> Avoid</p>
          <ul className="mt-1 list-disc pl-4 text-[12px]">{current.avoid.map((d, i) => <li key={i}>{d}</li>)}</ul>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-stone-400">Traditional Ayurvedic seasonal wisdom — not a substitute for medical advice. Adapt for diabetes, kidney, heart disease with clinician.</p>
    </div>
  );
}
