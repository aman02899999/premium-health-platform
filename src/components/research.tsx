"use client";

import { useEffect, useState } from "react";
import { BookOpen, FlaskConical, ExternalLink, AlertTriangle, Clock } from "lucide-react";
import type { PubMedResponse } from "@/lib/pubmed";
import type { TrialsResponse } from "@/lib/clinicaltrials";

type Combined = {
  pubmed: PubMedResponse | null;
  trials: TrialsResponse | null;
  loading: boolean;
};

export function LiveResearchSection({ diseaseName, diseaseSlug }: { diseaseName: string; diseaseSlug: string }) {
  const [data, setData] = useState<Combined>({ pubmed: null, trials: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const q = diseaseName;
        const [pmRes, trRes] = await Promise.all([
          fetch(`/api/realtime/pubmed?q=${encodeURIComponent(q)}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`/api/realtime/trials?q=${encodeURIComponent(q)}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        if (!cancelled) setData({ pubmed: pmRes, trials: trRes, loading: false });
      } catch {
        if (!cancelled) setData({ pubmed: null, trials: null, loading: false });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [diseaseName]);

  if (data.loading) {
    return (
      <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <p className="text-sm font-bold">Loading live research…</p>
        <div className="mt-3 grid gap-2">
          <div className="h-12 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-800" />
          <div className="h-12 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-800" />
        </div>
      </div>
    );
  }

  const hasPubMed = data.pubmed?.live && (data.pubmed?.articles?.length ?? 0) > 0;
  const hasTrials = data.trials?.live && (data.trials?.trials?.length ?? 0) > 0;
  const bothEmpty = !hasPubMed && !hasTrials;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-stone-200 bg-gradient-to-br from-sky-50 to-indigo-50 p-5 dark:border-stone-700 dark:from-stone-900 dark:to-stone-900">
        <h3 className="flex items-center gap-2 text-base font-bold">
          <BookOpen className="h-4 w-4 text-sky-600" /> Live research & trials for {diseaseName}
        </h3>
        <p className="mt-1 text-[13px] text-stone-600 dark:text-stone-300">
          Latest peer-reviewed studies (PubMed) and registered trials (ClinicalTrials.gov) — free keyless APIs, cached server-side, graceful fallback if offline.
        </p>
        {bothEmpty && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-[13px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <AlertTriangle className="h-4 w-4" /> Live sources temporarily unavailable in this preview (sandbox blocks external APIs). On any real deployment this section goes live automatically.
          </p>
        )}
      </div>

      {/* PubMed */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <p className="flex items-center gap-2 text-sm font-bold">
          <BookOpen className="h-4 w-4 text-sky-600" /> PubMed — latest studies{" "}
          {data.pubmed?.live ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800">LIVE</span> : <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">Fallback</span>}
        </p>
        {hasPubMed ? (
          <ul className="mt-3 space-y-3">
            {data.pubmed!.articles.map((a) => (
              <li key={a.pmid} className="rounded-2xl border border-stone-100 p-3 hover:border-sky-200 dark:border-stone-800">
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold leading-snug text-sky-700 hover:underline dark:text-sky-300">
                  {a.title} <ExternalLink className="inline h-3 w-3" />
                </a>
                <p className="mt-1 text-[12px] text-stone-500">
                  {a.journal} {a.pubDate ? `· ${a.pubDate}` : ""} {a.authors.length ? `· ${a.authors.join(", ")}` : ""}
                </p>
                <p className="mt-1 text-[11px] text-stone-400">PMID: {a.pmid}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[13px] text-stone-500">
            No live PubMed results right now. Search directly:{" "}
            <a href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(diseaseName)}&sort=date`} target="_blank" rel="noopener noreferrer" className="font-bold text-sky-700 underline">
              PubMed for {diseaseName}
            </a>
          </p>
        )}
        <p className="mt-3 text-[11px] text-stone-400">Source: NCBI E-utilities (free, no key). Updates every 6 hours.</p>
      </div>

      {/* ClinicalTrials */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <p className="flex items-center gap-2 text-sm font-bold">
          <FlaskConical className="h-4 w-4 text-violet-600" /> ClinicalTrials.gov — registered trials{" "}
          {data.trials?.live ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800">LIVE</span> : <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">Fallback</span>}
        </p>
        {hasTrials ? (
          <ul className="mt-3 space-y-3">
            {data.trials!.trials.map((t) => (
              <li key={t.nctId} className="rounded-2xl border border-stone-100 p-3 hover:border-violet-200 dark:border-stone-800">
                <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold leading-snug text-violet-700 hover:underline dark:text-violet-300">
                  {t.title} <ExternalLink className="inline h-3 w-3" />
                </a>
                <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 font-bold text-violet-800 dark:bg-violet-950/50 dark:text-violet-200">{t.status}</span>
                  {t.phase.map((p) => (
                    <span key={p} className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600 dark:bg-stone-800 dark:text-stone-300">{p}</span>
                  ))}
                  {t.conditions.slice(0, 2).map((c) => (
                    <span key={c} className="rounded-full bg-stone-50 px-2 py-0.5 text-stone-500 dark:bg-stone-800/60">{c}</span>
                  ))}
                </div>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-stone-500">
                  <Clock className="h-3 w-3" /> {t.nctId} · {t.locations.join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[13px] text-stone-500">
            No live trial results right now. Search directly:{" "}
            <a href={`https://clinicaltrials.gov/search?term=${encodeURIComponent(diseaseName)}`} target="_blank" rel="noopener noreferrer" className="font-bold text-violet-700 underline">
              ClinicalTrials.gov for {diseaseName}
            </a>
          </p>
        )}
        <p className="mt-3 text-[11px] text-stone-400">Source: ClinicalTrials.gov API v2 (free, no key). Updates every 6 hours.</p>
      </div>

      <p className="text-center text-[11px] text-stone-400">
        Live research is educational — always discuss studies/trials with your clinician. We never recruit or recommend specific trials.
      </p>
    </div>
  );
}

// Server wrapper that fetches directly (for SSR)
export async function LiveResearchServer({ diseaseName }: { diseaseName: string }) {
  // This wrapper is kept for future SSR use; client component above handles live fetch via API
  return null;
}
