"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ExternalLink, FileCheck2, RotateCcw, X } from "lucide-react";
import type { Rewrite } from "@/lib/ai/disease-drafts-core";

type State = "waiting" | "approved" | "changes" | "outdated";
type Item = { slug: string; name: string; state: State; words: number; references: number; generatedAt: string; reviewerName: string; reviewedAt: string | null; note: string };
type Review = { status: "approved" | "changes"; reviewerName: string; reviewerQualification: string; note: string; reviewedAt: string } | null;
type Detail = { slug: string; entry: { name: string; generatedAt: string; notes: string[]; draft: Rewrite }; state: State; review: Review };

const LABEL: Record<State, string> = { waiting: "Waiting for review", approved: "Approved (live)", changes: "Changes requested", outdated: "Changed since approval" };
const TONE: Record<State, string> = { waiting: "bg-white/10 text-white/80", approved: "bg-emerald-500/15 text-emerald-200", changes: "bg-amber-500/15 text-amber-200", outdated: "bg-red-500/15 text-red-200" };
const card = "rounded-2xl bg-white/[.04] p-4 ring-1 ring-white/10 sm:p-5";
const input = "w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 placeholder:text-white/35 focus:outline-none focus:ring-brand/60";
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

async function call<T>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : { cache: "no-store" });
  if (r.status === 401) {
    location.href = "/admin/login";
    throw new Error("Signed out");
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Something went wrong");
  return j as T;
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <section>
      <h3 className="font-display text-base text-white">{title}</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-white/80">
        {items.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </section>
  );
}

