"use client";

import { ArrowLeft, ExternalLink, EyeOff, KeyRound, Lock, RefreshCw, RotateCcw, Save, Search, UserCheck, UserMinus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AccessRow, Eligible } from "@/lib/lab/store";
import type { Analysis, Marker, PanelId } from "@/lib/lab/types";

const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";
const btn = "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold disabled:opacity-40";
const field = "w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-amber-400";
const TABS = [
  { id: "access", label: "Who has access" },
  { id: "tests", label: "Tests & ranges" },
  { id: "activity", label: "Activity" },
  { id: "reports", label: "A member's reports" },
] as const;

type AdminMarker = Marker & { edited: boolean };
type Data = {
  saving: boolean;
  access: AccessRow[];
  eligible: Eligible[];
  stats: { analyses: number; saved: number; savedNow: number; people: number };
  log: { at: string; admin: string; action: string; subject: string; reason: string }[];
  panels: { id: PanelId; name: string }[];
  markers: AdminMarker[];
};

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

export function BloodReportAdmin({ owner }: { owner: boolean }) {
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("access");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/blood-report", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function act(body: unknown, done: string) {
    setError("");
    setNotice("");
    try {
      await post("/api/admin/blood-report", body);
      setNotice(done);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      <header className="border-b border-white/10 px-4 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <a href="/admin" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Admin
          </a>
          <h1 className="text-lg font-bold">Blood report analyser</h1>
          <div className="flex gap-2">
            <a href="/account/blood-report" target="_blank" className={`${btn} bg-white/10 hover:bg-white/15`}>
              <ExternalLink className="h-4 w-4" /> Member page
            </a>
            <button type="button" onClick={() => void load()} className={`${btn} bg-white/10 hover:bg-white/15`}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        <nav className="flex flex-wrap gap-2" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} aria-pressed={tab === t.id} className={`${btn} ${tab === t.id ? "bg-amber-500 text-black" : "bg-white/10 hover:bg-white/15"}`}>
              {t.label}
            </button>
          ))}
        </nav>
        {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-500/30">{error}</p>}
        {notice && <p className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200 ring-1 ring-emerald-500/30">{notice}</p>}
        {data && !data.saving && (
          <p className={`${card} flex gap-2 text-sm text-white/70`}>
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            Members can analyse reports, but saving to their account is off until the encryption key LAB_DATA_KEY is added in Vercel. Until then nothing they type is stored.
          </p>
        )}
        {!data && !error && <p className="text-white/50">Loading…</p>}
        {data && tab === "access" && <AccessTab data={data} act={act} />}
        {data && tab === "tests" && <TestsTab data={data} act={act} />}
        {data && tab === "activity" && <ActivityTab data={data} />}
        {data && tab === "reports" && (owner ? <ReportsTab /> : <p className={`${card} text-sm text-white/70`}>Only an owner can open a member&apos;s saved reports.</p>)}
      </main>
    </div>
  );
}

