"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, BookOpen, Check, ChevronDown, ExternalLink, HelpCircle, Leaf, Loader2, Plus, Stethoscope, Trash2, X } from "lucide-react";
import { parseRangeText } from "@/lib/lab/range-text";
import type { AnalysedResult, Analysis, PanelId, Person, Status } from "@/lib/lab/types";

export type PickerMarker = { id: string; name: string; panel: PanelId; unit: string; units: string[] };
type Panel = { id: PanelId; name: string; hint: string };
type Row = { key: string; name: string; value: string; unit: string; range: string; fixed: boolean };
type Saved = { id: string; createdAt: string; expiresAt: string; label: string; person: Person; analysis: Analysis };

const field = "w-full rounded-xl bg-black/30 px-3 py-2.5 text-white ring-1 ring-white/10 placeholder:text-white/30 focus:outline-none focus:ring-brand";
const date = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
let seq = 0;
const blank = (over: Partial<Row> = {}): Row => ({ key: `r${seq++}`, name: "", value: "", unit: "", range: "", fixed: false, ...over });

const STATUS: Record<Status, { label: string; cls: string; icon: typeof Check }> = {
  "critical-low": { label: "Far below range", cls: "bg-red-500/15 text-red-300 ring-red-500/40", icon: AlertTriangle },
  "critical-high": { label: "Far above range", cls: "bg-red-500/15 text-red-300 ring-red-500/40", icon: AlertTriangle },
  low: { label: "Below range", cls: "bg-amber-500/15 text-amber-200 ring-amber-500/40", icon: ArrowDown },
  high: { label: "Above range", cls: "bg-amber-500/15 text-amber-200 ring-amber-500/40", icon: ArrowUp },
  normal: { label: "In range", cls: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/40", icon: Check },
  unknown: { label: "Not compared", cls: "bg-white/5 text-white/60 ring-white/15", icon: HelpCircle },
};

export function BloodReportApp({ email, panels, markers, saving }: { email: string; panels: Panel[]; markers: PickerMarker[]; saving: boolean }) {
  const [sex, setSex] = useState<"" | "male" | "female">("");
  const [age, setAge] = useState("");
  const [chosen, setChosen] = useState<PanelId[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [consent, setConsent] = useState(false);
  const [save, setSave] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ analysis: Analysis; person: Person } | null>(null);
  const [saved, setSaved] = useState<Saved[] | null>(null);

  const byName = useMemo(() => new Map(markers.map((m) => [m.name, m])), [markers]);

  async function loadSaved() {
    const r = await fetch("/api/account/blood-report", { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (r.ok) setSaved(j.reports ?? []);
  }
  useEffect(() => {
    // Deferred like the admin pages, so the first render isn't followed by a synchronous update.
    if (!saving) return;
    const t = setTimeout(() => void loadSaved(), 0);
    return () => clearTimeout(t);
  }, [saving]);

  function togglePanel(id: PanelId) {
    if (chosen.includes(id)) {
      setChosen(chosen.filter((p) => p !== id));
      const names = new Set(markers.filter((m) => m.panel === id).map((m) => m.name));
      setRows(rows.filter((r) => !(r.fixed && names.has(r.name) && !r.value)));
      return;
    }
    setChosen([...chosen, id]);
    const have = new Set(rows.map((r) => r.name));
    setRows([...rows, ...markers.filter((m) => m.panel === id && !have.has(m.name)).map((m) => blank({ name: m.name, unit: m.unit, fixed: true }))]);
  }

  const update = (key: string, patch: Partial<Row>) => setRows(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const filled = rows.filter((r) => r.name.trim() && r.value.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const bad = filled.find((r) => r.range.trim() && !parseRangeText(r.range));
    if (bad) return setError(`We couldn't read the range for ${bad.name}. Type it like "13 - 17", "<200" or ">40", or leave it empty.`);
    setBusy(true);
    try {
      const results = filled.map((r) => {
        const range = parseRangeText(r.range) ?? {};
        return { name: r.name, value: r.value.replace(/,/g, ""), unit: r.unit, reportLow: range.low, reportHigh: range.high };
      });
      const res = await fetch("/api/account/blood-report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sex, age, results, consent, save }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return setError(j.error || "Something went wrong. Please try again.");
      setResult({ analysis: j.analysis, person: { sex: sex || undefined, age: Number(age) } });
      if (j.savedId) void loadSaved();
      requestAnimationFrame(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string | null) {
    if (!confirm(id ? "Delete this saved report for good?" : "Delete all your saved reports for good?")) return;
    const res = await fetch("/api/account/blood-report", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(id ? { id } : { all: true }) });
    if (res.ok) void loadSaved();
  }

  return (
    <div className="space-y-8">
      <Disclaimer />

      <form onSubmit={submit} className="glass brand-border space-y-6 rounded-3xl p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset>
            <legend className="text-sm font-semibold text-white/80">Sex</legend>
            <div className="mt-2 flex gap-2">
              {(["female", "male"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setSex(s)} aria-pressed={sex === s} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition ${sex === s ? "bg-brand/20 text-white ring-brand" : "bg-black/30 text-white/70 ring-white/10 hover:text-white"}`}>
                  {s === "female" ? "Female" : "Male"}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-semibold text-white/80">
            Age (years)
            <input inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))} className={`${field} mt-2`} placeholder="e.g. 34" />
          </label>
        </div>

        <div>
          <p className="text-sm font-semibold text-white/80">Which tests are on your report?</p>
          <p className="text-xs text-white/50">Tap each one to add its lines. Leave any you don&apos;t have empty.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {panels.map((p) => (
              <button key={p.id} type="button" onClick={() => togglePanel(p.id)} aria-pressed={chosen.includes(p.id)} title={p.hint} className={`rounded-full px-3.5 py-1.5 text-sm ring-1 transition ${chosen.includes(p.id) ? "bg-brand/20 text-white ring-brand" : "bg-white/5 text-white/70 ring-white/10 hover:text-white"}`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {rows.length > 0 && (
          <div className="space-y-2">
            <div className="hidden grid-cols-[1.4fr_0.8fr_0.9fr_1fr_auto] gap-2 px-1 text-xs uppercase tracking-wider text-white/40 sm:grid">
              <span>Test</span>
              <span>Your value</span>
              <span>Unit</span>
              <span>Range on your report</span>
              <span className="w-8" />
            </div>
            {rows.map((r) => {
              const m = byName.get(r.name);
              return (
                <div key={r.key} className="grid grid-cols-2 gap-2 rounded-2xl bg-black/20 p-2 sm:grid-cols-[1.4fr_0.8fr_0.9fr_1fr_auto] sm:bg-transparent sm:p-0">
                  {r.fixed ? (
                    <span className="col-span-2 self-center px-1 text-sm text-white sm:col-span-1">{r.name}</span>
                  ) : (
                    <input aria-label="Test name" list="lab-markers" value={r.name} onChange={(e) => update(r.key, { name: e.target.value, unit: byName.get(e.target.value)?.unit ?? r.unit })} className={`${field} col-span-2 sm:col-span-1`} placeholder="Test name, as on your report" />
                  )}
                  <input aria-label={`${r.name || "Test"} value`} inputMode="decimal" value={r.value} onChange={(e) => update(r.key, { value: e.target.value.replace(/[^\d.,]/g, "").slice(0, 12) })} className={field} placeholder="Value" />
                  {m ? (
                    <select aria-label={`${r.name} unit`} value={r.unit} onChange={(e) => update(r.key, { unit: e.target.value })} className={field}>
                      {m.units.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input aria-label={`${r.name || "Test"} unit`} value={r.unit} onChange={(e) => update(r.key, { unit: e.target.value.slice(0, 30) })} className={field} placeholder="Unit" />
                  )}
                  <input aria-label={`${r.name || "Test"} range on your report`} value={r.range} onChange={(e) => update(r.key, { range: e.target.value.slice(0, 30) })} className={field} placeholder="e.g. 13 - 17" />
                  <button type="button" aria-label={`Remove ${r.name || "row"}`} onClick={() => setRows(rows.filter((x) => x.key !== r.key))} className="justify-self-end rounded-lg p-2 text-white/40 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <datalist id="lab-markers">
          {markers.map((m) => (
            <option key={m.id} value={m.name} />
          ))}
        </datalist>
        <button type="button" onClick={() => setRows([...rows, blank()])} className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm text-white/80 ring-1 ring-white/10 hover:text-white">
          <Plus className="h-4 w-4" /> Add another test
        </button>

        <div className="space-y-3 rounded-2xl bg-black/20 p-4 text-sm text-white/75">
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--color-brand,#d4a017)]" />
            <span>
              I agree that Royal Fitness Club may process these results to show me this education summary. I understand it is not a diagnosis or a prescription. Read our <a href="/privacy#health-data" className="underline">privacy notice</a>.
            </span>
          </label>
          {saving ? (
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} className="mt-1 h-4 w-4" />
              <span>Keep this report in my account (encrypted, for 12 months, and I can delete it any time). Leave this unticked and nothing is stored.</span>
            </label>
          ) : (
            <p className="text-white/50">Nothing you type here is stored. We analyse it and forget it.</p>
          )}
        </div>

        {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-500/30">{error}</p>}
        <button type="submit" disabled={busy || !filled.length || !consent || !sex || !age} className="btn-brand inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-semibold disabled:opacity-50 sm:w-auto">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Explain my report
        </button>
      </form>

      {result && (
        <div id="results" className="scroll-mt-28">
          <Results analysis={result.analysis} />
        </div>
      )}

      {saving && saved && saved.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-2xl text-white">Saved reports</h2>
            <button onClick={() => remove(null)} className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-red-300">
              <Trash2 className="h-4 w-4" /> Delete all
            </button>
          </div>
          {saved.map((s) => (
            <details key={s.id} className="glass rounded-2xl p-4">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                <span className="text-white">{s.label || `Report of ${date(s.createdAt)}`}</span>
                <span className="flex items-center gap-3 text-sm text-white/50">
                  {s.analysis.counts.low + s.analysis.counts.high + s.analysis.counts["critical-low"] + s.analysis.counts["critical-high"]} outside range
                  <ChevronDown className="h-4 w-4" />
                </span>
              </summary>
              <div className="mt-4 space-y-4">
                <Results analysis={s.analysis} compact />
                <p className="text-xs text-white/40">Kept until {date(s.expiresAt)}.</p>
                <button onClick={() => remove(s.id)} className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-red-300">
                  <Trash2 className="h-4 w-4" /> Delete this report
                </button>
              </div>
            </details>
          ))}
        </section>
      )}

      <p className="text-center text-xs text-white/40">Signed in as {email}</p>
    </div>
  );
}

function Disclaimer() {
  return (
    <div className="flex gap-3 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-100/90 ring-1 ring-amber-500/30">
      <Stethoscope className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
      <p>
        <b>For education, not diagnosis.</b> This explains your numbers in plain words and suggests safe food and lifestyle steps. It can&apos;t diagnose a condition or replace your doctor, and it never suggests medicines. Our explanations are waiting for a doctor&apos;s review.
      </p>
    </div>
  );
}

function Results({ analysis, compact = false }: { analysis: Analysis; compact?: boolean }) {
  const out = analysis.counts.low + analysis.counts.high + analysis.counts["critical-low"] + analysis.counts["critical-high"];
  return (
    <div className="space-y-4">
      {analysis.urgent && (
        <div role="alert" className="flex gap-3 rounded-2xl bg-red-500/15 p-4 text-red-100 ring-1 ring-red-500/50">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
          <p>
            <b>Please contact a doctor today.</b> At least one value is far outside the usual range. If you feel unwell (fainting, chest pain, breathlessness, confusion, bleeding), go to the nearest emergency department now.
          </p>
        </div>
      )}
      {!compact && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat n={analysis.counts.normal} label="In range" cls="text-emerald-300" />
          <Stat n={out} label="Outside range" cls={out ? "text-amber-200" : "text-white"} />
          <Stat n={analysis.counts.unknown} label="Not compared" cls="text-white/70" />
        </div>
      )}
      {analysis.results.map((r, i) => (
        <ResultCard key={`${r.input.name}-${i}`} r={r} />
      ))}
      {!compact && <Disclaimer />}
    </div>
  );
}

function Stat({ n, label, cls }: { n: number; label: string; cls: string }) {
  return (
    <div className="glass rounded-2xl p-3">
      <div className={`font-display text-3xl ${cls}`}>{n}</div>
      <div className="text-xs text-white/55">{label}</div>
    </div>
  );
}

const fmt = (n?: number) => (n === undefined ? "" : Number(n.toFixed(2)).toString());

function rangeText(r: AnalysedResult) {
  const { low, high, from } = r.range;
  if (from === "guideline") return r.bandLabel ? `Guideline: ${r.bandLabel}` : "Guideline category";
  if (low === undefined && high === undefined) return "No range to compare with";
  const span = low !== undefined && high !== undefined ? `${fmt(low)} – ${fmt(high)}` : low !== undefined ? `above ${fmt(low)}` : `below ${fmt(high)}`;
  return `${from === "report" ? "Your lab's range" : "Usual adult range"}: ${span} ${r.marker?.unit ?? ""}`;
}

function ResultCard({ r }: { r: AnalysedResult }) {
  const s = STATUS[r.status];
  const Icon = s.icon;
  const a = r.advice;
  return (
    <article className="glass rounded-2xl p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{r.marker?.name ?? r.input.name}</h3>
          <p className="text-sm text-white/60">
            <b className="text-white">{fmt(r.value ?? r.input.value)}</b> {r.value !== null ? r.marker?.unit : r.input.unit} · {rangeText(r)}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${s.cls}`}>
          <Icon className="h-4 w-4" /> {r.bandLabel && r.range.from === "guideline" ? r.bandLabel : s.label}
        </span>
      </header>
      {r.marker?.about && <p className="mt-3 text-sm text-white/70">{r.marker.about}</p>}
      {r.note && <p className="mt-2 text-sm text-white/50">{r.note}</p>}
      {a && (
        <div className="mt-4 space-y-3 text-sm">
          <p className="text-white/85">{a.meaning}</p>
          {a.lifestyle.length > 0 && (
            <div>
              <p className="font-semibold text-white">What you can do</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-white/75">
                {a.lifestyle.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {a.ayurveda && a.ayurveda.length > 0 && (
            <div className="rounded-xl bg-emerald-500/5 p-3 ring-1 ring-emerald-500/20">
              <p className="flex items-center gap-1.5 font-semibold text-emerald-200">
                <Leaf className="h-4 w-4" /> Traditional home care (support only)
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-white/70">
                {a.ayurveda.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-2 rounded-xl bg-sky-500/10 p-3 text-sky-100 ring-1 ring-sky-500/30">
            <Stethoscope className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <b>See a doctor: </b>
              {a.doctor}
            </p>
          </div>
        </div>
      )}
      {r.marker && (r.marker.guide || r.marker.sources.length > 0) && (
        <footer className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45">
          {r.marker.guide && (
            <a href={`/health/lab-tests/${r.marker.guide}`} className="inline-flex items-center gap-1 hover:text-white">
              <BookOpen className="h-3.5 w-3.5" /> Full guide
            </a>
          )}
          {r.range.from !== "report" &&
            r.marker.sources.map((src) => (
              <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-white">
                <ExternalLink className="h-3.5 w-3.5" /> {src.publisher.split(",")[0]}: {src.title}
              </a>
            ))}
        </footer>
      )}
    </article>
  );
}
