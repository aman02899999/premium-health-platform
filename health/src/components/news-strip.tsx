"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Radio, Clock } from "lucide-react";
import type { NewsItem } from "@/types";
import { cn, formatDate } from "@/lib/format";

/**
 * Homepage news strip — client-fetched so the homepage stays statically prerendered
 * while the newsroom feed remains daily-fresh.
 */
export function NewsStrip({ items: preloaded }: { items?: NewsItem[] }) {
  const [items, setItems] = useState<NewsItem[] | null>(preloaded ?? null);
  const [state, setState] = useState<"idle" | "loading" | "error">(preloaded ? "idle" : "loading");

  useEffect(() => {
    if (preloaded?.length) return;
    let alive = true;
    fetch("/api/news?limit=5")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad response"))))
      .then((d: { data: NewsItem[] }) => {
        if (!alive) return;
        setItems(d.data.slice(0, 5));
        setState("idle");
      })
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
  }, [preloaded]);

  return (
    <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900" aria-labelledby="news-strip">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-5 py-3 dark:border-stone-800">
        <p id="news-strip" className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-300">
          <Radio className="h-4 w-4 animate-pulse text-amber-500" /> Today in health news
        </p>
        <Link href="/news" className="flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-emerald-700">
          All briefings <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {state === "loading" && (
        <ul className="grid gap-px bg-stone-100 sm:grid-cols-2 lg:grid-cols-3 dark:bg-stone-800" aria-label="Loading news">
          {[1, 2, 3].map((i) => (
            <li key={i} className="bg-white p-4 dark:bg-stone-900">
              <div className="h-3 w-20 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
              <div className="mt-2 h-4 w-full animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
              <div className="mt-1.5 h-4 w-3/4 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
            </li>
          ))}
        </ul>
      )}

      {state === "error" && (
        <p className="p-5 text-sm text-stone-500">
          The newsroom feed is momentarily unavailable — our disease, herb and medicine guides still work.{" "}
          <Link href="/news" className="font-bold text-emerald-700 underline">Retry news page</Link>
        </p>
      )}

      {items && items.length > 0 && (
        <ul className="grid gap-px bg-stone-100 lg:grid-cols-3 sm:grid-cols-2 dark:bg-stone-800">
          {items.slice(0, 3).map((n) => (
            <li key={n.slug} className="bg-white p-4 transition hover:bg-emerald-50/60 dark:bg-stone-900 dark:hover:bg-stone-800/60">
              <Link href={`/news/${n.slug}`} className="block">
                <p className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", n.kind === "advisory" ? "bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100" : "bg-sky-100 text-sky-900 dark:bg-sky-900/60 dark:text-sky-100")}>{n.category}</p>
                <h3 className="mt-2 text-[15px] font-bold leading-snug text-stone-900 dark:text-stone-100">{n.title}</h3>
                <p className="mt-1 line-clamp-2 text-[13px] text-stone-600 dark:text-stone-300">{n.summary}</p>
                <p className="mt-2 flex items-center gap-1 text-[11px] text-stone-400"><Clock className="h-3 w-3" />{formatDate(n.publishedAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {items && items.length > 3 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-stone-100 px-5 py-2.5 dark:border-stone-800">
          {items.slice(3).map((n) => (
            <Link key={n.slug} href={`/news/${n.slug}`} className="flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-emerald-700 dark:text-stone-400">
              <span className="h-1 w-1 rounded-full bg-amber-500" />{n.title}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
