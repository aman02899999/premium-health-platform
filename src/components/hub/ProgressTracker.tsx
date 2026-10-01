"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { useStored } from "./useStored";

type Entry = { date: string; weight: number; waist: number };

function Chart({ entries, field, color, unit }: { entries: Entry[]; field: "weight" | "waist"; color: string; unit: string }) {
  const pts = entries.filter((e) => e[field] > 0);
  if (pts.length < 2) return <p className="py-10 text-center text-sm text-white/45">Add at least two entries to see your {field} trend.</p>;
  const vals = pts.map((p) => p[field]);
  const min = Math.min(...vals) - 1;
  const max = Math.max(...vals) + 1;
  const W = 600;
  const H = 200;
  const x = (i: number) => 30 + (i / (pts.length - 1)) * (W - 50);
  const y = (v: number) => 15 + (1 - (v - min) / (max - min)) * (H - 40);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p[field])}`).join(" ");
  const change = vals[vals.length - 1] - vals[0];
  return (
    <figure>
      <figcaption className="mb-2 flex items-baseline justify-between">
        <span className="font-semibold capitalize text-white">{field}</span>
        <span className={`text-sm font-bold ${change <= 0 ? "text-emerald-300" : "text-amber-300"}`}>
          {change > 0 ? "+" : ""}
          {change.toFixed(1)} {unit} since {pts[0].date}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${field} trend from ${vals[0]} to ${vals[vals.length - 1]} ${unit}`}>
        <defs>
          <linearGradient id={`g-${field}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity=".35" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1="30" x2={W - 20} y1={15 + t * (H - 40)} y2={15 + t * (H - 40)} stroke="#1d3a57" />
            <text x="0" y={19 + t * (H - 40)} fill="#7f97ad" fontSize="11">
              {(max - t * (max - min)).toFixed(0)}
            </text>
          </g>
        ))}
        <path d={`${d} L${x(pts.length - 1)},${H - 25} L${x(0)},${H - 25}Z`} fill={`url(#g-${field})`} />
        <path d={d} stroke={color} strokeWidth="3" fill="none" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={p.date} cx={x(i)} cy={y(p[field])} r="4" fill={color}>
            <title>{`${p.date}: ${p[field]} ${unit}`}</title>
          </circle>
        ))}
      </svg>
    </figure>
  );
}

export function ProgressTracker() {
  const [entries, setEntries] = useStored<Entry[]>("rfc-progress", []);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), weight: "", waist: "" });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const entry = { date: form.date, weight: Number(form.weight) || 0, waist: Number(form.waist) || 0 };
    if (!entry.weight && !entry.waist) return;
    setEntries((list) => [...list.filter((x) => x.date !== entry.date), entry].sort((a, b) => a.date.localeCompare(b.date)));
    setForm({ ...form, weight: "", waist: "" });
  };

  const csv = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([["date,weight_kg,waist_cm", ...entries.map((e) => `${e.date},${e.weight},${e.waist}`)].join("\n")], { type: "text/csv" }));
    a.download = "my-progress.csv";
    a.click();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <form onSubmit={add} className="glass brand-border h-fit space-y-4 rounded-3xl p-6">
        <h2 className="font-display text-2xl text-white">Log a check-in</h2>
        <label className="block text-sm">
          <span className="text-white/65">Date</span>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="field mt-1" required />
        </label>
        <label className="block text-sm">
          <span className="text-white/65">Weight (kg)</span>
          <input type="number" step="0.1" inputMode="decimal" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="field mt-1" placeholder="e.g. 78.4" />
        </label>
        <label className="block text-sm">
          <span className="text-white/65">Waist (cm)</span>
          <input type="number" step="0.5" inputMode="decimal" value={form.waist} onChange={(e) => setForm({ ...form, waist: e.target.value })} className="field mt-1" placeholder="e.g. 88" />
        </label>
        <button type="submit" className="btn-brand w-full rounded-full py-3 font-bold">
          Save check-in
        </button>
        <p className="text-xs text-white/45">Weigh in the morning after the washroom, before eating. Saved only on this device.</p>
      </form>
      <div className="space-y-6">
        <div className="glass rounded-3xl p-6">
          <Chart entries={entries} field="weight" color="#e8394b" unit="kg" />
        </div>
        <div className="glass rounded-3xl p-6">
          <Chart entries={entries} field="waist" color="#7cc0ee" unit="cm" />
        </div>
        {entries.length > 0 && (
          <div className="glass rounded-3xl p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-white">History</h3>
              <button type="button" onClick={csv} className="inline-flex items-center gap-1.5 text-sm text-brand">
                <Download className="h-4 w-4" /> CSV
              </button>
            </div>
            <ul className="divide-y divide-white/5 text-sm">
              {[...entries].reverse().map((e) => (
                <li key={e.date} className="flex items-center justify-between py-2">
                  <span className="text-white/70">{e.date}</span>
                  <span className="text-white">
                    {e.weight ? `${e.weight} kg` : "—"} · {e.waist ? `${e.waist} cm` : "—"}
                  </span>
                  <button type="button" onClick={() => setEntries((l) => l.filter((x) => x.date !== e.date))} className="text-red-300/70" aria-label={`Delete ${e.date}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
