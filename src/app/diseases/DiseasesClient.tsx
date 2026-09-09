"use client";

import { useMemo, useState } from "react";
import { Search, Stethoscope } from "lucide-react";
import type { DiseaseSummary } from "@/types";
import { Breadcrumbs, TopicCard, AdSlot, DisclaimerBar } from "@/components/ui";

export default function DiseasesClient({ diseases, systems, categories }: { diseases: DiseaseSummary[]; systems: string[]; categories: string[] }) {
  const [q, setQ] = useState("");
  const [system, setSystem] = useState("All");
  const [cat, setCat] = useState("All");
  const [course, setCourse] = useState("All");
  const [common, setCommon] = useState("All");

  const filtered = useMemo(() => {
    return diseases.filter((d) => {
      if (system !== "All" && d.system !== system) return false;
      if (cat !== "All" && d.category !== cat) return false;
      if (course === "Chronic" && !d.chronic) return false;
      if (course === "Acute" && d.chronic) return false;
      if (common === "Common" && !d.common) return false;
      if (common === "Less common" && d.common) return false;
      if (q && !`${d.name} ${d.hindiName || ""} ${d.short} ${d.symptoms.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [diseases, q, system, cat, course, common]);

  const sel = "h-10 rounded-xl border border-stone-200 bg-white px-3 text-[13px] font-medium dark:border-stone-700 dark:bg-stone-900";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Diseases" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-900 to-teal-800 p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-black md:text-4xl">Disease Directory</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">Understand {diseases.length} conditions — symptoms, risk factors, tests, treatment options, Ayurveda views, herbs, nutrition and emergency signs. Filter by system, course or search below.</p>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white p-2 pl-4 dark:bg-stone-900">
          <Search className="h-4 w-4 text-emerald-700" />
          <label htmlFor="disease-q" className="sr-only">Search diseases</label>
          <input id="disease-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try diabetes, thyroid, acidity, migraine…" className="w-full bg-transparent text-sm text-stone-900 outline-none dark:text-stone-100" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <select aria-label="Body system" value={system} onChange={(e) => setSystem(e.target.value)} className={sel}><option>All</option>{systems.map((s) => <option key={s}>{s}</option>)}</select>
          <select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)} className={sel}><option>All</option>{categories.map((s) => <option key={s}>{s}</option>)}</select>
          <select aria-label="Course" value={course} onChange={(e) => setCourse(e.target.value)} className={sel}>{["All", "Chronic", "Acute"].map((s) => <option key={s}>{s}</option>)}</select>
          <select aria-label="Frequency" value={common} onChange={(e) => setCommon(e.target.value)} className={sel}>{["All", "Common", "Less common"].map((s) => <option key={s}>{s}</option>)}</select>
        </div>
      </div>

      <p className="mt-6 text-sm text-stone-600 dark:text-stone-300" role="status">{filtered.length} condition{filtered.length === 1 ? "" : "s"} found</p>
      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed p-10 text-center text-sm text-stone-500">No conditions match. Try a simpler term like “sugar”, “BP” or “pain”. <button onClick={() => { setQ(""); setSystem("All"); setCat("All"); setCourse("All"); setCommon("All"); }} className="font-bold text-emerald-700 underline">Clear filters</button></div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <TopicCard key={d.slug} href={`/diseases/${d.slug}`} title={d.name} hindi={d.hindiName} desc={d.short} icon={<Stethoscope className="h-5 w-5" />} badge={<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">{d.chronic ? "Chronic" : "Episodic"}</span>} />
          ))}
        </div>
      )}
      <div className="mt-8 space-y-4"><AdSlot slot="Directory footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
