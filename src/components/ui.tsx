"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle, BookOpen, CheckCircle2, ChevronDown, ChevronRight,
  Copy, ExternalLink, Heart, Info, MessageCircle, Send, Share2, ShieldAlert, ShieldCheck,
  Siren, Sparkles, Stethoscope,
} from "lucide-react";
import { EVIDENCE_META, type EvidenceLevel } from "@/lib/evidence";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/format";

// ---------- Evidence badge ----------
export function EvidenceBadge({ level, className }: { level: EvidenceLevel; className?: string }) {
  const m = EVIDENCE_META[level];
  return (
    <span title={m.description} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold", m.bg, m.border, m.color, className)}>
      <span className={cn("h-2 w-2 rounded-full", m.dot)} aria-hidden />
      {m.label}
    </span>
  );
}

// ---------- Breadcrumbs ----------
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[13px] text-stone-500 dark:text-stone-400">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
          {it.href ? <Link href={it.href} className="hover:text-emerald-700 hover:underline">{it.label}</Link> : <span className="font-medium text-stone-700 dark:text-stone-200">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

// ---------- Section heading ----------
export function SectionHeading({ eyebrow, title, desc, id }: { eyebrow?: string; title: string; desc?: string; id?: string }) {
  return (
    <div id={id} className="mb-5 scroll-mt-28">
      {eyebrow && <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">{eyebrow}</p>}
      <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-50 md:text-3xl">{title}</h2>
      {desc && <p className="mt-1.5 max-w-3xl text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">{desc}</p>}
    </div>
  );
}

// ---------- Callouts ----------
export function KeyTakeaway({ points }: { points: string[] }) {
  return (
    <aside className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 dark:border-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/40" aria-label="Key takeaways">
      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-200"><Sparkles className="h-4 w-4" /> Key Takeaways</p>
      <ul className="space-y-2">
        {points.map((p, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-stone-700 dark:text-stone-200"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{p}</li>
        ))}
      </ul>
    </aside>
  );
}

export function DoctorBox({ points, title = "When to see a doctor" }: { points: string[]; title?: string }) {
  return (
    <aside className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 dark:border-sky-800 dark:bg-sky-950/40" aria-label={title}>
      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-sky-800 dark:text-sky-200"><Stethoscope className="h-4 w-4" /> {title}</p>
      <ul className="space-y-2">
        {points.map((p, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-stone-700 dark:text-stone-200"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />{p}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">Never stop, replace or change prescribed medicines without medical supervision.</p>
    </aside>
  );
}

export function EmergencyBox({ signs }: { signs: string[] }) {
  if (!signs.length) return null;
  return (
    <aside className="rounded-2xl border-2 border-red-300 bg-red-50 p-5 dark:border-red-800 dark:bg-red-950/50" role="alert" aria-label="Emergency warning signs">
      <p className="mb-1 flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-300"><Siren className="h-4 w-4" /> Seek urgent medical care if…</p>
      <p className="mb-3 text-xs text-red-600/80 dark:text-red-400/80">Do not try home treatment for emergencies. Call emergency services or go to the nearest hospital.</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {signs.map((s, i) => (
          <li key={i} className="flex gap-2 rounded-xl bg-white/70 p-2.5 text-[13px] font-medium leading-snug text-red-900 dark:bg-red-900/30 dark:text-red-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />{s}</li>
        ))}
      </ul>
    </aside>
  );
}

export function SafetyNote({ text }: { text: string }) {
  return (
    <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[13px] leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><p>{text}</p>
    </div>
  );
}

export function InfoNote({ text }: { text: string }) {
  return (
    <div className="flex gap-2.5 rounded-xl border border-stone-200 bg-stone-50 p-3.5 text-[13px] leading-relaxed text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" /><p>{text}</p>
    </div>
  );
}

export function DisclaimerBar({ compact }: { compact?: boolean }) {
  return (
    <div className={cn("rounded-2xl border border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-900", compact ? "p-3" : "p-4")}>
      <p className="flex gap-2 text-xs leading-relaxed text-stone-600 dark:text-stone-300"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{SITE.disclaimer}</p>
    </div>
  );
}

// ---------- FAQ ----------
export function FaqAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white dark:divide-stone-700 dark:border-stone-700 dark:bg-stone-900">
      {faqs.map((f, i) => (
        <div key={i}>
          <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-3 p-4 text-left text-[15px] font-semibold text-stone-900 hover:bg-stone-50 dark:text-stone-100 dark:hover:bg-stone-800/60">
            {f.q}
            <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open === i && "rotate-180")} />
          </button>
          {open === i && <p className="px-4 pb-4 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{f.a}</p>}
        </div>
      ))}
    </div>
  );
}

// ---------- Share ----------
export function ShareButtons({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${SITE.url}${path}`;
  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`, icon: <MessageCircle className="h-4 w-4" /> },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, icon: <Share2 className="h-4 w-4" /> },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, icon: <ExternalLink className="h-4 w-4" /> },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, icon: <Send className="h-4 w-4" /> },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Share</span>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${l.label}`} className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-stone-700 dark:text-stone-300">{l.icon}</a>
      ))}
      <button onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="flex h-8 items-center gap-1.5 rounded-full border border-stone-200 px-3 text-xs font-medium text-stone-600 hover:border-emerald-300 hover:bg-emerald-50 dark:border-stone-700 dark:text-stone-300" aria-label="Copy link">
        <Copy className="h-3.5 w-3.5" />{copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}

// ---------- Newsletter ----------
export function Newsletter({ compact }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <div className={cn("relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white", compact ? "p-6" : "p-8 md:p-10")}>
      <div className="mandala-ring animate-spin-slow pointer-events-none absolute -right-24 -top-24 h-72 w-72 opacity-40" aria-hidden />
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Indian Health Weekly</p>
      <h3 className="font-display mt-2 text-2xl font-bold md:text-3xl">One useful health email. Every Sunday.</h3>
      <p className="mt-2 max-w-xl text-sm text-emerald-100">Diabetes, thyroid, heart, Ayurveda and nutrition — explained simply. No spam, no miracle cures. Unsubscribe anytime.</p>
      {done ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 p-3 text-sm font-medium"><CheckCircle2 className="h-4 w-4 text-amber-300" /> Thank you! Please check your inbox to confirm.</p>
      ) : (
        <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); if (email.includes("@")) setDone(true); }}>
          <label htmlFor="nl-email" className="sr-only">Email address</label>
          <input id="nl-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.in" className="h-11 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 text-sm placeholder:text-emerald-200/60 focus:border-amber-300 focus:outline-none" />
          <button className="h-11 rounded-xl bg-amber-500 px-6 text-sm font-bold text-emerald-950 transition hover:bg-amber-400">Subscribe free</button>
        </form>
      )}
      <p className="mt-2 text-[11px] text-emerald-200/70">By subscribing you agree to our privacy policy. We never sell your data.</p>
    </div>
  );
}

// ---------- Ad slot ----------
export function AdSlot({ slot, className }: { slot: string; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-center dark:border-stone-700 dark:bg-stone-900/60", className)} role="complementary" aria-label={`Advertisement placeholder: ${slot}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Advertisement · {slot}</p>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Ad-ready location. Editorial content is never influenced by advertisers.</p>
    </div>
  );
}

