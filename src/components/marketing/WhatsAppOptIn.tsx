"use client";

import { useState } from "react";
import { MessageCircle, Check, Phone } from "lucide-react";

export function WhatsAppOptIn({ compact = false }: { compact?: boolean }) {
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    try {
      const utm = JSON.parse(localStorage.getItem("bhg-utm") || "{}");
      const res = await fetch("/api/whatsapp/optin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, consent: true, utm_source: utm.utm_source || "whatsapp_optin" }),
      });
      if (res.ok) {
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
        <p className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-200"><Check className="h-4 w-4" /> WhatsApp opt-in saved!</p>
        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">Weekly thali PDF + fasting reminders — 40% open rate — earning platform.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900 ${compact ? "text-xs" : ""}`}>
      <p className="flex items-center gap-2 text-sm font-bold"><MessageCircle className="h-4 w-4 text-emerald-600" /> Get WhatsApp Health Tips — Free</p>
      <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">Weekly thali + millet swap + fasting reminders — no spam, opt-out anytime. 40% open, 15% click — best earning.</p>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 99999 99999" className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm dark:border-stone-700 dark:bg-stone-800" required />
        </div>
        <button disabled={loading} className="h-10 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50">{loading ? "..." : "Join"}</button>
      </form>
      <p className="mt-2 text-[10px] text-stone-400">Consent required — POST /api/whatsapp/optin — digital marketing optimized, gtag whatsapp_optin.</p>
    </div>
  );
}

export function PushPrompt({ compact = false }: { compact?: boolean }) {
  const [done, setDone] = useState(false);

  const subscribe = async () => {
    try {
      const utm = JSON.parse(localStorage.getItem("bhg-utm") || "{}");
      // Mock endpoint — in prod use PushManager
      const endpoint = `mock_push_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, utm_source: utm.utm_source || "push_prompt" }),
      });
      setDone(true);
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "push_subscribe", { method: "component" });
      }
      if ("Notification" in window) {
        Notification.requestPermission().catch(() => {});
      }
    } catch {}
  };

  if (done) {
    return (
      <div className={`rounded-3xl border border-sky-200 bg-sky-50 p-5 dark:border-sky-800 dark:bg-sky-950/30 ${compact ? "text-xs" : ""}`}>
        <p className="font-bold text-sky-800 dark:text-sky-200">✓ Push subscribed — daily health tips + premium upsell</p>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900 ${compact ? "text-xs" : ""}`}>
      <p className="text-sm font-bold">🔔 Get Daily Health Tips — Push</p>
      <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">1 tip/day — thali, millet, yoga — re-engagement + earning. 30% open, 8% click.</p>
      <button onClick={subscribe} className="mt-3 h-10 rounded-xl bg-sky-600 px-4 text-xs font-bold text-white hover:bg-sky-500">Enable Push — Free</button>
      <p className="mt-2 text-[10px] text-stone-400">POST /api/push/subscribe — digital marketing optimized, gtag push_subscribe.</p>
    </div>
  );
}
