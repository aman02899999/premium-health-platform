"use client";

import { useState } from "react";
import { Search, Languages } from "lucide-react";

const ALIASES: Record<string, string[]> = {
  diabetes: ["madhumeh", "sugar", "cheeni ki bimari"],
  hypertension: ["high bp", "ucch raktchaap", "bp badhna"],
  thyroid: ["thyroid", "gale ki granthi", "hypothyroid"],
  ashwagandha: ["ashvagandha", "asgandh", "withania"],
  turmeric: ["haldi", "curcumin", "haridra"],
  ragi: ["ragi", "nachni", "mandua", "finger millet"],
  tulsi: ["tulsi", "holy basil", "vrinda"],
};

export function HinglishSearch() {
  const [q, setQ] = useState("madhumeh diet");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/health/search?q=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  // Show alias expansion
  const expanded = (() => {
    const lower = q.toLowerCase();
    for (const [en, aliases] of Object.entries(ALIASES)) {
      if (aliases.some((a) => lower.includes(a)) || lower.includes(en)) {
        return { en, aliases };
      }
    }
    return null;
  })();

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Languages className="h-4 w-4 text-indigo-600" /> Hinglish Search — Unique India</h3>
      <p className="mt-1 text-[11px] text-stone-500">Search in EN/HI/Hinglish: madhumeh, high bp, haldi, ragi — aliases mapped to English medical terms. Educational.</p>

      <div className="mt-3 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try: madhumeh diet, high bp gharelu, haldi benefits" className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800" />
        <button onClick={search} disabled={loading} className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-bold text-white"><Search className="mr-1 inline h-4 w-4" /> {loading ? "…" : "Search"}</button>
      </div>

      {expanded && <p className="mt-2 rounded-xl bg-indigo-50 p-2 text-[12px] dark:bg-indigo-950/30">Detected: <strong>{expanded.en}</strong> — also known as {expanded.aliases.join(", ")} — searching English index.</p>}

      {results && (
        <div className="mt-3 rounded-2xl bg-stone-50 p-3 dark:bg-stone-800/60">
          <p className="text-xs font-bold">Unified results for &quot;{results.query}&quot; — {results.total} items from {results.sources?.join(", ")}</p>
          <div className="mt-2 grid gap-2 text-[12px]">
            {Object.entries(results.categories ?? {}).map(([cat, items]: any) => (
              <div key={cat}><p className="font-bold capitalize">{cat}: {items.length}</p><p className="text-stone-600 dark:text-stone-300">{items.slice(0, 2).map((i: any) => i.name ?? i.title ?? i.id).join(" · ")}</p></div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 text-[11px] text-stone-400">Future: full transliteration + Indic NLP. Current: alias map + English normalization. Covers diabetes, BP, thyroid, herbs, millets.</p>
    </div>
  );
}
