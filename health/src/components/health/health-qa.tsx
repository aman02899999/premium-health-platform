"use client";

import { useState } from "react";
import { Search, BookOpen } from "lucide-react";

export function HealthQA() {
  const [q, setQ] = useState("diabetes diet millets");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const ask = async () => {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const res = await fetch("/api/health/qa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, lang: "en" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><BookOpen className="h-4 w-4 text-indigo-600" /> Health Q&A — Retrieval-First with Citations (Unique)</h3>
      <p className="mt-1 text-[11px] text-stone-500">RAG-like: searches PubMed, ClinicalTrials, Ayurveda DB, ICD-10, FDA — cites sources. No AI generation without citations. Educational.</p>

      <div className="mt-3 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask health question (e.g. diabetes millets, ashwagandha thyroid)" className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800" />
        <button onClick={ask} disabled={loading || !q.trim()} className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Search className="mr-1 inline h-4 w-4" /> {loading ? "…" : "Ask"}</button>
      </div>

      {err && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30">{err}</p>}

      {result && (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-950/30">
            <p className="text-sm font-bold">Answer (synthesized from retrieved docs)</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700 dark:text-stone-200">{result.answer}</p>
            <p className="mt-2 text-[11px] text-stone-500">Confidence: {result.confidence} · Duration: {result.durationMs}ms · Disclaimer: {result.disclaimer}</p>
          </div>

          <div>
            <p className="text-xs font-bold">Citations ({result.citations?.length ?? 0})</p>
            <div className="mt-1 space-y-1">
              {result.citations?.map((c: any, i: number) => (
                <div key={i} className="rounded-xl bg-stone-50 p-2 text-[12px] dark:bg-stone-800">
                  <p className="font-bold">{c.title ?? c.id} [{c.source}]</p>
                  {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="text-[11px] text-sky-600 underline">{c.url}</a>}
                  {c.snippet && <p className="mt-1 text-[11px] text-stone-600 dark:text-stone-300">{c.snippet}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
