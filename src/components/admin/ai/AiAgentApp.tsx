"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Bot, CircleAlert, Hand, Loader2, Save, Send, Sparkles } from "lucide-react";
import type { AgentMode, AgentSettings } from "@/lib/ai/agent-core";
import type { AgentStats } from "@/lib/ai/agent";

type Data = {
  settings: AgentSettings;
  stats: AgentStats;
  configured: boolean;
  modes: { id: AgentMode; label: string; hint: string }[];
  models: { id: string; label: string; hint: string }[];
  maxKnowledge: number;
  maxCap: number;
};

const card = "rounded-2xl bg-white/[.04] p-4 ring-1 ring-white/10 sm:p-5";
const input = "w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 placeholder:text-white/35 focus:outline-none focus:ring-brand/60";

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

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
const usd = (n: number) => `$${n.toFixed(n > 0 && n < 1 ? 3 : 2)}`;
const masked = (p: string | null) => (p ? `+${p.slice(0, -10)} ${p.slice(-10, -7)}•••${p.slice(-3)}` : "");
const SOURCE = { auto: "Answered on WhatsApp", draft: "Draft in Live chat", test: "Test" } as const;

const EXAMPLES = ["Is there parking for bikes?", "Kya ladies ke liye alag timing hai?", "Do you have a steam bath?", "Do you sell gift cards?", "Can I join if I have a knee injury?"];

