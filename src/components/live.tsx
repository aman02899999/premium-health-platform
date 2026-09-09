"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity, AlertTriangle, CloudSun, Droplets, FlaskConical, Leaf,
  Pill, RefreshCw, ShieldCheck, Thermometer, Wind,
} from "lucide-react";
import type { IndiaPulse, DrugLive, FoodLive } from "@/lib/realtime";
import { weatherLabel } from "@/lib/realtime";

/* ---------------- Live ticker ---------------- */
export function LiveTicker() {
  const [pulse, setPulse] = useState<IndiaPulse | null>(null);
  useEffect(() => {
    fetch("/api/realtime/pulse").then((r) => (r.ok ? r.json() : null)).then(setPulse).catch(() => {});
  }, []);
  const items = pulse
    ? [
        `🕒 ${pulse.istTime} IST`,
        `🌿 ${pulse.season}`,
        ...pulse.cities.slice(0, 5).map((c) => `${c.city}: ${c.tempC ?? "–"}°C · AQI ${c.aqiUS ?? "–"} (${c.aqiLabel})`),
        pulse.covid.live ? `🦠 India COVID active: ${pulse.covid.active.toLocaleString("en-IN")}` : "🦠 COVID tracker: updating",
      ]
    : ["Loading live India health pulse…"];
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-b border-emerald-100 bg-emerald-950 py-1.5 text-emerald-50 dark:border-emerald-900" aria-label="Live health ticker">
      <div className="news-ticker flex w-max items-center gap-8 px-4 text-[12px] font-medium">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-2 whitespace-nowrap">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" /> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- AQI colour ---------------- */
function aqiColor(aqi: number | null): string {
  if (aqi == null) return "bg-stone-300";
  if (aqi <= 50) return "bg-emerald-500";
  if (aqi <= 100) return "bg-lime-500";
  if (aqi <= 150) return "bg-amber-500";
  if (aqi <= 200) return "bg-orange-500";
  if (aqi <= 300) return "bg-red-500";
  return "bg-rose-800";
}

/* ---------------- India Health Pulse dashboard ---------------- */
export function IndiaPulseDashboard() {
  const [pulse, setPulse] = useState<IndiaPulse | null>(null);
  const [error, setError] = useState(false);
  const [now, setNow] = useState("");

  useEffect(() => {
    fetch("/api/realtime/pulse")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setPulse)
      .catch(() => setError(true));
    const tick = () =>
      setNow(new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }).format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (error)
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" /> Live data is temporarily unreachable</p>
        <p className="mt-1">Our upstream sources (Open-Meteo, disease.sh) are down right now. All guides, calculators and tools below still work fully.</p>
      </div>
    );

  if (!pulse)
    return (
      <div className="grid animate-pulse gap-4 md:grid-cols-3" aria-label="Loading live data">
        {[0, 1, 2].map((i) => <div key={i} className="h-48 rounded-3xl bg-stone-200/70 dark:bg-stone-800/70" />)}
      </div>
    );

  const worst = [...pulse.cities].sort((a, b) => (b.aqiUS ?? 0) - (a.aqiUS ?? 0))[0];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Cities AQI + weather */}
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-stone-700 dark:bg-stone-900">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-bold"><Wind className="h-4 w-4 text-sky-600" /> Live air quality + weather · 8 cities</p>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" /> LIVE · {now} IST
            </span>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {pulse.cities.map((c) => (
              <li key={c.city} className="rounded-2xl border border-stone-100 bg-stone-50/60 p-3 dark:border-stone-800 dark:bg-stone-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{c.city}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${aqiColor(c.aqiUS)}`}>AQI {c.aqiUS ?? "–"}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-[12px] text-stone-600 dark:text-stone-300">
                  <span className="flex items-center gap-1"><Thermometer className="h-3.5 w-3.5 text-orange-500" />{c.tempC ?? "–"}°C</span>
                  <span className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5 text-sky-500" />{c.humidity ?? "–"}%</span>
                  <span className="flex items-center gap-1"><CloudSun className="h-3.5 w-3.5 text-amber-500" />{weatherLabel(c.weatherCode)}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                  <div className={`h-full rounded-full ${aqiColor(c.aqiUS)}`} style={{ width: `${Math.min(100, ((c.aqiUS ?? 0) / 300) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-stone-500">Source: Open-Meteo (live, keyless). {worst ? `Highest right now: ${worst.city} (AQI ${worst.aqiUS ?? "–"}). ` : ""}{worst?.advice}</p>
        </div>

        {/* Season + COVID */}
        <div className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 p-5 text-white shadow-lg">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">{pulse.season}</p>
            <p className="mt-2 text-sm leading-relaxed text-emerald-50/90">{pulse.seasonAdvice}</p>
            <Link href="/news" className="mt-3 inline-block rounded-xl bg-white/10 px-4 py-2 text-xs font-bold hover:bg-white/20">Today&apos;s health briefing →</Link>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-700 dark:bg-stone-900">
            <p className="flex items-center gap-2 text-sm font-bold"><Activity className="h-4 w-4 text-rose-500" /> India COVID snapshot {pulse.covid.live && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">LIVE</span>}</p>
            {pulse.covid.live ? (
              <dl className="mt-3 grid grid-cols-2 gap-2 text-center">
                {[["Active", pulse.covid.active], ["Total cases", pulse.covid.cases], ["Recovered", pulse.covid.recovered], ["Deaths", pulse.covid.deaths]].map(([l, v]) => (
                  <div key={l as string} className="rounded-xl bg-stone-50 p-2.5 dark:bg-stone-800/60">
                    <dt className="text-[10px] font-bold uppercase text-stone-500">{l}</dt>
                    <dd className="text-base font-black tabular-nums">{(v as number).toLocaleString("en-IN")}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-xs text-stone-500">Tracker updating — check our news briefing for the latest advisories.</p>
            )}
            <p className="mt-2 text-[11px] text-stone-400">Source: disease.sh · Updated {new Date(pulse.covid.updated).toLocaleDateString("en-IN")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Drug safety lookup (openFDA) ---------------- */
export function DrugLookup() {
  const [q, setQ] = useState("metformin");
  const [data, setData] = useState<DrugLive | null>(null);
  const [loading, setLoading] = useState(false);
  const run = async (term: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/realtime/drug?name=${encodeURIComponent(term)}`);
      setData(r.ok ? await r.json() : null);
    } catch { setData(null); }
    setLoading(false);
  };
  useEffect(() => { run("metformin"); }, []);
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-700 dark:bg-stone-900">
      <p className="flex items-center gap-2 text-sm font-bold"><Pill className="h-4 w-4 text-sky-600" /> Live drug-label lookup <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] text-sky-800 dark:bg-sky-900 dark:text-sky-200">openFDA</span></p>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); run(q); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try metformin, atorvastatin…" aria-label="Drug name" className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm outline-none focus:border-sky-400 dark:border-stone-700 dark:bg-stone-800" />
        <button className="h-10 shrink-0 rounded-xl bg-sky-700 px-4 text-xs font-bold text-white hover:bg-sky-600">{loading ? "…" : "Check"}</button>
      </form>
      {data && (
        <div className="mt-3 text-[13px]">
          {data.found ? (
            <>
              <p className="font-bold">{data.genericName}</p>
              {data.brandNames.length > 0 && <p className="mt-1 text-stone-500">Brands: {data.brandNames.join(", ")}</p>}
              {data.warnings.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {data.warnings.map((w, i) => (
                    <li key={i} className="flex gap-1.5 rounded-xl bg-amber-50 p-2.5 text-[12px] leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{w}</li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-stone-500">No boxed warnings in label summary — read the full leaflet and ask your doctor.</p>}
            </>
          ) : <p className="text-stone-500">No FDA label found for “{q}”. Try the generic name (e.g. amlodipine).</p>}
          <p className="mt-2 text-[11px] text-stone-400">Educational only — never start/stop a medicine without your doctor. <Link href="/medicines" className="text-sky-700 underline">Our medicine guides →</Link></p>
        </div>
      )}
    </div>
  );
}

/* ---------------- Packaged-food lookup (Open Food Facts) ---------------- */
const GRADE_COLOR: Record<string, string> = { A: "bg-emerald-600", B: "bg-lime-600", C: "bg-amber-500", D: "bg-orange-600", E: "bg-red-600" };

export function FoodLookup() {
  const [q, setQ] = useState("maggi noodles");
  const [data, setData] = useState<FoodLive | null>(null);
  const [loading, setLoading] = useState(false);
  const [miss, setMiss] = useState(false);
  const run = async (term: string) => {
    setLoading(true); setMiss(false);
    try {
      const r = await fetch(`/api/realtime/food?q=${encodeURIComponent(term)}`);
      const j = r.ok ? await r.json() : null;
      if (j?.found) setData(j); else { setData(null); setMiss(true); }
    } catch { setData(null); setMiss(true); }
    setLoading(false);
  };
  useEffect(() => { run("parle hide and seek"); }, []);
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-700 dark:bg-stone-900">
      <p className="flex items-center gap-2 text-sm font-bold"><Leaf className="h-4 w-4 text-emerald-600" /> Packaged-food truth check <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Open Food Facts</span></p>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); run(q); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try a biscuit, namkeen, juice…" aria-label="Food product" className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm outline-none focus:border-emerald-400 dark:border-stone-700 dark:bg-stone-800" />
        <button className="h-10 shrink-0 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white hover:bg-emerald-600">{loading ? "…" : "Scan"}</button>
      </form>
      {data?.found && (
        <div className="mt-3">
          <div className="flex items-center gap-3">
            {data.nutriScore && <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black text-white ${GRADE_COLOR[data.nutriScore] ?? "bg-stone-400"}`}>{data.nutriScore}</span>}
            <div>
              <p className="text-sm font-bold leading-tight">{data.name}</p>
              <p className="text-[11px] text-stone-500">{data.brand}{data.nova ? ` · NOVA ${data.nova}` : ""} · per 100 g</p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5 text-center text-[11px]">
            {[["Sugar", data.nutrients.sugars, "g"], ["Fat", data.nutrients.fat, "g"], ["Sodium", data.nutrients.sodium ? data.nutrients.sodium * 1000 : undefined, "mg"], ["Fibre", data.nutrients.fiber, "g"]].map(([l, v, u]) => (
              <div key={l as string} className="rounded-lg bg-stone-50 p-1.5 dark:bg-stone-800/60">
                <p className="font-bold tabular-nums">{v != null ? `${Number(v).toFixed(1)}${u}` : "–"}</p>
                <p className="text-stone-500">{l}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 flex gap-1.5 rounded-xl bg-emerald-50 p-2.5 text-[12px] text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />{data.verdict}</p>
        </div>
      )}
      {miss && <p className="mt-3 text-[13px] text-stone-500">Product not found — try another spelling or a bigger brand.</p>}
      <p className="mt-2 text-[11px] text-stone-400">Live label data, not our opinion. <Link href="/nutrition" className="text-emerald-700 underline">Nutrition guides →</Link></p>
    </div>
  );
}

/* ---------------- Refresh hint ---------------- */
export function LiveBadge() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    fetch("/api/realtime/pulse").then((r) => setOk(r.ok)).catch(() => setOk(false));
  }, []);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
      {ok === null ? <RefreshCw className="h-3 w-3 animate-spin" /> : <span className={`h-1.5 w-1.5 rounded-full ${ok ? "animate-pulse bg-emerald-600" : "bg-amber-500"}`} />}
      {ok === null ? "Connecting live…" : ok ? "Live data connected" : "Live data retrying"}
    </span>
  );
}

export function LabStrip() {
  return (
    <div className="flex items-center gap-2 text-[12px] text-stone-500">
      <FlaskConical className="h-3.5 w-3.5 text-cyan-600" />
      <span>Understand reports: <Link href="/lab-tests/hba1c" className="font-semibold text-cyan-700 underline">HbA1c</Link> · <Link href="/lab-tests/lipid-profile" className="font-semibold text-cyan-700 underline">Lipids</Link> · <Link href="/lab-tests/tsh" className="font-semibold text-cyan-700 underline">TSH</Link></span>
    </div>
  );
}
