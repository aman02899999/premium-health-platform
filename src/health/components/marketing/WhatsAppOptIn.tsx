"use client";

import { useState } from "react";
import { MessageCircle, Check, Phone } from "lucide-react";

export function WhatsAppOptIn({ compact = false }: { compact?: boolean }) {
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    try {
      const utm = JSON.parse(localStorage.getItem("bhg-utm") || "{}");
      const res = await fetch("/health/api/whatsapp/optin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, consent: true, utm_source: utm.utm_source || "whatsapp_optin" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) setError(data.error || "Couldn't save your number. Please try again.");
      if (res.ok) {
        setError("");
        setDone(true);
        if (typeof window !== "undefined" && (window as any).gtag) {
          (window as any).gtag("event", "whatsapp_optin", { method: "component" });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className={`rounded-3xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/30 ${compact ? "text-xs" : ""}`}>
        <p className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-200"><Check className="h-4 w-4" /> You&apos;re on the list</p>
        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">We&apos;ll send health tips to this number on WhatsApp. Reply STOP at any time to opt out.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900 ${compact ? "text-xs" : ""}`}>
      <p className="flex items-center gap-2 text-sm font-bold"><MessageCircle className="h-4 w-4 text-emerald-600" /> Get WhatsApp Health Tips — Free</p>
      <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">Simple Indian diet and health tips on WhatsApp — no spam, opt out any time.</p>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 99999 99999" className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm dark:border-stone-700 dark:bg-stone-800" required />
        </div>
        <button disabled={loading} className="h-10 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50">{loading ? "..." : "Join"}</button>
      </form>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
      <p className="mt-2 text-[10px] text-stone-400">By joining you agree to receive health tips on WhatsApp. No spam; opt out any time.</p>
    </div>
  );
}