/** The whole draft, in reading order, so the doctor reviews exactly what the public page would show. */
function DraftView({ d }: { d: Rewrite }) {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="font-display text-base text-white">Definition</h3>
        <p className="mt-1 text-sm text-white/80">{d.definition}</p>
      </section>
      {d.quickFacts?.length > 0 && (
        <section>
          <h3 className="font-display text-base text-white">Quick facts</h3>
          <dl className="mt-1 grid gap-1 text-sm sm:grid-cols-2">
            {d.quickFacts.map((f, i) => <div key={i}><dt className="inline text-white/50">{f.label}: </dt><dd className="inline text-white/80">{f.value}</dd></div>)}
          </dl>
        </section>
      )}
      <List title="Causes and risk factors" items={d.causes} />
      <List title="Types" items={(d.types ?? []).map((t) => `${t.name}: ${t.desc}`)} />
      <List title="Diagnosis" items={d.diagnosis} />
      <List title="Tests" items={(d.investigations ?? []).map((t) => `${t.test}: ${t.purpose}`)} />
      <List title="Modern treatment" items={d.modernTreatment} />
      <List title="Ayurveda view" items={d.ayurvedaView} />
      <List title="Herbs" items={(d.herbsUsed ?? []).map((h) => `${h.name}: ${h.note}`)} />
      <List title="Nutrition" items={d.nutrition} />
      <List title="Lifestyle" items={d.lifestyle} />
      <List title="Yoga and activity" items={d.yogaActivity} />
      <List title="Homeopathy note" items={d.homeopathyNote} />
      <List title="What the evidence says" items={d.evidenceNotes} />
      <List title="What not to do" items={d.shouldNotDo} />
      <List title="Medicine safety" items={d.medicationSafety} />
      <List title="Complications" items={d.complications} />
      <List title="Emergency signs" items={d.emergencySigns} />
      <List title="When to see a doctor" items={d.whenToSeeDoctor} />
      {d.faqs?.length > 0 && (
        <section>
          <h3 className="font-display text-base text-white">FAQs</h3>
          <div className="mt-1 space-y-2 text-sm">
            {d.faqs.map((f, i) => <div key={i}><p className="font-semibold text-white/90">{f.q}</p><p className="text-white/75">{f.a}</p></div>)}
          </div>
        </section>
      )}
      <section>
        <h3 className="font-display text-base text-white">References (check that each one opens and says what the page says)</h3>
        <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
          {d.references.map((r, i) => (
            <li key={i}>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sky-300 underline underline-offset-2">
                {r.title} <ExternalLink className="h-3 w-3" />
              </a>{" "}
              <span className="text-white/50">({r.source}{r.year ? `, ${r.year}` : ""})</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Decide({ detail, onDone }: { detail: Detail; onDone: (msg: string) => void }) {
  const [form, setForm] = useState({ reviewerName: "", reviewerQualification: "", reviewerRegistration: "", confirm: false, note: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const send = async (body: Record<string, unknown>, msg: string) => {
    setBusy(true);
    setError("");
    try {
      await call("/api/admin/health-review", { slug: detail.slug, ...body });
      onDone(msg);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const live = detail.state === "approved";
  return (
    <div className={`${card} space-y-4`}>
      {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
      {!live && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            send({ action: "approve", reviewerName: form.reviewerName, reviewerQualification: form.reviewerQualification, reviewerRegistration: form.reviewerRegistration, confirm: form.confirm }, `${detail.entry.name} approved. It goes live and can be found on Google.`);
          }}
        >
          <h3 className="font-display text-base">Approve</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm"><span className="mb-1 block text-white/60">Doctor&apos;s name</span><input className={input} required placeholder="Dr Asha Verma" value={form.reviewerName} onChange={(e) => setForm({ ...form, reviewerName: e.target.value })} /></label>
            <label className="text-sm"><span className="mb-1 block text-white/60">Qualification</span><input className={input} required placeholder="MBBS, MD" value={form.reviewerQualification} onChange={(e) => setForm({ ...form, reviewerQualification: e.target.value })} /></label>
            <label className="text-sm"><span className="mb-1 block text-white/60">Registration no. (kept private)</span><input className={input} required value={form.reviewerRegistration} onChange={(e) => setForm({ ...form, reviewerRegistration: e.target.value })} /></label>
          </div>
          <label className="flex items-start gap-2 text-sm text-white/80">
            <input type="checkbox" className="mt-1" checked={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.checked })} />
            I have read this whole page, including the references, and it is medically accurate for general health education.
          </label>
          <p className="text-xs text-white/50">The public page will say &quot;Medically reviewed by&quot; with the name and qualification. The registration number is only kept here.</p>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50">
            <Check className="h-4 w-4" /> Approve and publish
          </button>
        </form>
      )}
      <div className="space-y-2 border-t border-white/10 pt-4">
        <h3 className="font-display text-base">{live ? "Take it down" : "Ask for changes"}</h3>
        <textarea className={`${input} min-h-24`} placeholder={live ? "Why it should come down" : "What is wrong or missing (this goes back to the writer)"} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button
          type="button"
          disabled={busy}
          onClick={() => send({ action: live ? "withdraw" : "changes", note: form.note }, live ? `${detail.entry.name} taken down. It goes back to the old page, hidden from Google.` : `Changes requested for ${detail.entry.name}.`)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15 disabled:opacity-50"
        >
          {live ? <RotateCcw className="h-4 w-4" /> : <X className="h-4 w-4" />} {live ? "Withdraw approval" : "Request changes"}
        </button>
      </div>
    </div>
  );
}

export function HealthReviewApp() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [filter, setFilter] = useState<State | "all">("waiting");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  const load = useCallback(() => {
    call<{ drafts: Item[] }>("/api/admin/health-review").then((j) => setItems(j.drafts), (e) => setError((e as Error).message));
  }, []);
  useEffect(load, [load]);

  const open = (slug: string) => {
    setError("");
    call<Detail>(`/api/admin/health-review?slug=${encodeURIComponent(slug)}`).then((d) => (setDetail(d), window.scrollTo(0, 0)), (e) => setError((e as Error).message));
  };
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items?.length ?? 0 };
    for (const i of items ?? []) c[i.state] = (c[i.state] ?? 0) + 1;
    return c;
  }, [items]);
  const shown = (items ?? []).filter((i) => filter === "all" || i.state === filter);

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
          {detail ? (
            <button type="button" onClick={() => setDetail(null)} aria-label="Back to the list" className="rounded-lg p-1.5 text-white/70 hover:bg-white/10"><ArrowLeft className="h-5 w-5" /></button>
          ) : (
            <a href="/admin" aria-label="Back to Command Center" className="rounded-lg p-1.5 text-white/70 hover:bg-white/10"><ArrowLeft className="h-5 w-5" /></a>
          )}
          <FileCheck2 className="h-5 w-5 text-emerald-300" />
          <span className="font-display text-lg">Health page review</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        {flash && <p role="status" className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-100">{flash}</p>}
        {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}

        {detail ? (
          <>
            <div className={card}>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl">{detail.entry.name}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-xs ${TONE[detail.state]}`}>{LABEL[detail.state]}</span>
              </div>
              <p className="mt-1 text-xs text-white/50">
                AI draft (Gemini), written {day(detail.entry.generatedAt)}. Live page: <a className="underline" href={`/health/diseases/${detail.slug}`} target="_blank" rel="noopener noreferrer">/health/diseases/{detail.slug}</a>
              </p>
              {detail.review?.status === "approved" && <p className="mt-2 text-sm text-emerald-200">Approved by {detail.review.reviewerName}, {detail.review.reviewerQualification} on {day(detail.review.reviewedAt)}.</p>}
              {detail.state === "outdated" && <p className="mt-2 text-sm text-red-200">The text changed after it was approved, so the old page is showing again. Please review it again.</p>}
              {detail.review?.note && <p className="mt-2 text-sm text-amber-200">Note: {detail.review.note}</p>}
              <p className="mt-3 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-100">
                Check especially: medicines and doses (there should be none), anything that sounds like a cure or a promise, emergency signs, and that each reference opens and supports the text.
              </p>
            </div>
            <div className={card}><DraftView d={detail.entry.draft} /></div>
            <Decide detail={detail} onDone={(msg) => { setFlash(msg); setDetail(null); load(); window.scrollTo(0, 0); }} />
          </>
        ) : (
          <>
            <p className="text-sm text-white/60">
              These health pages were drafted by AI. Each one stays hidden from Google, and the public sees the old short page, until a doctor reads it here and approves it.
            </p>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter drafts">
              {(["waiting", "changes", "outdated", "approved", "all"] as const).map((f) => (
                <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-sm ${filter === f ? "bg-white text-ink" : "bg-white/10 text-white/80 hover:bg-white/15"}`}>
                  {f === "all" ? "All" : LABEL[f]} ({counts[f] ?? 0})
                </button>
              ))}
            </div>
            {!items && !error && <p className="text-sm text-white/50">Loading…</p>}
            {items && shown.length === 0 && <p className="text-sm text-white/50">Nothing here.</p>}
            <ul className="grid gap-2 sm:grid-cols-2">
              {shown.map((i) => (
                <li key={i.slug}>
                  <button type="button" onClick={() => open(i.slug)} className={`${card} w-full text-left hover:bg-white/[.07]`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold">{i.name}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${TONE[i.state]}`}>{LABEL[i.state]}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/50">{i.words.toLocaleString("en-IN")} words · {i.references} references{i.reviewerName ? ` · ${i.reviewerName}` : ""}</p>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