function AccessTab({ data, act }: { data: Data; act: (b: unknown, done: string) => Promise<void> }) {
  const [emails, setEmails] = useState("");
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const active = data.access.filter((a) => a.active);

  return (
    <div className="space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className="font-bold">Switch it on for members and diet clients</h2>
        <p className="text-sm text-white/60">People with an email on file who don&apos;t have access yet. They sign in with that same email at /account/blood-report.</p>
        {data.eligible.length === 0 ? (
          <p className="text-sm text-white/50">Nobody waiting. Members need an email in the member register to show up here.</p>
        ) : (
          <>
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {data.eligible.map((p) => (
                <label key={p.email} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-white/5">
                  <input type="checkbox" checked={picked.includes(p.email)} onChange={(e) => setPicked(e.target.checked ? [...picked, p.email] : picked.filter((x) => x !== p.email))} />
                  <span className="flex-1">
                    {p.name} <span className="text-white/40">{p.email}</span>
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">{p.kind}{p.until ? ` · till ${p.until}` : ""}</span>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button className={`${btn} bg-white/10 hover:bg-white/15`} onClick={() => setPicked(data.eligible.map((p) => p.email))}>Select all</button>
              <button disabled={!picked.length} className={`${btn} bg-amber-500 text-black`} onClick={() => void act({ action: "grant", emails: picked, note: "From members/diet clients list" }, `Switched on for ${picked.length}.`).then(() => setPicked([]))}>
                <UserCheck className="h-4 w-4" /> Switch on for {picked.length || "selected"}
              </button>
            </div>
          </>
        )}
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className="font-bold">Add by email</h2>
        <textarea value={emails} onChange={(e) => setEmails(e.target.value)} rows={3} className={field} placeholder="One or more emails, separated by commas or new lines" />
        <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} className={field} placeholder="Note (optional), e.g. 'Quarterly member, asked at desk'" />
        <button className={`${btn} bg-amber-500 text-black`} disabled={!emails.trim()} onClick={() => void act({ action: "grant", emails: emails.split(/[\s,;]+/), note }, "Access switched on.").then(() => setEmails(""))}>
          <UserCheck className="h-4 w-4" /> Switch on
        </button>
      </section>

      <section className={`${card} space-y-2`}>
        <h2 className="font-bold">Has access ({active.length})</h2>
        {data.access.length === 0 && <p className="text-sm text-white/50">Nobody yet.</p>}
        {data.access.map((a) => (
          <div key={a.email} className={`flex flex-wrap items-center gap-3 rounded-lg px-2 py-1.5 text-sm ${a.active ? "" : "opacity-50"}`}>
            <span className="flex-1">
              {a.name || a.email} {a.name && <span className="text-white/40">{a.email}</span>}
              {a.kind && <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">{a.kind}</span>}
            </span>
            <span className="text-xs text-white/40">{a.active ? `since ${when(a.grantedAt)}` : "switched off"}</span>
            {a.active && (
              <button className={`${btn} bg-white/10 hover:bg-red-500/30`} onClick={() => confirm(`Switch off for ${a.email}? Their saved reports stay theirs to see and delete.`) && void act({ action: "revoke", email: a.email }, "Access switched off.")}>
                <UserMinus className="h-4 w-4" /> Switch off
              </button>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

const lines = (t: string) => t.split("\n").map((s) => s.trim()).filter(Boolean);

function TestsTab({ data, act }: { data: Data; act: (b: unknown, done: string) => Promise<void> }) {
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return data.markers.filter((m) => !s || [m.name, m.id, ...m.aliases].some((n) => n.toLowerCase().includes(s)));
  }, [q, data.markers]);

  return (
    <div className="space-y-3">
      <p className={`${card} text-sm text-white/70`}>
        {data.markers.length} tests. Edits apply to members straight away. Every range needs the official page it comes from, and the editor refuses medicine doses and cure claims. &quot;Reset&quot; goes back to the version in the code.
      </p>
      <label className="relative block">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
        <input value={q} onChange={(e) => setQ(e.target.value)} className={`${field} pl-9`} placeholder="Search a test or synonym (SGPT, TLC, Hb…)" />
      </label>
      {data.panels.map((p) => {
        const ms = shown.filter((m) => m.panel === p.id);
        if (!ms.length) return null;
        return (
          <section key={p.id} className={card}>
            <h2 className="mb-2 font-bold">{p.name}</h2>
            {ms.map((m) => (
              <div key={m.id} className="border-t border-white/5 py-2 first:border-0">
                <button className="flex w-full flex-wrap items-center gap-2 text-left text-sm" onClick={() => setOpenId(openId === m.id ? null : m.id)} aria-expanded={openId === m.id}>
                  <span className="flex-1 font-semibold">{m.name}</span>
                  {m.hidden && <EyeOff className="h-4 w-4 text-white/40" aria-label="Hidden" />}
                  {m.edited && <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">edited</span>}
                  <span className="text-xs text-white/40">{m.ranges.length || m.bands?.length ? `${m.sources.length} source${m.sources.length === 1 ? "" : "s"}` : "report range only"}</span>
                </button>
                {openId === m.id && <MarkerEditor m={m} act={act} />}
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

function MarkerEditor({ m, act }: { m: AdminMarker; act: (b: unknown, done: string) => Promise<void> }) {
  const [name, setName] = useState(m.name);
  const [aliases, setAliases] = useState(m.aliases.join("\n"));
  const [about, setAbout] = useState(m.about);
  const [ranges, setRanges] = useState(m.ranges.map((r) => [r.sex ?? "", r.ageMin ?? "", r.ageMax ?? "", r.low ?? "", r.high ?? ""].join(", ")).join("\n"));
  const [critLow, setCritLow] = useState(m.critical?.low?.toString() ?? "");
  const [critHigh, setCritHigh] = useState(m.critical?.high?.toString() ?? "");
  const [sources, setSources] = useState(m.sources.map((s) => `${s.url} | ${s.title}`).join("\n"));
  const [low, setLow] = useState(m.low?.meaning ?? "");
  const [high, setHigh] = useState(m.high?.meaning ?? "");

  function save() {
    const data: Record<string, unknown> = {
      name,
      aliases: lines(aliases),
      about,
      critical: { low: critLow, high: critHigh },
      ranges: lines(ranges).map((l) => {
        const [sex, ageMin, ageMax, lo, hi] = l.split(",").map((x) => x.trim());
        return { sex, ageMin, ageMax, low: lo, high: hi };
      }),
      sources: lines(sources).map((l) => {
        const [url, title] = l.split("|").map((x) => x.trim());
        return { url, title, publisher: "" };
      }),
    };
    if (m.low && low !== m.low.meaning) data.low = { ...m.low, meaning: low };
    if (m.high && high !== m.high.meaning) data.high = { ...m.high, meaning: high };
    void act({ action: "marker", id: m.id, data }, `${name} saved.`);
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl bg-black/30 p-3 text-sm">
      <label className="block">Name<input value={name} onChange={(e) => setName(e.target.value)} className={`${field} mt-1`} /></label>
      <label className="block">
        Synonyms, one per line (every name labs print for this test)
        <textarea value={aliases} onChange={(e) => setAliases(e.target.value)} rows={4} className={`${field} mt-1`} />
      </label>
      <label className="block">What it is<textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={2} className={`${field} mt-1`} /></label>
      <label className="block">
        Cited ranges in {m.unit}, one per line: sex (male/female/blank), age from, age to, low, high
        <textarea value={ranges} onChange={(e) => setRanges(e.target.value)} rows={3} className={`${field} mt-1 font-mono`} placeholder="male, 18, , 13.8, 17.2" />
      </label>
      {m.bands?.length ? <p className="text-xs text-white/50">This test also uses guideline categories ({m.bands.map((b) => b.label).join(", ")}), which are set in code.</p> : null}
      <div className="grid grid-cols-2 gap-2">
        <label className="block">Urgent below<input value={critLow} onChange={(e) => setCritLow(e.target.value)} className={`${field} mt-1`} placeholder="none" /></label>
        <label className="block">Urgent above<input value={critHigh} onChange={(e) => setCritHigh(e.target.value)} className={`${field} mt-1`} placeholder="none" /></label>
      </div>
      <p className="text-xs text-white/50">Urgent values show members a &quot;contact a doctor today&quot; banner. Ask your doctor to set these.</p>
      <label className="block">
        Sources, one per line: link | title
        <textarea value={sources} onChange={(e) => setSources(e.target.value)} rows={2} className={`${field} mt-1 font-mono`} />
      </label>
      {m.low && <label className="block">When low, what it means<textarea value={low} onChange={(e) => setLow(e.target.value)} rows={3} className={`${field} mt-1`} /></label>}
      {m.high && <label className="block">When high, what it means<textarea value={high} onChange={(e) => setHigh(e.target.value)} rows={3} className={`${field} mt-1`} /></label>}
      <div className="flex flex-wrap gap-2">
        <button className={`${btn} bg-amber-500 text-black`} onClick={save}><Save className="h-4 w-4" /> Save</button>
        <button className={`${btn} bg-white/10 hover:bg-white/15`} onClick={() => void act({ action: "marker", id: m.id, data: { hidden: !m.hidden } }, m.hidden ? "Shown again." : "Hidden from members.")}>
          <EyeOff className="h-4 w-4" /> {m.hidden ? "Show to members" : "Hide from members"}
        </button>
        {m.edited && (
          <button className={`${btn} bg-white/10 hover:bg-white/15`} onClick={() => confirm("Go back to the default for this test?") && void act({ action: "reset", id: m.id }, "Back to the default.")}>
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        )}
      </div>
    </div>
  );
}

const ACTION: Record<string, string> = { grant: "Switched on", revoke: "Switched off", "view-reports": "Opened reports of", "edit-marker": "Edited test", "reset-marker": "Reset test" };

function ActivityTab({ data }: { data: Data }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["People with access", data.stats.people],
          ["Reports analysed, 30 days", data.stats.analyses],
          ["Saved, 30 days", data.stats.saved],
          ["Saved reports kept now", data.stats.savedNow],
        ].map(([label, n]) => (
          <div key={label} className={card}>
            <div className="text-2xl font-bold">{n}</div>
            <div className="text-xs text-white/50">{label}</div>
          </div>
        ))}
      </div>
      <section className={card}>
        <h2 className="mb-2 font-bold">Audit log</h2>
        <p className="mb-2 text-xs text-white/50">Every change and every time someone opened a member&apos;s reports. It can&apos;t be edited.</p>
        {data.log.length === 0 && <p className="text-sm text-white/50">Nothing yet.</p>}
        {data.log.map((l, i) => (
          <p key={i} className="border-t border-white/5 py-1.5 text-sm first:border-0">
            <span className="text-white/40">{when(l.at)}</span> · {l.admin} · {ACTION[l.action] ?? l.action} <b>{l.subject}</b>
            {l.reason && <span className="text-white/50"> · {l.reason}</span>}
          </p>
        ))}
      </section>
    </div>
  );
}

function ReportsTab() {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [reports, setReports] = useState<{ id: string; createdAt: string; analysis: Analysis }[] | null>(null);
  const [error, setError] = useState("");

  async function view() {
    setError("");
    try {
      setReports((await post("/api/admin/blood-report/reports", { email, reason })).reports);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-3">
      <p className={`${card} flex gap-2 text-sm text-white/70`}>
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        Health data. Open a member&apos;s saved reports only when they ask you to, for example for a review call. Your name, the time and your reason go in the audit log, and members can delete their reports at any time.
      </p>
      <div className={`${card} space-y-2`}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="Member's email" />
        <input value={reason} onChange={(e) => setReason(e.target.value)} className={field} placeholder="Why, e.g. 'Member asked for a review call on WhatsApp today'" />
        <button className={`${btn} bg-amber-500 text-black`} disabled={!email || reason.trim().length < 10} onClick={() => void view()}>Open reports</button>
        {error && <p className="text-sm text-red-300">{error}</p>}
      </div>
      {reports && reports.length === 0 && <p className="text-sm text-white/50">No saved reports for this email.</p>}
      {reports?.map((r) => (
        <section key={r.id} className={card}>
          <h3 className="mb-2 font-bold">Report of {when(r.createdAt)}</h3>
          {r.analysis.results.map((x, i) => (
            <p key={i} className="border-t border-white/5 py-1 text-sm first:border-0">
              {x.marker?.name ?? x.input.name}: <b>{x.value ?? x.input.value}</b> {x.marker?.unit ?? x.input.unit} · <span className={x.status === "normal" ? "text-emerald-300" : x.status === "unknown" ? "text-white/50" : "text-amber-200"}>{x.bandLabel ?? x.status}</span>
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
