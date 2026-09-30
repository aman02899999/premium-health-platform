"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity, AlertTriangle, ArrowRight, Brain, Droplets, FlaskConical,
  Leaf, Salad, Search, Siren, Sparkles, Stethoscope,
} from "lucide-react";
import { PILLARS, SOLUTION_FINDER, APPROACH_COMPARE } from "@/data/solutions";
import { DoctorBox } from "@/components/ui";
import { cn } from "@/lib/format";

const ICONS: Record<string, React.ReactNode> = {
  stethoscope: <Stethoscope className="h-5 w-5" />,
  sparkles: <Sparkles className="h-5 w-5" />,
  leaf: <Leaf className="h-5 w-5" />,
  salad: <Salad className="h-5 w-5" />,
  activity: <Activity className="h-5 w-5" />,
  brain: <Brain className="h-5 w-5" />,
  flask: <FlaskConical className="h-5 w-5" />,
  droplets: <Droplets className="h-5 w-5" />,
};

export default function SolutionsClient() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState<string | null>(SOLUTION_FINDER[0].condition);
  const cats = useMemo(() => ["All", ...Array.from(new Set(SOLUTION_FINDER.map((s) => s.category)))], []);
  const list = useMemo(
    () => SOLUTION_FINDER.filter((s) => (cat === "All" || s.category === cat) && (!q || `${s.condition} ${s.modern} ${s.nutrition}`.toLowerCase().includes(q.toLowerCase()))),
    [q, cat]
  );

  return (
    <div>
      {/* Pillars */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((p) => (
          <Link key={p.slug} href={p.href} className="card-3d group rounded-3xl border border-stone-200 bg-white p-5 hover:border-emerald-300 dark:border-stone-700 dark:bg-stone-900">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-600 text-white shadow-lg">{ICONS[p.icon]}</span>
            <h3 className="mt-3 font-bold group-hover:text-emerald-700">{p.name}</h3>
            <p className="text-xs text-stone-500">{p.hindi}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-stone-600 dark:text-stone-300">{p.tagline}</p>
            <p className="mt-2 inline-block rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-600 dark:bg-stone-800 dark:text-stone-300">{p.evidence}</p>
          </Link>
        ))}
      </div>

      {/* Finder */}
      <div className="mt-10 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-amber-50/50 p-5 md:p-7 dark:border-emerald-800 dark:from-stone-900 dark:to-stone-900">
        <h2 className="font-display text-2xl font-black md:text-3xl">Solution finder</h2>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">Pick a condition — see the modern, Ayurvedic, nutrition, lifestyle and testing path side by side, plus emergency red flags.</p>
        <div className="mt-4 flex flex-col gap-2 md:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 dark:border-stone-700 dark:bg-stone-900">
            <Search className="h-4 w-4 text-stone-400" />
            <span className="sr-only">Search conditions</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search diabetes, thyroid, migraine, UTI…" className="w-full bg-transparent text-sm outline-none" />
          </label>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold", cat === c ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900")}>{c}</button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-stone-500" role="status">{list.length} conditions</p>
        <div className="mt-3 space-y-2.5">
          {list.map((s) => {
            const isOpen = open === s.condition;
            return (
              <div key={s.condition} className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
                <button onClick={() => setOpen(isOpen ? null : s.condition)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                  <span>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-600">{s.category}</span>
                    <span className="block text-[15px] font-bold">{s.condition}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Link href={s.href} onClick={(e) => e.stopPropagation()} className="hidden rounded-xl bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 sm:block">Full guide <ArrowRight className="inline h-3 w-3" /></Link>
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-full border transition", isOpen ? "rotate-45 border-emerald-400 bg-emerald-50 text-emerald-700" : "text-stone-400")}>＋</span>
                  </span>
                </button>
                {isOpen && (
                  <div className="grid gap-2 border-t border-stone-100 p-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-stone-800">
                    {[
                      ["Modern medicine", s.modern, "bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-950/40 dark:text-sky-100 dark:border-sky-800"],
                      ["Ayurveda view", s.ayurveda, "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-100"],
                      ["Nutrition", s.nutrition, "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100"],
                      ["Lifestyle & yoga", s.lifestyle, "bg-teal-50 text-teal-900 border-teal-200 dark:bg-teal-950/40 dark:text-teal-100"],
                      ["Tests to discuss", s.tests, "bg-violet-50 text-violet-900 border-violet-200 dark:bg-violet-950/40 dark:text-violet-100"],
                    ].map(([t, v, cls]) => (
                      <div key={t as string} className={cn("rounded-2xl border p-3", cls as string)}>
                        <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">{t}</p>
                        <p className="mt-1 text-[13px] leading-relaxed">{v}</p>
                      </div>
                    ))}
                    {s.emergency && (
                      <div className="flex gap-2 rounded-2xl border-2 border-red-300 bg-red-50 p-3 text-[13px] font-semibold text-red-900 sm:col-span-2 lg:col-span-1 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100" role="alert">
                        <Siren className="mt-0.5 h-4 w-4 shrink-0" />{s.emergency}
                      </div>
                    )}
                    <Link href={s.href} className="rounded-2xl bg-stone-900 p-3 text-center text-[13px] font-bold text-white hover:bg-stone-700 sm:hidden">Open full guide →</Link>
                  </div>
                )}
              </div>
            );
          })}
          {list.length === 0 && <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-stone-500">No match — try “sugar”, “thyroid” or “pain”. <button onClick={() => { setQ(""); setCat("All"); }} className="font-bold text-emerald-700 underline">Reset</button></p>}
        </div>
      </div>

      {/* Compare */}
      <div className="mt-10 overflow-hidden rounded-3xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
        <div className="border-b border-stone-100 p-5 dark:border-stone-800">
          <h2 className="font-display text-2xl font-black">How approaches compare</h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">The safest path usually combines all three columns — with every practitioner informed.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead>
              <tr className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500 dark:bg-stone-800/60">
                <th className="p-4">Aspect</th><th className="p-4">Modern</th><th className="p-4">Ayurveda</th><th className="p-4">Lifestyle</th>
              </tr>
            </thead>
            <tbody>
              {APPROACH_COMPARE.map((r) => (
                <tr key={r.aspect} className="border-t border-stone-100 align-top dark:border-stone-800">
                  <td className="p-4 font-bold">{r.aspect}</td><td className="p-4">{r.modern}</td><td className="p-4">{r.ayurveda}</td><td className="p-4">{r.lifestyle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="flex gap-2.5 rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-[13px] font-medium text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p><strong>Emergency first:</strong> chest pain, severe breathlessness, stroke signs, heavy bleeding, loss of consciousness — call <strong>112</strong> or reach a hospital. No home system replaces emergency care.</p>
        </div>
        <DoctorBox points={["Symptoms persist 1–2 weeks despite basics", "You juggle multiple systems — get one doctor to coordinate", "Pregnancy, heart, kidney or liver disease changes every plan", "Any red flag listed in a finder card"]} />
      </div>
    </div>
  );
}
