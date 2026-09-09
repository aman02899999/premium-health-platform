"use client";

import { useState } from "react";
import { Breadcrumbs, InfoNote } from "@/components/ui";
import { SITE } from "@/lib/site";
import { CheckCircle2, Mail, Send } from "lucide-react";

export default function ContactPage() {
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", topic: "Correction / feedback", msg: "" });
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
      <h1 className="font-display mt-3 text-3xl font-black">Contact us</h1>
      <p className="mt-2 flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300"><Mail className="h-4 w-4" /> {SITE.contactEmail} · We reply within 2–3 working days.</p>
      <div className="mt-4"><InfoNote text="We cannot provide personal medical advice by email. For symptoms, see a doctor promptly; for emergencies, call emergency services immediately." /></div>
      {done ? (
        <p className="mt-6 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"><CheckCircle2 className="h-4 w-4" /> Thank you, {form.name || "friend"}! Your message has been noted (demo — no email is actually sent).</p>
      ) : (
        <form className="mt-6 space-y-3 rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900" onSubmit={(e) => { e.preventDefault(); setDone(true); }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1 block text-xs font-bold">Name</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm dark:border-stone-700 dark:bg-stone-800" placeholder="Your name" /></label>
            <label className="block"><span className="mb-1 block text-xs font-bold">Email</span><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm dark:border-stone-700 dark:bg-stone-800" placeholder="you@example.in" /></label>
          </div>
          <label className="block"><span className="mb-1 block text-xs font-bold">Topic</span>
            <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm dark:border-stone-700 dark:bg-stone-800">
              {["Correction / feedback", "Medical review volunteering", "Partnership", "Advertising", "Other"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="block"><span className="mb-1 block text-xs font-bold">Message</span><textarea required rows={5} value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} className="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm dark:border-stone-700 dark:bg-stone-800" placeholder="How can we improve? Which page?" /></label>
          <button className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-bold text-white hover:bg-emerald-600"><Send className="h-4 w-4" /> Send message</button>
        </form>
      )}
    </div>
  );
}
