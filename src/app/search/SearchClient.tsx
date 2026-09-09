"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { searchAll } from "@/lib/search-index";
import { Breadcrumbs } from "@/components/ui";

export default function SearchClient({ initial, examples }: { initial: string; examples: string[] }) {
  const [q, setQ] = useState(initial);
  const results = useMemo(() => searchAll(q, 24), [q]);
  const groups = useMemo(() => {
    const m = new Map<string, typeof results>();
    for (const r of results) {
      if (!m.has(r.type)) m.set(r.type, []);
      m.get(r.type)!.push(r);
    }
    return [...m.entries()];
  }, [results]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
      <h1 className="font-display mt-3 text-3xl font-black">Search health topics</h1>
      <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-4 flex items-center gap-2 rounded-2xl border border-stone-200 bg-white p-2 pl-4 shadow-sm dark:border-stone-700 dark:bg-stone-900">
        <Search className="h-5 w-5 text-emerald-700" />
        <label htmlFor="search-q" className="sr-only">Search</label>
        <input id="search-q" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try sugar, thyroid, methi, HbA1c…" className="h-11 w-full bg-transparent text-[15px] outline-none" />
      </form>
      {!q && (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Example searches</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {examples.map((e) => <button key={e} onClick={() => setQ(e)} className="rounded-full border px-3.5 py-1.5 text-[13px] font-semibold hover:border-emerald-300 hover:bg-emerald-50 dark:border-stone-700">{e}</button>)}
          </div>
        </div>
      )}
      {q && <p className="mt-4 text-sm text-stone-600 dark:text-stone-300" role="status">{results.length} results for “{q}”</p>}
      {q && results.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed p-10 text-center text-sm text-stone-500">No results. Try simpler terms: “sugar”, “BP”, “thyroid”, “haldi”, “HbA1c”. Or browse <Link href="/diseases" className="font-bold text-emerald-700 underline">diseases</Link>.</div>
      )}
      <div className="mt-6 space-y-8">
        {groups.map(([type, items]) => (
          <section key={type}>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-stone-500">{type}s</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((r) => (
                <Link key={r.href} href={r.href} className="rounded-2xl border border-stone-200 bg-white p-4 hover:border-emerald-300 dark:border-stone-700 dark:bg-stone-900">
                  <h3 className="font-bold leading-snug">{r.title}</h3>
                  {r.hindi && <p className="text-xs text-stone-500">{r.hindi}</p>}
                  <p className="mt-1 line-clamp-2 text-[13px] text-stone-600 dark:text-stone-300">{r.desc}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
