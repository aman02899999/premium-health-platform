"use client";

import { useMemo, useState } from "react";
import { Search, Leaf } from "lucide-react";
import type { Herb } from "@/types";
import { Breadcrumbs, TopicCard, EvidenceBadge, SafetyNote, AdSlot } from "@/components/ui";

export default function HerbsClient({ herbs }: { herbs: Herb[] }) {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("All");
  const filtered = useMemo(() => herbs.filter((h) => {
    if (level !== "All" && h.evidenceLevel !== level) return false;
    if (q && !`${h.name} ${h.hindiName} ${h.botanicalName} ${h.short}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [herbs, q, level]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Herbs" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-lime-900 via-emerald-900 to-teal-900 p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-black md:text-4xl">Herb Database</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">Traditional uses meet honest evidence grades. Every herb shows safety, interactions, pregnancy notes and quality checks. Never presented as guaranteed cures.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-2xl bg-white p-2 pl-4 dark:bg-stone-900">
            <Search className="h-4 w-4 text-emerald-700" />
            <label htmlFor="herb-q" className="sr-only">Search herbs</label>
            <input id="herb-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try ashwagandha, haldi, methi, giloy…" className="w-full bg-transparent text-sm text-stone-900 outline-none dark:text-stone-100" />
          </div>
          <select aria-label="Evidence level" value={level} onChange={(e) => setLevel(e.target.value)} className="h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-[13px] font-medium">
            {["All", "strong", "moderate", "limited", "mixed", "insufficient"].map((l) => <option key={l} value={l} className="text-stone-900">{l === "All" ? "All evidence levels" : l}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-4"><SafetyNote text="Herbs can interact with diabetes, BP, thyroid and blood-thinner medicines and harm liver/kidney in some people. Inform both your doctor and Ayurvedic practitioner about everything you take." /></div>
      <p className="mt-4 text-sm text-stone-600 dark:text-stone-300" role="status">{filtered.length} herbs</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((h) => (
          <TopicCard key={h.slug} href={`/herbs/${h.slug}`} title={h.name} hindi={`${h.hindiName} · ${h.botanicalName}`} desc={h.short} icon={<Leaf className="h-5 w-5" />} badge={<EvidenceBadge level={h.evidenceLevel} />} />
        ))}
      </div>
      <div className="mt-8"><AdSlot slot="Directory footer" /></div>
    </div>
  );
}
