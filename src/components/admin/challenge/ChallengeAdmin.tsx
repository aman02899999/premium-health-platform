"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Flag, Gift, Loader2, Plus, Trophy, X } from "lucide-react";

type LevelId = "beginner" | "intermediate" | "advance";
type Q = { id: string; level: LevelId; topic: string; prompt: string; options: string[]; answer: number; why: string; source: string; custom: boolean; state: "waiting" | "approved" | "retired" | "changed" };
type Attempt = { name: string; phone: string; area: string; level: LevelId; correct: number | null; totalMs: number | null; tabSwitches: number; sharedNetwork: boolean; finished: boolean };
type Prize = { claimCode: string; prize: string; status: string; level: LevelId; correct: number; name: string; phone: string; area: string; redeemedAt: string | null; redeemedBy: string; note: string };
type Month = { month: string; current: string; finalised: boolean; attempts: Attempt[]; prizes: Prize[] };

const NAMES: Record<LevelId, string> = { beginner: "Beginner", intermediate: "Intermediate", advance: "Advance" };
const PRIZE_NAMES: Record<string, string> = { "gym-3m": "3 months gym", "gym-1m": "1 month gym", "gym-15d": "15 days gym + consult", "diet-1m": "1-month diet plan", "pass-7d": "7-day pass", "pass-3d": "3-day pass + consult" };
const STATE_TONE: Record<Q["state"], string> = { waiting: "bg-white/10 text-white/80", approved: "bg-emerald-500/15 text-emerald-200", retired: "bg-white/5 text-white/45", changed: "bg-amber-500/15 text-amber-200" };
const card = "rounded-2xl bg-white/[.04] p-4 ring-1 ring-white/10 sm:p-5";
const input = "w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 placeholder:text-white/35 focus:outline-none focus:ring-brand/60";

async function call<T>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : { cache: "no-store" });
  if (r.status === 401) {
    window.location.replace("/admin/login");
    throw new Error("Signed out");
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Something went wrong");
  return j as T;
}

function monthsBack(current: string, n: number): string[] {
  const out: string[] = [];
  let [y, m] = current.split("-").map(Number);
  for (let i = 0; i < n; i++) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m -= 1;
    if (m === 0) (m = 12), (y -= 1);
  }
  return out;
}

function Desk({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function go(action: "redeem" | "void") {
    setBusy(true);
    setMsg(null);
    try {
      await call("/api/admin/challenge", { action, code, note });
      setMsg({ ok: true, text: action === "redeem" ? "Marked collected." : "Prize cancelled." });
      setCode("");
      setNote("");
      onDone();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={card}>
      <h2 className="flex items-center gap-2 font-display text-lg text-white"><Gift className="h-5 w-5 text-amber-300" /> Prize desk</h2>
      <p className="mt-1 text-sm text-white/60">Check the photo ID matches the name and the mobile number below, then mark it collected.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-[12rem_1fr_auto_auto]">
        <input className={`${input} font-mono uppercase`} placeholder="WIN-1A2B3C4D" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().trim())} />
        <input className={input} placeholder="Note (e.g. Aadhaar checked)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button disabled={busy || !code} onClick={() => go("redeem")} className="btn-brand rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">Mark collected</button>
        <button disabled={busy || !code} onClick={() => go("void")} className="rounded-lg px-4 py-2 text-sm font-semibold text-red-200 ring-1 ring-red-400/40 disabled:opacity-50">Cancel prize</button>
      </div>
      {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.text}</p>}
    </div>
  );
}

