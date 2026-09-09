"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUp, Bookmark, Check, Lightbulb, Printer, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/format";

/* ---------- Back to top ---------- */
export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-700 text-white shadow-xl transition hover:bg-emerald-600 lg:bottom-8"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

/* ---------- Reading progress ---------- */
export function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setPct(total > 0 ? Math.min(100, Math.round((el.scrollTop / total) * 100)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-transparent" aria-hidden>
      <div className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ---------- Bookmark (localStorage) ---------- */
const BOOK_KEY = "bhg-bookmarks-v1";
function readBookmarks(): string[] {
  try {
    return JSON.parse(localStorage.getItem(BOOK_KEY) || "[]");
  } catch {
    return [];
  }
}
export function useBookmarks() {
  const [marks, setMarks] = useState<string[]>([]);
  useEffect(() => setMarks(readBookmarks()), []);
  const toggle = useCallback((slug: string) => {
    setMarks((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      try {
        localStorage.setItem(BOOK_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);
  return { marks, toggle };
}

export function BookmarkButton({ slug, title }: { slug: string; title: string }) {
  const { marks, toggle } = useBookmarks();
  const saved = marks.includes(slug);
  return (
    <button
      onClick={() => toggle(slug)}
      aria-pressed={saved}
      aria-label={saved ? `Remove bookmark: ${title}` : `Bookmark: ${title}`}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition",
        saved
          ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-200"
          : "border-stone-200 text-stone-600 hover:border-amber-300 dark:border-stone-700 dark:text-stone-300"
      )}
    >
      <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-amber-400 text-amber-500")} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}

/* ---------- Helpful vote ---------- */
export function HelpfulVote({ slug }: { slug: string }) {
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  useEffect(() => {
    try {
      const v = localStorage.getItem(`bhg-vote-${slug}`);
      if (v === "up" || v === "down") setVoted(v);
    } catch { /* ignore */ }
  }, [slug]);
  const vote = (v: "up" | "down") => {
    setVoted(v);
    try {
      localStorage.setItem(`bhg-vote-${slug}`, v);
    } catch { /* ignore */ }
  };
  if (voted) {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3.5 text-sm font-medium text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
        <Check className="h-4 w-4" /> Thanks — your feedback helps us improve this guide.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-white p-3.5 dark:border-stone-700 dark:bg-stone-900">
      <span className="text-sm font-semibold">Was this guide helpful?</span>
      <button onClick={() => vote("up")} aria-label="Yes, helpful" className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-600"><ThumbsUp className="h-3.5 w-3.5" /> Yes</button>
      <button onClick={() => vote("down")} aria-label="No, needs improvement" className="flex items-center gap-1.5 rounded-xl border border-stone-200 px-3.5 py-1.5 text-xs font-bold hover:border-stone-300 dark:border-stone-700"><ThumbsDown className="h-3.5 w-3.5" /> Needs work</button>
    </div>
  );
}

/* ---------- Print ---------- */
export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 rounded-full border border-stone-200 px-3.5 py-1.5 text-xs font-bold text-stone-600 hover:border-emerald-300 dark:border-stone-700 dark:text-stone-300"
    >
      <Printer className="h-3.5 w-3.5" /> Print
    </button>
  );
}

/* ---------- Table of contents with scroll-spy ---------- */
export function TableOfContents({ headings }: { headings: { id: string; label: string }[] }) {
  const [active, setActive] = useState<string>("");
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [headings]);
  return (
    <nav aria-label="On this page" className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">On this page</p>
      <ul className="space-y-0.5">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={cn(
                "block rounded-lg px-2.5 py-1.5 text-[13px] leading-snug transition",
                active === h.id
                  ? "bg-emerald-50 font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
                  : "text-stone-600 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-800"
              )}
            >
              {h.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ---------- Health tip of the day (deterministic rotation) ---------- */
const TIPS = [
  { tip: "Walk 10–15 minutes after each meal — post-meal walks blunt sugar spikes more than one long morning walk.", link: "/diseases/type-2-diabetes", label: "Diabetes guide" },
  { tip: "Measure one teaspoon of salt for the whole day's cooking — hidden salt in papad, pickle and bread adds up fast.", link: "/diseases/high-blood-pressure", label: "BP guide" },
  { tip: "Take levothyroxine with water only, 30–60 min before chai or breakfast — timing decides absorption.", link: "/medicines/levothyroxine", label: "Thyroid medicine" },
  { tip: "Pair iron foods with amla, lemon or guava — vitamin C doubles non-heme iron absorption.", link: "/diseases/anemia", label: "Anemia guide" },
  { tip: "Keep your waist under half your height — the single best belly-fat risk signal.", link: "/health-calculators", label: "Check ratio" },
  { tip: "Reliever inhaler needed more than twice a week? Your controller plan needs review, not more puffs.", link: "/diseases/asthma", label: "Asthma guide" },
  { tip: "Millets 4x a week instead of white rice cuts post-meal spikes while keeping the same bhat satisfaction.", link: "/nutrition/ragi-finger-millet", label: "Ragi guide" },
];

export function HealthTipOfDay() {
  const tip = useMemo(() => TIPS[new Date().getDate() % TIPS.length], []);
  return (
    <div className="flex gap-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:border-amber-800 dark:from-amber-950/40 dark:to-orange-950/20">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white"><Lightbulb className="h-4 w-4" /></span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Health tip of the day</p>
        <p className="mt-0.5 text-sm leading-relaxed text-stone-700 dark:text-stone-200">{tip.tip}</p>
        <Link href={tip.link} className="mt-1 inline-block text-xs font-bold text-emerald-700 underline">{tip.label} →</Link>
      </div>
    </div>
  );
}

/* ---------- Animated counter ---------- */
export function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1200);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="tabular-nums">{n}{suffix}</span>;
}