// ---------- Generic cards ----------
export function TopicCard({ href, title, hindi, desc, badge, icon }: { href: string; title: string; hindi?: string; desc: string; badge?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Link href={href} className="card-3d group flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-emerald-300 hover:shadow-xl dark:border-stone-700 dark:bg-stone-900 dark:hover:border-emerald-700">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-amber-100 text-emerald-800 dark:from-emerald-900 dark:to-amber-900 dark:text-amber-200">{icon || <BookOpen className="h-5 w-5" />}</span>
        {badge}
      </div>
      <h3 className="font-display text-lg font-bold leading-snug text-stone-900 group-hover:text-emerald-700 dark:text-stone-50 dark:group-hover:text-emerald-300">{title}</h3>
      {hindi && <p className="text-xs text-stone-500 dark:text-stone-400">{hindi}</p>}
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{desc}</p>
      <span className="mt-auto flex items-center gap-1 pt-3 text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">Read guide <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
    </Link>
  );
}

export function LikeButton({ id }: { id: string }) {
  const [liked, setLiked] = useState(false);
  return (
    <button onClick={() => setLiked(!liked)} aria-pressed={liked} aria-label="Save article" className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition", liked ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-950/50 dark:text-rose-300" : "border-stone-200 text-stone-600 hover:border-rose-200 dark:border-stone-700 dark:text-stone-300")}>
      <Heart className={cn("h-3.5 w-3.5", liked && "fill-rose-500 text-rose-500")} />{liked ? "Saved" : "Save"}
    </button>
  );
}