function MonthView() {
  const [month, setMonth] = useState<string | null>(null);
  const [data, setData] = useState<Month | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback((m: string | null) => call<Month>(`/api/admin/challenge${m ? `?month=${m}` : ""}`).then((d) => (setData(d), setError("")), (e) => setError((e as Error).message)), []);
  useEffect(() => {
    load(month);
  }, [load, month]);
  const months = data ? monthsBack(data.current, 6) : [];
  return (
    <div className="space-y-4">
      <Desk onDone={() => load(month)} />
      <div className={card}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto font-display text-lg text-white">Month</h2>
          <select className={`${input} w-auto`} value={data?.month ?? ""} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => <option key={m} value={m}>{m}{data && m === data.current ? " (running)" : ""}</option>)}
          </select>
          {data && !data.finalised && data.month < data.current && (
            <button
              disabled={busy}
              onClick={async () => {
                if (!confirm(`Hand out ${data.month} prizes now and email the winners? This can't be undone.`)) return;
                setBusy(true);
                try {
                  await call("/api/admin/challenge", { action: "finalise", month: data.month });
                  await load(data.month);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
              className="btn-brand rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Finalise now
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
        {data && (
          <p className="mt-2 text-sm text-white/60">
            {data.month === data.current ? "This month is still running. Prizes are handed out automatically on the 1st." : data.finalised ? "Finalised: prizes are below." : "Ended, not finalised yet. The daily run does it automatically."}
          </p>
        )}
        {data && data.prizes.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="text-white/50"><tr><th className="py-2">Winner</th><th>Mobile</th><th>Prize</th><th>Score</th><th>Code</th><th>Status</th></tr></thead>
              <tbody>
                {data.prizes.map((p) => (
                  <tr key={p.claimCode} className="border-t border-white/10 text-white/85">
                    <td className="py-2">{p.name}{p.area === "outside" ? " (outside NCR)" : ""}</td>
                    <td><a className="text-sky" href={`tel:+91${p.phone}`}>{p.phone}</a></td>
                    <td>{PRIZE_NAMES[p.prize]}</td>
                    <td>{NAMES[p.level]} {Math.round((p.correct / 20) * 100)}%</td>
                    <td className="font-mono">{p.claimCode}</td>
                    <td>{p.status === "redeemed" ? `Collected${p.redeemedBy ? ` (${p.redeemedBy})` : ""}` : p.status === "void" ? "Cancelled" : "Waiting"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.attempts.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <h3 className="font-semibold text-white">Attempts ({data.attempts.length})</h3>
            <p className="text-xs text-white/50">Flag = 3+ tab switches (kept out of prizes) or a network used by 3+ accounts (check before handing over a prize).</p>
            <table className="mt-2 w-full min-w-[40rem] text-left text-sm">
              <thead className="text-white/50"><tr><th className="py-2">Player</th><th>Mobile</th><th>Level</th><th>Score</th><th>Time</th><th>Flags</th></tr></thead>
              <tbody>
                {data.attempts.map((a, i) => (
                  <tr key={i} className="border-t border-white/10 text-white/85">
                    <td className="py-2">{a.name}</td>
                    <td>{a.phone}</td>
                    <td>{NAMES[a.level]}</td>
                    <td>{a.finished && a.correct !== null ? `${Math.round((a.correct / 20) * 100)}%` : "playing"}</td>
                    <td>{a.totalMs ? `${Math.round(a.totalMs / 1000)}s` : ""}</td>
                    <td className="text-amber-200">{a.tabSwitches >= 3 && <span className="mr-2 inline-flex items-center gap-1"><Flag className="h-3 w-3" />{a.tabSwitches} switches</span>}{a.sharedNetwork && <span className="inline-flex items-center gap-1"><Flag className="h-3 w-3" />shared network</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AddQuestion({ onAdded }: { onAdded: () => void }) {
  const [f, setF] = useState({ level: "beginner" as LevelId, topic: "", prompt: "", options: ["", "", "", ""], answer: 0, why: "", source: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className={`${card} space-y-3`}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await call("/api/admin/challenge", { action: "add", ...f });
          setF({ ...f, topic: "", prompt: "", options: ["", "", "", ""], answer: 0, why: "", source: "" });
          onAdded();
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3 className="flex items-center gap-2 font-semibold text-white"><Plus className="h-4 w-4" /> Add your own question (live straight away)</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <select className={input} value={f.level} onChange={(e) => setF({ ...f, level: e.target.value as LevelId })}>
          {(Object.keys(NAMES) as LevelId[]).map((l) => <option key={l} value={l}>{NAMES[l]}</option>)}
        </select>
        <input className={input} placeholder="Topic (e.g. Nutrition)" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} />
      </div>
      <textarea className={input} rows={2} placeholder="Question" value={f.prompt} onChange={(e) => setF({ ...f, prompt: e.target.value })} required />
      {f.options.map((o, i) => (
        <label key={i} className="flex items-center gap-2">
          <input type="radio" name="answer" checked={f.answer === i} onChange={() => setF({ ...f, answer: i })} aria-label={`Option ${i + 1} is right`} />
          <input className={input} placeholder={`Option ${"ABCD"[i]}${f.answer === i ? " (right answer)" : ""}`} value={o} onChange={(e) => setF({ ...f, options: f.options.map((x, j) => (j === i ? e.target.value : x)) })} required />
        </label>
      ))}
      <input className={input} placeholder="Why it's right (optional)" value={f.why} onChange={(e) => setF({ ...f, why: e.target.value })} />
      <input className={input} placeholder="Source (e.g. ICMR-NIN 2024)" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} />
      <p className="text-xs text-white/50">Education only: no cure claims, no guarantees, no medicine doses. The radio button marks the right answer; players see the options shuffled.</p>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button disabled={busy} className="btn-brand rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">Add question</button>
    </form>
  );
}

function Questions() {
  const [items, setItems] = useState<Q[] | null>(null);
  const [level, setLevel] = useState<LevelId>("beginner");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => call<{ questions: Q[] }>("/api/admin/challenge?view=questions").then((j) => setItems(j.questions), (e) => setError((e as Error).message)), []);
  useEffect(() => {
    load();
  }, [load]);
  const list = useMemo(() => (items ?? []).filter((q) => q.level === level), [items, level]);
  const live = list.filter((q) => q.state === "approved").length;
  const waiting = list.filter((q) => q.state === "waiting" || q.state === "changed");
  async function review(ids: string[], status: "approved" | "retired") {
    setBusy(true);
    try {
      await call("/api/admin/challenge", { action: "review", ids, status });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      <div className={card}>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(NAMES) as LevelId[]).map((l) => (
            <button key={l} onClick={() => setLevel(l)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ${l === level ? "bg-brand text-white ring-brand" : "text-white/75 ring-white/20"}`}>{NAMES[l]}</button>
          ))}
        </div>
        <p className="mt-3 text-sm text-white/70">
          <strong className="text-white">{live}</strong> live in {NAMES[level]}. A level opens to players once 20 or more are live. {waiting.length} waiting for your review.
        </p>
        {waiting.length > 0 && (
          <button disabled={busy} onClick={() => confirm(`Approve all ${waiting.length} waiting ${NAMES[level]} questions? Read them first.`) && review(waiting.map((q) => q.id), "approved")} className="mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-400/40 disabled:opacity-50">
            Approve all {waiting.length} waiting
          </button>
        )}
        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      </div>
      {!items ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-white/50" /> : (
        <ul className="space-y-3">
          {list.map((q) => (
            <li key={q.id} className={card}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono text-white/50">{q.id}</span>
                <span className="text-white/50">{q.topic}</span>
                <span className={`rounded-full px-2 py-0.5 ${STATE_TONE[q.state]}`}>{q.state === "changed" ? "changed since approval" : q.state}</span>
                {q.custom && <span className="rounded-full bg-sky/15 px-2 py-0.5 text-sky">your question</span>}
              </div>
              <p className="mt-2 font-medium text-white">{q.prompt}</p>
              <ol className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                {q.options.map((o, i) => <li key={i} className={i === q.answer ? "font-semibold text-emerald-300" : "text-white/70"}>{"ABCD"[i]}. {o}{i === q.answer ? " ✓" : ""}</li>)}
              </ol>
              {q.why && <p className="mt-2 text-xs text-white/55">{q.why} <span className="text-white/40">Source: {q.source}</span></p>}
              <div className="mt-3 flex gap-2">
                {q.state !== "approved" && <button disabled={busy} onClick={() => review([q.id], "approved")} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-400/40"><Check className="h-4 w-4" /> Approve</button>}
                {q.state !== "retired" && <button disabled={busy} onClick={() => review([q.id], "retired")} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-white/70 ring-1 ring-white/20"><X className="h-4 w-4" /> Retire</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <AddQuestion onAdded={load} />
    </div>
  );
}

export function ChallengeAdmin({ canManage }: { canManage: boolean }) {
  const [tab, setTab] = useState<"month" | "questions">("month");
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <a href="/admin" className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white"><ArrowLeft className="h-4 w-4" /> Admin</a>
      <h1 className="mt-2 flex items-center gap-2 font-display text-2xl text-white"><Trophy className="h-6 w-6 text-amber-300" /> Knowledge Challenge</h1>
      <p className="mt-1 text-sm text-white/60">Runs by itself: players are scored automatically, those who agree go to Leads, and each month&apos;s prizes are handed out on the 1st with winner emails. <a className="text-sky" href="/challenge" target="_blank" rel="noopener">Open the public page</a></p>
      {canManage && (
        <div className="mt-4 flex gap-2">
          {([["month", "Winners & desk"], ["questions", "Questions"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ${tab === k ? "bg-brand text-white ring-brand" : "text-white/75 ring-white/20"}`}>{label}</button>
          ))}
        </div>
      )}
      <div className="mt-5">{tab === "questions" && canManage ? <Questions /> : <MonthView />}</div>
    </main>
  );
}
