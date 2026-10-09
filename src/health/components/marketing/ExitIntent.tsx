"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Gift } from "lucide-react";

export function ExitIntent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.clientY < 10 && !localStorage.getItem("bhg-exit-shown")) {
        setShow(true);
        localStorage.setItem("bhg-exit-shown", "1");
        if (typeof window !== "undefined" && (window as any).gtag) {
          (window as any).gtag("event", "exit_intent_shown");
        }
      }
    };
    document.addEventListener("mouseout", handler);
    return () => document.removeEventListener("mouseout", handler);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-stone-900">
        <button onClick={() => setShow(false)} className="absolute right-3 top-3 rounded-full p-1 hover:bg-stone-100 dark:hover:bg-stone-800"><X className="h-4 w-4" /></button>
        <p className="flex items-center gap-2 text-sm font-bold"><Gift className="h-4 w-4 text-amber-600" /> Before you go — free weekly health email</p>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">One short email a week: a seasonal health tip, an Indian meal idea and new tools. Free, unsubscribe any time.</p>
        <div className="mt-4 flex gap-2">
          <Link href="/health/newsletter" onClick={() => setShow(false)} className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-stone-900">Subscribe free</Link>
          <button onClick={() => setShow(false)} className="rounded-xl border px-5 py-2.5 text-sm font-bold">No thanks</button>
        </div>
        <p className="mt-2 text-[11px] text-stone-400"></p>
      </div>
    </div>
  );
}

export function StickyCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 800) setShow(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    // Desktop only: on phones the bottom navigation already links the tools, and a floating
    // pill there would cover the article being read.
    <div className="fixed bottom-4 left-1/2 z-40 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 shadow-xl lg:flex dark:border-stone-700 dark:bg-stone-900">
      <span className="whitespace-nowrap text-xs font-bold">Free health calculators — due date, BMI, calories</span>
      <Link href="/health/health-calculators" className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-stone-900">Open</Link>
    </div>
  );
}
