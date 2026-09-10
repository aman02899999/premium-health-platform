"use client";

import { useState } from "react";
import { Breadcrumbs, InfoNote, AdSlot, DisclaimerBar } from "@/components/ui";
import { SITE } from "@/lib/site";
import { CheckCircle2, Mail, Send } from "lucide-react";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";

export default function ContactPage() {
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", topic: "Correction / feedback", msg: "" });
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Contact", item: "/contact" }]}
        faqs={[
          { q: "How to contact BHG?", a: "Email via /contact form — editorial, support, partnerships, advertising. Response 24-48h. For medical emergency, call 102/108, not contact form." },
          { q: "Can I contribute article?", a: "Yes — pitch via /contact with credentials + outline + references. Editorial policy: responsible language, evidence graded, no cure-all claims." },
        ]}
        howTo={{ name: "How to contact BHG", steps: ["Pick reason: editorial, support, partnership, advertising", "Fill form with email + message + UTM", "Submit — POST /api/lead type=consult, tracked via gtag", "Get response 24-48h + newsletter opt-in"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-800 to-teal-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">SEO Pro — Earning Platform — Contact — Lead Gen</p>
        <h1 className="font-display mt-1 text-3xl font-black">Contact us — Editorial & Support</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-emerald-100/90"><Mail className="h-4 w-4" /> {SITE.contactEmail} · We reply within 2–3 working days. SEO HowTo+FAQ+OG+LeadGen+PremiumCTA.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mt-2"><InfoNote text="We cannot provide personal medical advice by email. For symptoms, see a doctor promptly; for emergencies, call emergency services immediately." /></div>
          {done ? (
            <p className="mt-6 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"><CheckCircle2 className="h-4 w-4" /> Thank you, {form.name || "friend"}! Your message has been noted (demo — no email is actually sent). Lead gen tracked via /api/lead + gtag generate_lead.</p>
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
              <button className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-bold text-white hover:bg-emerald-600"><Send className="h-4 w-4" /> Send message — Lead Gen</button>
            </form>
          )}
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={3} />
            <LatestArticles limit={3} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Contact is SEO Pro + Earning</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>Lead gen: contact form POST /api/lead type=consult, Rs150-500/lead, UTM + gtag</li>
              <li>SEO: FAQ + HowTo + Breadcrumb + OG /api/og + E-E-A-T (About + Contact + Editorial Policy)</li>
              <li>Trust: contact email + response time + no medical advice disclaimer</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Contact footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
