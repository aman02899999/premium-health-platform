"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, CalendarDays, CheckCircle2, Clock, Globe2, Radio, Rss, Search, ShieldCheck,
} from "lucide-react";
import type { NewsItem } from "@/types";
import { NEWS_CATEGORIES } from "@/data/news";
import { Breadcrumbs, KeyTakeaway, AdSlot } from "@/components/ui";
import { cn, formatDate } from "@/lib/format";
import { SITE } from "@/lib/site";

const KIND_META: Record<NewsItem["kind"], { label: string; cls: string }> = {
  briefing: { label: "BHG Daily Briefing", cls: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100" },
  advisory: { label: "Public-Health Advisory", cls: "bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100" },
  digest: { label: "Evidence Digest", cls: "bg-sky-100 text-sky-900 dark:bg-sky-900/60 dark:text-sky-100" },
};

/** Live relative time — mounted-only to avoid hydration mismatch. */
function RelTime({ iso }: { iso: string }) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    const compute = () => {
      const diff = Date.now() - new Date(iso).getTime();
      const mins = Math.round(diff / 60000);
      if (mins < 60) setLabel(`${Math.max(1, mins)} min ago`);
      else if (mins < 60 * 24) setLabel(`${Math.round(mins / 60)} h ago`);
      else setLabel(`${Math.round(mins / (60 * 24))} d ago`);
    };
    compute();
    const t = setInterval(compute, 60000);
    return () => clearInterval(t);
  }, [iso]);
  return <span className="tabular-nums">{label ?? formatDate(iso)}</span>;
}

