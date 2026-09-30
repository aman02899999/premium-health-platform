"use client";

import { useState } from "react";
import { Phone, Mail, User, Send, CheckCircle } from "lucide-react";

export function LeadGenForm({ type = "lab", title, description }: { type?: "lab" | "dietitian" | "insurance" | "consult"; title?: string; description?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const utm = (() => {
        try { return JSON.parse(localStorage.getItem("bhg-utm") || "{}"); } catch { return {}; }
      })();
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, phone, type, message, utm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDone(data.lead);
      // gtag
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "generate_lead", { lead_type: type, value: data.lead.estimatedValue });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
        <CheckCircle className="mx-auto h-8 w-8 text-emerald-600" />
        <p className="mt-2 text-sm font-bold">Lead captured — {done.type} — Rs {done.estimatedValue} value (demo)</p>
        <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">We will contact you within 24h at {done.email || done.phone}. ID {done.id}</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="text-sm font-bold">{title || `Book ${type} — Lead Gen Earning`}</h3>
      <p className="mt-1 text-[11px] text-stone-500">{description || `High ticket ${type} lead — Rs 150-500 value — digital marketing optimized with UTM + gtag.`}</p>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 dark:border-stone-700 dark:bg-stone-800">
          <User className="h-4 w-4 text-stone-400" />
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" className="w-full bg-transparent text-sm outline-none" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 dark:border-stone-700 dark:bg-stone-800">
            <Mail className="h-4 w-4 text-stone-400" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email (optional)" className="w-full bg-transparent text-sm outline-none" />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 dark:border-stone-700 dark:bg-stone-800">
            <Phone className="h-4 w-4 text-stone-400" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone 10 digits" className="w-full bg-transparent text-sm outline-none" />
          </div>
        </div>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message (e.g. HbA1c + thyroid, budget, city)" rows={3} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm dark:border-stone-700 dark:bg-stone-800" />
        {error && <p className="rounded-xl bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-950/30">{error}</p>}
        <button disabled={loading} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50">
          <Send className="h-4 w-4" /> {loading ? "Submitting…" : `Book ${type} — Free Callback`}
        </button>
        <p className="text-[11px] text-stone-400">By submitting you agree to be contacted. UTM + gtag tracked for earning optimization. Demo mode.</p>
      </form>
    </div>
  );
}
