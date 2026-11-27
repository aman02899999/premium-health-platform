"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Languages } from "lucide-react";
import { expandHinglish, hinglishSearch } from "@/health/lib/hinglish";
import type { SearchItem } from "@/health/lib/search-index";

const EXAMPLES = ["madhumeh", "high bp", "khoon ki kami", "haldi", "methi", "motapa"];

export function HinglishSearch() {
  const [q, setQ] = useState("madhumeh");
  const [asked, setAsked] = useState<string | null>(null);
  const [results, setResults] = useState<SearchItem[]>([]);

  const run = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setQ(t);
    setAsked(t);
    setResults(hinglishSearch(t, 12));
  };

  const expanded = asked ? expandHinglish(asked) : null;
  const groups = results.reduce<Record<string, SearchItem[]>>((m, r) => ((m[r.type] ??= []).push(r), m), {});

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Languages className="h-4 w-4 text-indigo-600" /> Hinglish Search</h3>
      <p className="mt-1 text-[11px] text-stone-500">Hindi, English ya Hinglish mein likhiye: madhumeh, high bp, haldi, khoon ki kami. We match it to the right guides on this site.</p>

      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); run(q); }}>
        <label htmlFor="hinglish-q" className="sr-only">Search in Hinglish</label>
        <input id="hinglish-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try: madhumeh, high bp, haldi" className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800" />
        <button type="submit" className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-bold text-white"><Search className="mr-1 inline h-4 w-4" /> Search</button>
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {EXAMPLES.map((e) => (
          <button key={e} type="button" onClick={() => run(e)} className="rounded-full border border-stone-200 px-2.5 py-1 text-[11px] font-semibold hover:border-indigo-300 dark:border-stone-700">{e}</button>
        ))}
      </div>

      {expanded?.term && <p className="mt-3 rounded-xl bg-indigo-50 p-2 text-[12px] dark:bg-indigo-950/30">“{asked}” = <strong className="capitalize">{expanded.term}</strong></p>}

      {asked && (
        <div className="mt-3 space-y-3" aria-live="polite">
          {results.length === 0 && <p className="text-sm text-stone-600 dark:text-stone-300">Kuch nahi mila. Try a simpler word like sugar, BP, thyroid or haldi.</p>}
          {Object.entries(groups).map(([type, items]) => (
            <div key={type}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{type}s</p>
              <div className="mt-1.5 grid gap-2">
                {items.slice(0, 4).map((r) => (
                  <Link key={r.href} href={r.href} className="rounded-xl border border-stone-200 bg-stone-50 p-3 hover:border-indigo-300 dark:border-stone-700 dark:bg-stone-800/60">
                    <p className="text-sm font-bold">{r.title}{r.hindi ? <span className="ml-1 font-normal text-stone-500">· {r.hindi}</span> : null}</p>
                    <p className="mt-0.5 line-clamp-2 text-[12px] text-stone-600 dark:text-stone-300">{r.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
