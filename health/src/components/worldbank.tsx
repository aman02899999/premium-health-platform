"use client";

import { useEffect, useState } from "react";
import { Globe, AlertTriangle } from "lucide-react";
import type { WBResponse } from "@/lib/worldbank";
import { formatWBValue } from "@/lib/worldbank";

export function WorldBankIndia() {
  const [data, setData] = useState<WBResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/realtime/worldbank")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        setData(j);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <p className="text-sm font-bold">Loading India health indicators…</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-800" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" /> World Bank data temporarily unavailable</p>
        <p className="mt-1 text-[13px]">We fetch live from api.worldbank.org (keyless). This preview sandbox blocks external APIs, so it shows fallback here — goes live automatically on any real deployment.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-bold"><Globe className="h-4 w-4 text-emerald-600" /> Live India health indicators — World Bank Open Data</p>
        {data.live ? <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">LIVE</span> : <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">Fallback</span>}
      </div>

      {!data.live && (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-[13px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Sandbox preview can&apos;t reach api.worldbank.org, so values show “—” here. On any real deployment this section loads live automatically.
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.indicators.map((ind) => (
          <div key={ind.code} className="rounded-2xl border border-stone-100 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-800/50">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{ind.label}</p>
            <p className="mt-1 text-2xl font-black tabular-nums">{formatWBValue(ind)}</p>
            <p className="text-[12px] text-stone-500">{ind.unit} {ind.year ? `· ${ind.year}` : ""}</p>
            <p className="mt-1 text-[10px] text-stone-400">{ind.code}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-stone-400">
        Source: {data.source} · Fetched {new Date(data.fetchedAt).toLocaleDateString("en-IN")} · CC BY 4.0 · Updates daily.
      </p>
    </div>
  );
}
