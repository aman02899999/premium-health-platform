"use client";

import { useState } from "react";
import { Breadcrumbs, InfoNote, AdSlot, DisclaimerBar } from "@/health/components/ui";
import { SITE } from "@/health/lib/site";
import { CheckCircle2, Mail, Send } from "lucide-react";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/health/components/earning/AffiliateProducts";
import { LatestArticles } from "@/health/components/blog/LatestArticles";

export default function ContactPage() {
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", topic: "Correction / feedback", msg: "" });
  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/health/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, phone: form.phone, email: form.email || undefined, type: "feedback", message: `${form.topic}: ${form.msg}` }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't send your message. Please try again, or call us.");
      setDone(data.message);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't send your message. Please try again, or call us.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Contact" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Contact", item: "/health/contact" }]}
        faqs={[
          { q: "How do I contact you?", a: "Use the form on this page or call +91 88518 30081 for corrections, support, partnerships or advertising. We reply within 2–3 working days. For a medical emergency, call 112 or 108, not this form." },
          { q: "Can I contribute an article?", a: "Yes. Send your credentials, an outline and your references through the form. Every article follows our editorial policy: careful language, cited evidence and no cure claims." },
        ]}
        howTo={{ name: "How to contact BHG", steps: ["Pick a topic: correction, partnership, advertising or other", "Add your name, mobile number and message", "Tap Send message", "We reply within 2–3 working days"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-800 to-teal-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">Contact</p>
        <h1 className="font-display mt-1 text-3xl font-black">Contact us — Editorial & Support</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-emerald-100/90"><Mail className="h-4 w-4" /> {SITE.contactEmail || SITE.contactPhone} · We reply within 2–3 working days.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mt-2"><InfoNote text="We cannot provide personal medical advice by email. For symptoms, see a doctor promptly; for emergencies, call emergency services immediately." /></div>
          {done ? (
            <p role="status" className="mt-6 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"><CheckCircle2 className="h-4 w-4" /> {done}</p>
          ) : (
            <form className="mt-6 space-y-3 rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900" onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block"><span className="mb-1 block text-xs font-bold">Name</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm dark:border-stone-700 dark:bg-stone-800" placeholder="Your name" /></label>
                <label className="block"><span className="mb-1 block text-xs font-bold">Mobile number</span><input required type="tel" inputMode="numeric" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm dark:border-stone-700 dark:bg-stone-800" placeholder="10-digit mobile" /></label>
                <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-bold">Email (optional)</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm dark:border-stone-700 dark:bg-stone-800" placeholder="you@example.in" /></label>
              </div>
              <label className="block"><span className="mb-1 block text-xs font-bold">Topic</span>
                <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm dark:border-stone-700 dark:bg-stone-800">
                  {["Correction / feedback", "Medical review volunteering", "Partnership", "Advertising", "Other"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label className="block"><span className="mb-1 block text-xs font-bold">Message</span><textarea required rows={5} value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} className="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm dark:border-stone-700 dark:bg-stone-800" placeholder="How can we improve? Which page?" /></label>
              {err && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30">{err}</p>}
              <button disabled={busy} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-60"><Send className="h-4 w-4" /> {busy ? "Sending…" : "Send message"}</button>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">We use your number only to reply to this message.</p>
            </form>
          )}
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={3} />
            <LatestArticles limit={3} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Contact footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
