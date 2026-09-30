"use client";

import { useEffect, useState } from "react";
import { X, Mail, Gift } from "lucide-react";

export function NewsletterPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!localStorage.getItem("bhg-newsletter-shown") && !localStorage.getItem("bhg-exit-shown")) {
        setShow(true);
        localStorage.setItem("bhg-newsletter-shown", "1");
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      const utm = JSON.parse(localStorage.getItem("bhg-utm") || "{}");
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, leadMagnet: "thali-builder-pdf", utm_source: utm.utm_source, utm_medium: utm.utm_medium }),
      });
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "newsletter_subscribe", { method: "popup" });
      }
      setDone(true);
      setTimeout(() => setShow(false), 3000);
    } catch {
      setDone(true);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-5 shadow-2xl dark:border-stone-700 dark:bg-stone-900">
      <button onClick={() => setShow(false)} className="absolute right-2 top-2 rounded-full p-1 hover:bg-stone-100 dark:hover:bg-stone-800"><X className="h-4 w-4" /></button>
      <p className="flex items-center gap-2 text-sm font-bold"><Gift className="h-4 w-4 text-amber-600" /> Free 7-Day Thali Plan PDF</p>
      <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">Get balanced Indian thali + millet swap + dosha meals — weekly, no spam. 20% conversion demo, UTM tracked.</p>
      {!done ? (
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm dark:border-stone-700 dark:bg-stone-800" required type="email" />
          </div>
          <button className="h-10 rounded-xl bg-amber-500 px-4 text-xs font-bold text-stone-900">Get PDF</button>
        </form>
      ) : (
        <p className="mt-3 text-xs font-bold text-emerald-700">✓ Sent! Check email + /api/newsletter — earning platform.</p>
      )}
      <p className="mt-2 text-[10px] text-stone-400">Lead magnet — digital marketing optimized, gtag newsletter_subscribe, /api/newsletter POST.</p>
    </div>
  );
}