/** AI agent: what it may answer, how it's set up, a playground to try it, and everything it wrote. */
export function AiAgentApp() {
  const [data, setData] = useState<Data | null>(null);
  const [form, setForm] = useState<AgentSettings | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [testing, setTesting] = useState(false);
  const [answer, setAnswer] = useState<{ reply: string; handoff: boolean; reason: string } | null>(null);
  const [testError, setTestError] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await call<Data>("/api/admin/ai-agent");
      setData(d);
      setForm((f) => f ?? d.settings);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setNote("");
    try {
      const r = await call<{ settings: AgentSettings }>("/api/admin/ai-agent", { action: "save", settings: form });
      setForm(r.settings);
      setNote("Saved.");
      await load();
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function test(question = q) {
    if (!question.trim() || testing) return;
    setQ(question);
    setTesting(true);
    setTestError("");
    setAnswer(null);
    try {
      const r = await call<{ answer: { reply: string; handoff: boolean; reason: string } }>("/api/admin/ai-agent", { action: "test", question });
      setAnswer(r.answer);
      await load();
    } catch (e) {
      setTestError((e as Error).message);
    } finally {
      setTesting(false);
    }
  }

  const dirty = data && form && JSON.stringify(form) !== JSON.stringify(data.settings);
  const s = data?.stats;
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 text-white sm:py-8">
      <div className="flex items-center gap-3">
        <a href="/admin" aria-label="Back to Command Center" className="rounded-lg p-1.5 text-white/70 hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </a>
        <div className="min-w-0">
          <h1 className="font-display flex items-center gap-2 text-2xl sm:text-3xl">
            <Bot className="h-7 w-7 text-violet-300" /> AI agent
          </h1>
          <p className="text-sm text-white/60">Answers WhatsApp questions from your website&apos;s own facts, and hands everything else to a coach.</p>
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p>}
      {data && !data.configured && (
        <div className="flex gap-3 rounded-xl bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            The agent needs a Claude API key. Create one at <b>platform.claude.com</b> (API keys), then add it in Vercel → Project → Settings → Environment Variables as{" "}
            <code className="rounded bg-black/30 px-1">ANTHROPIC_API_KEY</code> (Production, Sensitive) and redeploy. Never paste the key in a chat.
          </p>
        </div>
      )}

      {s && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { k: "Answered today", v: s.today.answered, sub: `${s.days30.answered} in 30 days` },
            { k: "Handed to a coach today", v: s.today.handedOff, sub: `${s.days30.handedOff} in 30 days` },
            { k: "Drafts today", v: s.today.drafts, sub: `${s.days30.drafts} in 30 days` },
            { k: "Cost today", v: usd(s.today.costUsd), sub: `${usd(s.days30.costUsd)} in 30 days (approx.)` },
          ].map((x) => (
            <div key={x.k} className={card}>
              <p className="text-xs text-white/55">{x.k}</p>
              <p className="font-display mt-1 text-2xl">{x.v}</p>
              <p className="mt-0.5 text-[11px] text-white/45">{x.sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {form && data && (
          <form onSubmit={save} className={`${card} space-y-4`}>
            <h2 className="font-semibold">Settings</h2>
            <fieldset className="space-y-2">
              <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/50">Mode</legend>
              {data.modes.map((m) => (
                <label key={m.id} className={`flex cursor-pointer gap-3 rounded-xl p-3 ring-1 ${form.mode === m.id ? "bg-violet-500/15 ring-violet-400/50" : "ring-white/10 hover:bg-white/5"}`}>
                  <input type="radio" name="mode" className="mt-1 accent-violet-400" checked={form.mode === m.id} onChange={() => setForm({ ...form, mode: m.id })} />
                  <span>
                    <span className="block text-sm font-semibold">{m.label}</span>
                    <span className="block text-xs text-white/55">{m.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/50">Model</span>
                <select className={input} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value as AgentSettings["model"] })}>
                  {data.models.map((m) => (
                    <option key={m.id} value={m.id} className="bg-neutral-900">
                      {m.label}: {m.hint}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/50">Auto-replies per day (max)</span>
                <input type="number" min={0} max={data.maxCap} className={input} value={form.dailyCap} onChange={(e) => setForm({ ...form, dailyCap: Number(e.target.value) })} />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/50">Desk notes (extra facts the agent may use)</span>
              <textarea
                rows={7}
                maxLength={data.maxKnowledge}
                className={input}
                value={form.knowledge}
                onChange={(e) => setForm({ ...form, knowledge: e.target.value })}
                placeholder={"One fact per line, for example:\nBike and car parking in front of the gym, free.\nSeparate ladies' changing room with lockers.\nNo steam or sauna."}
              />
              <span className="mt-1 block text-[11px] text-white/45">
                Prices, timings, plans, programs and FAQs already come from the website. Add only what isn&apos;t there. {form.knowledge.length}/{data.maxKnowledge}
              </span>
            </label>
            <div className="flex items-center gap-3">
              <button disabled={saving || !dirty} className="btn-brand inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold disabled:opacity-40">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </button>
              {note && <p className="text-sm text-white/70">{note}</p>}
            </div>
            <p className="text-xs leading-relaxed text-white/50">
              Auto-reply only answers typed questions the keyword bot has no answer for. PRICE, DIET, TRIAL, TIMING and buttons work as before. It never answers while a coach is chatting
              (the bot pauses for 2 hours after you reply) and pauses itself when it hands a chat to a coach.
            </p>
          </form>
        )}

        <div className={`${card} space-y-3`}>
          <h2 className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-violet-300" /> Try it
          </h2>
          <p className="text-xs text-white/55">Ask what a customer would. Nothing is sent. Uses the saved settings and desk notes.</p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((x) => (
              <button key={x} type="button" disabled={testing || !data?.configured} onClick={() => test(x)} className="rounded-full bg-white/[.06] px-3 py-1 text-xs text-white/75 ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-40">
                {x}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              test();
            }}
            className="flex gap-2"
          >
            <input className={input} value={q} maxLength={1000} onChange={(e) => setQ(e.target.value)} placeholder="Type a customer question…" />
            <button disabled={testing || !q.trim() || !data?.configured} aria-label="Ask" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500 disabled:opacity-40">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
          {testError && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-100">{testError}</p>}
          {answer && (
            <div className="space-y-2">
              <p className="whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-emerald-600/80 px-3 py-2 text-sm">{answer.reply}</p>
              {answer.handoff && (
                <p className="flex items-center gap-1.5 text-xs text-amber-200">
                  <Hand className="h-3.5 w-3.5" /> Would hand to a coach: {answer.reason || "needs a person"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {s && (
        <div className={card}>
          <h2 className="mb-3 font-semibold">What the agent wrote (last 30 days)</h2>
          {s.recent.length === 0 ? (
            <p className="text-sm text-white/55">Nothing yet.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {s.recent.map((r) => (
                <li key={r.id} className="space-y-1.5 py-3 text-sm">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/50">
                    <span>{when(r.at)}</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5">{SOURCE[r.source as keyof typeof SOURCE] ?? r.source}</span>
                    {r.peer && <span>{masked(r.peer)}</span>}
                    {r.handoff && <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-100">Handed off{r.reason ? `: ${r.reason}` : ""}</span>}
                    {r.source === "auto" && !r.error && !r.sent && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-red-100">Not delivered</span>}
                    {r.by && <span>{r.by.split("@")[0]}</span>}
                  </p>
                  <p className="text-white/80">
                    <span className="text-white/45">Q:</span> {r.question}
                  </p>
                  {r.error ? <p className="text-red-200">{r.error}</p> : <p className="whitespace-pre-wrap text-emerald-100/90">{r.answer}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
