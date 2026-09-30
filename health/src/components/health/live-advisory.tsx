"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Droplets, Sun, Bug } from "lucide-react";
import type { IndiaPulse } from "@/lib/realtime";

export function LiveHealthAdvisory() {
  const [pulse, setPulse] = useState<IndiaPulse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/realtime/pulse")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setPulse(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rounded-3xl border p-5 text-sm">Loading live advisory…</div>;
  if (!pulse) return <div className="rounded-3xl border p-5 text-sm">Live pulse unavailable — showing static seasonal advice.</div>;

  const advisories: { icon: any; title: string; body: string; level: "info" | "warn" | "danger" }[] = [];

  // Season based
  if (pulse.season.includes("Monsoon") || pulse.season.includes("Varsha")) {
    advisories.push({
      icon: Bug,
      title: "Monsoon — Dengue / Malaria / Leptospirosis",
      body: "Empty stagnant water weekly, use repellents, full sleeves at dusk. Avoid street food, drink boiled/filtered water. If fever + body ache + rash — see clinician, avoid self-medicating NSAIDs if dengue suspected.",
      level: "warn",
    });
    advisories.push({
      icon: Droplets,
      title: "Water safety",
      body: "Monsoon contamination risk — boil water 1 min rolling boil, or use certified filter + UV. Wash leafy greens thoroughly.",
      level: "info",
    });
  }
  if (pulse.season.includes("Summer") || pulse.season.includes("Grishma")) {
    advisories.push({
      icon: Sun,
      title: "Heat — Stay hydrated, avoid 12-4 PM sun",
      body: "2.5-3L fluids unless restricted (heart/kidney). ORS if sweating heavily. Hat, sunglasses, light cotton. If dizziness, confusion, hot dry skin — heat stroke emergency.",
      level: "danger",
    });
  }
  if (pulse.season.includes("Winter") || pulse.season.includes("Shishira")) {
    advisories.push({
      icon: Sun,
      title: "Winter — Vitamin D + smog",
      body: "Morning sun 20 min for vitamin D. In Delhi NCR smog: N95 outdoors, avoid 5-10 AM outdoor exercise if AQI >150, steam inhalation if prescribed.",
      level: "info",
    });
  }

  // City specific UV
  const highUV = pulse.cities.filter((c) => (c.uvIndex ?? 0) > 7);
  if (highUV.length) {
    advisories.push({
      icon: Sun,
      title: `High UV in ${highUV.map((c) => c.city).join(", ")} — UV ${highUV[0].uvIndex}`,
      body: "UV >7 = very high — sunscreen SPF 30+, hat, sunglasses, seek shade 11 AM - 3 PM. Skin cancer risk with chronic exposure.",
      level: "warn",
    });
  }

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><AlertTriangle className="h-4 w-4 text-amber-600" /> Live Health Advisory — Unique India (Open-Meteo + Seasonal)</h3>
      <p className="mt-1 text-[11px] text-stone-500">Live season {pulse.season} from Open-Meteo, city UV, sunrise/sunset — combined with India public health calendar. Educational.</p>

      <div className="mt-4 space-y-2">
        {advisories.map((ad, i) => (
          <div key={i} className={`rounded-2xl border p-3 ${ad.level === "danger" ? "border-rose-300 bg-rose-50 dark:bg-rose-950/30" : ad.level === "warn" ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30" : "border-sky-200 bg-sky-50 dark:bg-sky-950/30"}`}>
            <p className="flex items-center gap-2 text-sm font-bold"><ad.icon className="h-4 w-4" /> {ad.title}</p>
            <p className="mt-1 text-[12px] text-stone-700 dark:text-stone-200">{ad.body}</p>
          </div>
        ))}
        {advisories.length === 0 && <p className="text-sm">No high-risk advisory — maintain hand hygiene, seasonal diet per Ritucharya.</p>}
      </div>

      <div className="mt-4 rounded-xl bg-stone-50 p-3 text-[11px] text-stone-500 dark:bg-stone-800">
        <p>Live cities: {pulse.cities.map((c) => `${c.city} ${c.tempC ? `${c.tempC}°C` : ""} UV ${c.uvIndex ?? "—"}`).join(" · ")}</p>
        <p className="mt-1">Source: Open-Meteo (free, no key) + India public health advisories. Not medical diagnosis.</p>
      </div>
    </div>
  );
}
