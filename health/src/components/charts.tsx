"use client";

import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const COLORS = ["#0b5c3f", "#e8930c", "#0e7490", "#65a30d", "#b45309", "#0d9488"];

export function RiskBarChart({ data, title, source }: { data: { name: string; value: number }[]; title: string; source: string }) {
  return (
    <figure className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
      <figcaption className="mb-1 text-sm font-bold text-stone-900 dark:text-stone-100">{title}</figcaption>
      <div className="h-56" role="img" aria-label={`${title}. Data: ${data.map((d) => `${d.name} ${d.value}`).join(", ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">Illustrative educational pattern. Source: {source}</p>
    </figure>
  );
}

export function NutrientDonut({ data, title, source }: { data: { name: string; value: number }[]; title: string; source: string }) {
  return (
    <figure className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
      <figcaption className="mb-1 text-sm font-bold text-stone-900 dark:text-stone-100">{title}</figcaption>
      <div className="h-56" role="img" aria-label={`${title}. Data: ${data.map((d) => `${d.name} ${d.value}`).join(", ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} label={{ fontSize: 11 }}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">Approximate values. Source: {source}</p>
    </figure>
  );
}

export function PlateVisual() {
  return (
    <figure className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
      <figcaption className="mb-3 text-sm font-bold text-stone-900 dark:text-stone-100">The Indian Diabetes Plate (visual guide)</figcaption>
      <div className="relative mx-auto h-48 w-48" role="img" aria-label="Half vegetables, quarter whole grains, quarter protein">
        <div className="absolute inset-0 overflow-hidden rounded-full border-4 border-stone-200 dark:border-stone-700">
          <div className="absolute inset-x-0 top-0 h-1/2 bg-emerald-500/80" />
          <div className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-amber-500/80" />
          <div className="absolute bottom-0 right-0 h-1/2 w-1/2 bg-teal-600/80" />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-[11px] font-bold text-white drop-shadow">
          <span>½ Vegetables</span>
          <span className="mt-6 flex gap-6"><span>¼ Grains</span><span>¼ Protein</span></span>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-stone-500 dark:text-stone-400">Eat in order: salad → protein → grains. Source: BHG editorial adaptation of plate-method guidance.</p>
    </figure>
  );
}

export function EvidenceStack({ items }: { items: { label: string; level: string; color: string; width: string }[] }) {
  return (
    <figure className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
      <figcaption className="mb-3 text-sm font-bold text-stone-900 dark:text-stone-100">Evidence strength at a glance</figcaption>
      <div className="space-y-2.5">
        {items.map((it) => (
          <div key={it.label}>
            <div className="mb-1 flex justify-between text-xs font-medium text-stone-600 dark:text-stone-300"><span>{it.label}</span><span>{it.level}</span></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
              <div className={`h-full rounded-full ${it.color} ${it.width}`} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-stone-500 dark:text-stone-400">Editorial visualisation of evidence grades discussed in the article. Always read the detailed sections.</p>
    </figure>
  );
}
