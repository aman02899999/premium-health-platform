"use client";

import { useState } from "react";
import { trackMonetizationEvent, getAttributionFromUrl } from "@/lib/monetization/analytics";
import type { LeadFormConfig } from "@/lib/monetization/types";

export function LeadForm({ config, page = "/" }: { config: LeadFormConfig; page?: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: config.service, message: "", consent: false });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/monetization/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, formId: config.id, page, utm: getAttributionFromUrl() }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setDone(true);
        trackMonetizationEvent({ type: "lead_submitted", page, campaign: config.service, utm: getAttributionFromUrl() });
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/30">
        <p className="font-bold text-emerald-800 dark:text-emerald-200">✓ {config.successMessage}</p>
        <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">We minimize personal-data collection and never store unnecessary health information.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="font-bold">{config.title}</h3>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{config.description}</p>
      <div className="mt-4 grid gap-3">
        {config.fields.includes("name") && (
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm dark:border-stone-700 dark:bg-stone-800" />
        )}
        {config.fields.includes("email") && (
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm dark:border-stone-700 dark:bg-stone-800" />
        )}
        {config.fields.includes("phone") && (
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (optional)" className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm dark:border-stone-700 dark:bg-stone-800" />
        )}
        {config.fields.includes("message") && (
          <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Your message — do not share sensitive medical info in generic form" rows={4} className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm dark:border-stone-700 dark:bg-stone-800" />
        )}
        {config.fields.includes("consent") && (
          <label className="flex gap-2 text-xs">
            <input type="checkbox" required checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
            <span>I consent to being contacted about {config.service}. I understand my data will be handled per privacy policy and not sold.</span>
          </label>
        )}
      </div>
      {error && <p className="mt-3 rounded-xl bg-rose-50 p-2 text-xs text-rose-700">{error}</p>}
      <button disabled={busy} className="mt-4 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60">{busy ? "Submitting…" : config.ctaText}</button>
      <p className="mt-2 text-[11px] text-stone-400">Spam protection + rate limiting applied. We collect only necessary info, protect customer data, never store raw card info.</p>
    </form>
  );
}