export default function NewsClient({ items, todayKey, initialCat = "All" }: { items: NewsItem[]; todayKey: string; initialCat?: string }) {
  const [cat, setCat] = useState<string>(NEWS_CATEGORIES.includes(initialCat as never) ? initialCat : "All");
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      items.filter((n) => {
        if (cat !== "All" && n.category !== cat) return false;
        if (q && !`${n.title} ${n.summary} ${n.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [items, cat, q]
  );
  const top = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Health News" }]} />

      {/* Masthead */}
      <div className="hero-pattern mt-3 overflow-hidden rounded-3xl border border-emerald-100 p-6 md:p-8 dark:border-stone-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600">
              <Radio className="h-4 w-4 animate-pulse" /> {SITE.name} Newsroom · Updated daily at 06:30 IST
            </p>
            <h1 className="font-display mt-2 text-3xl font-black md:text-[2.6rem]">Health News & Daily Briefings</h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">
              Responsible medical news: prevention, risk reduction, safety alerts and evidence digests — with clear sources and
              no cure claims. Emergency symptoms always need immediate care, not a news article.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white/80 p-4 text-center dark:border-stone-700 dark:bg-stone-900/70">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Today&apos;s edition</p>
            <p className="font-display text-2xl font-black text-emerald-800 dark:text-emerald-300">{formatDate(todayKey + "T00:00:00+05:30")}</p>
            <Link href="/news/rss.xml" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-stone-500 hover:text-emerald-700"><Rss className="h-3 w-3" /> RSS feed</Link>
          </div>
        </div>

        {/* Ticker */}
        {items.length > 0 && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white/85 py-2 backdrop-blur dark:border-stone-700 dark:bg-stone-900/80">
            <div className="news-ticker flex w-max gap-8 whitespace-nowrap px-4">
              {[...items, ...items].map((n, i) => (
                <Link key={n.slug + i} href={`/news/${n.slug}`} className="flex items-center gap-2 text-[13px] font-medium text-stone-700 hover:text-emerald-700 dark:text-stone-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{n.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-stone-200 bg-white/90 px-4 py-2.5 dark:border-stone-700 dark:bg-stone-900/90">
            <Search className="h-4 w-4 text-emerald-700" />
            <label htmlFor="news-q" className="sr-only">Search news</label>
            <input id="news-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search advisories, outbreaks, drug safety, AYUSH…" className="w-full bg-transparent text-sm outline-none" />
          </div>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
            {["All", ...NEWS_CATEGORIES].map((c) => (
              <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition", cat === c ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-200 bg-white/80 text-stone-600 hover:border-emerald-300 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300")}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-stone-500 dark:text-stone-400" role="status">{filtered.length} item{filtered.length === 1 ? "" : "s"} in view · newest first</p>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed p-10 text-center text-sm text-stone-500">
          No news items match. <button onClick={() => { setQ(""); setCat("All"); }} className="font-bold text-emerald-700 underline">Clear filters</button>
        </div>
      ) : (
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {top && (
              <article className="card-3d rounded-3xl border-2 border-emerald-200 bg-white p-6 dark:border-emerald-800 dark:bg-stone-900">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                  <span className={cn("rounded-full px-2.5 py-1", KIND_META[top.kind].cls)}>{KIND_META[top.kind].label}</span>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-600 dark:bg-stone-800 dark:text-stone-300">{top.category}</span>
                  <span className="flex items-center gap-1 text-stone-400"><Clock className="h-3 w-3" /><RelTime iso={top.publishedAt} /></span>
                </div>
                <h2 className="font-display mt-3 text-2xl font-black leading-tight md:text-3xl">
                  <Link href={`/news/${top.slug}`} className="hover:text-emerald-700 dark:hover:text-emerald-300">{top.title}</Link>
                </h2>
                <p className="mt-2 leading-relaxed text-stone-600 dark:text-stone-300">{top.summary}</p>
                {top.keyTakeaways.length > 0 && (
                  <ul className="mt-3 grid gap-1.5 sm:grid-cols-3">
                    {top.keyTakeaways.map((k) => <li key={k} className="flex gap-1.5 text-[13px] text-stone-600 dark:text-stone-300"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />{k}</li>)}
                  </ul>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-xs text-stone-500"><Globe2 className="h-3.5 w-3.5" />{top.sourceName}</p>
                  <Link href={`/news/${top.slug}`} className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600">Read full briefing →</Link>
                </div>
              </article>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {rest.map((n) => (
                <article key={n.slug} className="card-3d flex flex-col rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                    <span className={cn("rounded-full px-2 py-0.5", KIND_META[n.kind].cls)}>{KIND_META[n.kind].label}</span>
                    <span className="text-stone-400">{n.category}</span>
                  </div>
                  <h3 className="font-display mt-2 text-lg font-bold leading-snug">
                    <Link href={`/news/${n.slug}`} className="hover:text-emerald-700 dark:hover:text-emerald-300">{n.title}</Link>
                  </h3>
                  <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{n.summary}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-[11px] text-stone-500 dark:border-stone-800">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /><RelTime iso={n.publishedAt} /></span>
                    <Link href={`/news/${n.slug}`} className="font-bold text-emerald-700 dark:text-emerald-300">Read →</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/50">
              <p className="flex items-center gap-2 text-sm font-bold text-red-800 dark:text-red-200"><AlertTriangle className="h-4 w-4" /> Medical emergencies</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-red-900 dark:text-red-100">Chest pain, severe breathlessness, sudden weakness or speech trouble, uncontrolled bleeding, loss of consciousness: call emergency services or reach the nearest hospital immediately. News articles are never a substitute.</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500">How we report</p>
              <ul className="mt-2 space-y-2 text-[13px] text-stone-600 dark:text-stone-300">
                <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Evergreen public-health guidance, not invented events or fake statistics.</li>
                <li className="flex gap-2"><Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />Every item names its source type so you can verify it.</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Medical review is required before publication of sensitive items.</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-800 p-4 text-white">
              <p className="text-sm font-bold">Get the briefing by email</p>
              <p className="mt-1 text-xs text-emerald-100/85">“{SITE.name} Weekly” collects the week&apos;s advisories in one Sunday email.</p>
              <Link href="/#newsletter" className="mt-2 inline-block rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25">Subscribe →</Link>
            </div>
            <AdSlot slot="News sidebar" />
            <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Browse by topic</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[["Diabetes", "/diseases/type-2-diabetes"], ["Thyroid", "/diseases/hypothyroidism"], ["Dengue care", "/diseases/fever"], ["Drug safety", "/medicines"], ["Lab tests", "/lab-tests"], ["Ayurveda", "/ayurveda"]].map(([l, h]) => (
                  <Link key={h} href={h} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold hover:bg-emerald-100 dark:bg-stone-800">{l}</Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      <div className="mt-8">
        <KeyTakeaway points={[
          "Daily briefings rotate automatically — check back each morning at 06:30 IST.",
          "Advisories describe prevention and when to seek care, never individual treatment.",
          "Verify anything surprising against the named source before acting.",
        ]} />
      </div>
    </div>
  );
}
