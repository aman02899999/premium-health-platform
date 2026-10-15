"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Bot, Check, Copy, Gift, Megaphone, Inbox, Loader2, MessageCircle, Phone, Play, Plus, Salad, Search, Send, TrendingUp, Users, X } from "lucide-react";
import { addDays, daysBetween, expiryFor, formatDate, parseDuration } from "@/lib/growth/dates";
import { waLink } from "@/lib/growth/messages";
import type { DietIntake } from "@/lib/growth/diet-intake";
import { DIET_PLANS } from "@/lib/growth/config";
import { upcomingPosts, type DailyPost, type PostBiz } from "@/lib/growth/daily-posts";
import type { SocialStatus } from "@/lib/social/automation";
import { Social } from "./Social";

type Member = { id: string; name: string; phone: string; email: string | null; planName: string; startOn: string; expiresOn: string; source: "online" | "desk"; referralCode: string; renewToken: string; reminders: boolean; notes: string };
type Lead = { id: string; createdAt: string; name: string; phone: string; goal: string; message: string; source: string; status: LeadStatus; contactedAt: string | null; notes: string; followUps: boolean; email?: string | null; interest?: string };
type LeadStatus = "new" | "contacted" | "trial" | "joined" | "lost";
type Msg = { id: string; createdAt: string; channel: string; to: string; toName: string; kind: string; body: string; status: "pending" | "sent" | "failed" | "cancelled"; attempts: number; lastError: string | null; sentAt: string | null; sentBy: string | null };
type DietOrder = { id: string; createdAt: string; name: string; phone: string; email: string | null; amountPaise: number; intake: DietIntake; paidAt: string | null; stage: "new" | "draft_ready" | "in_progress" | "sent" | "refunded"; sentAt: string | null; plan: string; planPath: string | null; planGeneratedAt: string | null ; userId?: string | null; extraGenerations?: number; accessUntil?: string | null; revokedAt?: string | null; versions?: { id: string; version: number; createdAt: string; source: string; status: "draft" | "sent" | "rejected" }[]; entitlement?: { allowed: number; used: number; remaining: number; accessUntil: string; nextAt: string | null; reason: string } };
type Reward = { id: string; createdAt: string; referrer: string; referrerCode: string; referred: string; days: number };
type Unapplied = { razorpayOrderId: string; name: string; phone: string; planName: string; duration: string; paidAt: string };
type Data = { today: string; siteUrl: string; channels: { whatsappApi: boolean; email: boolean; cronSecret: boolean; storage?: boolean; autoSend?: "off" | "no-conditions" | "all" }; members: Member[]; leads: Lead[]; outbox: Msg[]; dietOrders: DietOrder[]; rewards: Reward[]; unapplied: Unapplied[]; social: SocialStatus | null; system?: { lastRun: { at: string; source: string; ok: boolean; summary: string } | null; recent: boolean; setup: { key: string; label: string; on: boolean; why: string }[] } };
type Tab = "today" | "marketing" | "social" | "messages" | "members" | "leads" | "diet" | "referrals";

const KIND: Record<string, string> = {
  "renew-7": "Renewal · 7 days",
  "renew-1": "Renewal · last day",
  "expired-3": "Win-back · expired",
  welcome: "Welcome + referral code",
  "lead-0": "Lead · thank you",
  "lead-2": "Lead · day 2",
  "lead-5": "Lead · day 5",
  "diet-received": "Diet chart · paid",
  "referral-bonus": "Referral bonus",
};
const STATUS_TONE: Record<LeadStatus, string> = { new: "bg-sky-500/15 text-sky-200", contacted: "bg-amber-500/15 text-amber-200", trial: "bg-violet-500/15 text-violet-200", joined: "bg-emerald-500/15 text-emerald-200", lost: "bg-white/5 text-white/45" };
const rupees = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

async function post(body: Record<string, unknown>) {
  const res = await fetch("/api/admin/growth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

export function GrowthApp({ plans, gymName, postBiz }: { plans: { name: string; duration: string }[]; gymName: string; postBiz: PostBiz }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("today");
  useEffect(() => {
    // Deep link from the coach's "new order" email: /admin/growth?tab=diet
    const t = new URLSearchParams(window.location.search).get("tab");
    const found = (["today", "marketing", "social", "messages", "members", "leads", "diet", "referrals"] as const).find((x) => x === t);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL after hydration
    if (found) setTab(found);
  }, []);
  const [flash, setFlash] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/growth", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error || "Couldn't load");
    else {
      setError("");
      setData(json);
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void load();
  }, [load]);

  const act = async (body: Record<string, unknown>, ok?: string) => {
    setBusy(true);
    try {
      const out = await post(body);
      if (ok) setFlash(ok);
      await load();
      return out;
    } catch (e) {
      setFlash((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(""), 3500);
    return () => clearTimeout(t);
  }, [flash]);

  const stats = useMemo((): Stats | null => {
    if (!data) return null;
    const t = data.today;
    const left = (m: Member) => daysBetween(t, m.expiresOn);
    return {
      active: data.members.filter((m) => left(m) >= 0).length,
      expiring: data.members.filter((m) => left(m) >= 0 && left(m) <= 7),
      expired: data.members.filter((m) => left(m) < 0 && left(m) >= -30),
      newLeads: data.leads.filter((l) => l.status === "new"),
      pending: data.outbox.filter((m) => m.status === "pending"),
      dietToDo: data.dietOrders.filter((o) => o.stage === "new" || o.stage === "draft_ready" || o.stage === "in_progress"),
      joinedFromLeads: data.leads.filter((l) => l.status === "joined").length,
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
          <a href="/admin" aria-label="Back to admin" className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-2 text-sm text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Admin</span>
          </a>
          <h1 className="font-display min-w-0 truncate text-lg sm:text-xl">
            <TrendingUp className="mr-1.5 inline h-5 w-5 text-emerald-300" /> Growth &amp; renewals
          </h1>
          <button type="button" disabled={busy || !data} onClick={() => act({ action: "run-daily" }, "Daily automation ran — due messages are queued.")} className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 hover:text-white disabled:opacity-50">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} <span className="sm:hidden">Run now</span>
            <span className="hidden sm:inline">Run today&apos;s automation</span>
          </button>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2" role="tablist">
          {(
            [
              ["today", "Today", TrendingUp, stats ? stats.pending.length + stats.expiring.length : 0],
              ["marketing", "Marketing", Megaphone, 0],
              ["social", "Instagram & WhatsApp", Bot, 0],
              ["messages", "Messages", MessageCircle, stats?.pending.length ?? 0],
              ["members", "Members", Users, 0],
              ["leads", "Leads", Inbox, stats?.newLeads.length ?? 0],
              ["diet", "Diet orders", Salad, stats?.dietToDo.length ?? 0],
              ["referrals", "Referrals", Gift, 0],
            ] as const
          ).map(([id, label, Icon, n]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${tab === id ? "bg-white/10 text-white" : "text-white/55 hover:text-white"}`}>
              <Icon className="h-3.5 w-3.5" /> {label}
              {n > 0 && <span className="rounded-full bg-brand px-1.5 text-[10px] text-white">{n}</span>}
            </button>
          ))}
        </nav>
      </header>

      {flash && <p className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink shadow-xl">{flash}</p>}

      <main className="mx-auto max-w-7xl px-4 py-6">
        {error && <p className="rounded-2xl bg-red-500/15 p-4 text-sm text-red-200">{error}</p>}
        {!data && !error && (
          <p className="flex items-center gap-2 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        )}
        {data && stats && (
          <>
            {tab === "today" && <Today data={data} stats={stats} go={setTab} act={act} />}
            {tab === "marketing" && <Marketing today={data.today} biz={postBiz} />}
            {tab === "social" && <Social status={data.social} siteUrl={data.siteUrl} />}
            {tab === "messages" && <Messages data={data} act={act} />}
            {tab === "members" && <Members data={data} plans={plans} act={act} gymName={gymName} reload={load} />}
            {tab === "leads" && <Leads data={data} act={act} />}
            {tab === "diet" && <DietOrders data={data} act={act} />}
            {tab === "referrals" && <Referrals data={data} />}
          </>
        )}
      </main>
    </div>
  );
}

type Act = (body: Record<string, unknown>, ok?: string) => Promise<unknown>;
type Stats = { active: number; expiring: Member[]; expired: Member[]; newLeads: Lead[]; pending: Msg[]; dietToDo: DietOrder[]; joinedFromLeads: number };

function Card({ label, value, sub, tone = "text-white", onClick }: { label: string; value: string | number; sub?: string; tone?: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-2xl bg-white/[.04] p-4 text-left ring-1 ring-white/10 transition hover:ring-white/25">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">{label}</p>
      <p className={`mt-1 font-display text-3xl ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-white/45">{sub}</p>}
    </button>
  );
}

/** Did the daily automation run, and which settings are still missing in Vercel. */
function SystemCard({ system }: { system: NonNullable<Data["system"]> }) {
  const r = system.lastRun;
  const fresh = r && r.ok && system.recent;
  const missing = system.setup.filter((x) => !x.on);
  return (
    <div className="rounded-2xl bg-white/[.04] p-4 text-sm ring-1 ring-white/10">
      <p className={`flex items-center gap-2 font-semibold ${fresh ? "text-emerald-200" : "text-amber-200"}`}>
        {fresh ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        {r ? `Daily automation last ran ${when(r.at)} (${r.source === "cron" ? "by the schedule" : "by you"})${r.ok ? "" : " and FAILED"}` : "The daily automation hasn't run yet"}
        {!fresh && r?.ok ? " — more than a day ago" : ""}
      </p>
      {missing.length > 0 ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-white/70">
            {missing.length} setting{missing.length === 1 ? "" : "s"} missing in Vercel — {missing.map((m) => m.label).join(", ")}
          </summary>
          <ul className="mt-2 grid gap-1.5">
            {system.setup.map((x) => (
              <li key={x.key} className="flex gap-2 text-xs">
                <span className={x.on ? "text-emerald-300" : "text-red-300"}>{x.on ? "✓" : "✗"}</span>
                <span>
                  <b className="text-white/85">{x.label}</b> <code className="text-white/40">{x.key}</code> — <span className="text-white/60">{x.why}</span>
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : (
        <p className="mt-1 text-xs text-emerald-200/80">Every setting is in place.</p>
      )}
    </div>
  );
}

function Today({ data, stats, go, act }: { data: Data; stats: Stats; go: (t: Tab) => void; act: Act }) {
  return (
    <div className="grid gap-5">
      <div className={`rounded-2xl p-4 text-sm ring-1 ${data.channels.whatsappApi ? "bg-emerald-500/10 ring-emerald-400/30" : "bg-amber-500/10 ring-amber-400/30"}`}>
        {data.channels.whatsappApi ? (
          <p>WhatsApp Business API is connected: reminders and follow-ups are sent automatically every morning at 7:45 am.</p>
        ) : (
          <p>
            <b>One-tap mode.</b> The WhatsApp Business API isn&apos;t connected yet, so due messages wait in <b>Messages</b>. Tap “Open WhatsApp” on each to send it from the gym phone. Once the API keys are added in Vercel, the same messages go out automatically.
          </p>
        )}
        {!data.channels.cronSecret && <p className="mt-1 text-white/60">The daily schedule needs CRON_SECRET set in Vercel; until then, press “Run today&apos;s automation” once a day.</p>}
      </div>

      {data.system && <SystemCard system={data.system} />}

      {data.unapplied.length > 0 && (
        <div className="rounded-2xl bg-red-500/10 p-4 text-sm ring-1 ring-red-400/30">
          <p className="flex items-center gap-2 font-bold text-red-200">
            <AlertTriangle className="h-4 w-4" /> {data.unapplied.length} paid online order(s) aren&apos;t on the members list yet
          </p>
          <ul className="mt-2 grid gap-1.5">
            {data.unapplied.map((o) => (
              <li key={o.razorpayOrderId} className="flex flex-wrap items-center gap-2 text-white/75">
                {o.name} · {o.phone} · {o.planName} ({o.duration}) · paid {when(o.paidAt)}
                {parseDuration(o.duration) ? (
                  <button type="button" onClick={() => act({ action: "apply-order", razorpayOrderId: o.razorpayOrderId }, "Added to members")} className="rounded-lg border border-white/20 px-2 py-0.5 text-xs">
                    Add now
                  </button>
                ) : (
                  <span className="text-xs text-amber-200">Plan length can&apos;t be read — add them in Members by hand.</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Card label="Messages to send" value={stats.pending.length} tone={stats.pending.length ? "text-brand" : "text-white"} onClick={() => go("messages")} />
        <Card label="Expiring ≤ 7 days" value={stats.expiring.length} tone={stats.expiring.length ? "text-amber-300" : "text-white"} onClick={() => go("members")} />
        <Card label="Expired (30 days)" value={stats.expired.length} sub="win-back list" onClick={() => go("members")} />
        <Card label="Active members" value={stats.active} onClick={() => go("members")} />
        <Card label="New leads" value={stats.newLeads.length} sub={`${stats.joinedFromLeads} joined so far`} onClick={() => go("leads")} />
        <Card label="Diet charts to prepare" value={stats.dietToDo.length} onClick={() => go("diet")} />
      </div>

      {stats.expiring.length > 0 && (
        <section className="rounded-2xl bg-white/[.03] p-4 ring-1 ring-white/10">
          <h2 className="font-display text-lg">Ending this week</h2>
          <ul className="mt-2 divide-y divide-white/5 text-sm">
            {stats.expiring.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-2 py-2">
                <b>{m.name}</b>
                <span className="text-white/55">
                  {m.planName} · ends {formatDate(m.expiresOn)} ({daysBetween(data.today, m.expiresOn)} days)
                </span>
                <a href={`tel:+91${m.phone}`} className="ml-auto inline-flex items-center gap-1 text-xs text-sky-300">
                  <Phone className="h-3.5 w-3.5" /> Call
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Messages({ data, act }: { data: Data; act: Act }) {
  const [showAll, setShowAll] = useState(false);
  const pending = data.outbox.filter((m) => m.status === "pending");
  const history = data.outbox.filter((m) => m.status !== "pending").slice(0, showAll ? 400 : 30);
  return (
    <div className="grid gap-5">
      <section>
        <h2 className="font-display text-lg">To send ({pending.length})</h2>
        {pending.length === 0 && <p className="mt-2 text-sm text-white/50">Nothing waiting. Due reminders and follow-ups appear here each morning.</p>}
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {pending.map((m) => (
            <li key={m.id} className="rounded-2xl bg-white/[.04] p-4 ring-1 ring-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-soft">{KIND[m.kind] ?? m.kind}</p>
              <p className="font-semibold">
                {m.toName} <span className="text-xs font-normal text-white/45">+{m.to}</span>
              </p>
              <p className="mt-2 whitespace-pre-wrap rounded-xl bg-black/30 p-3 text-sm text-white/80">{m.body}</p>
              {m.lastError && <p className="mt-1 text-xs text-amber-200">API error: {m.lastError}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={waLink(m.to, m.body)} target="_blank" rel="noopener noreferrer" onClick={() => setTimeout(() => act({ action: "message", id: m.id, status: "sent" }, "Marked as sent"), 400)} className="inline-flex items-center gap-1.5 rounded-full bg-[#25d366] px-4 py-2 text-xs font-bold text-white">
                  <Send className="h-3.5 w-3.5" /> Open WhatsApp &amp; mark sent
                </a>
                <button type="button" onClick={() => act({ action: "message", id: m.id, status: "cancelled" }, "Skipped")} className="rounded-full border border-white/15 px-3 py-2 text-xs text-white/70">
                  Skip
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-display text-lg">History</h2>
        <ul className="mt-2 divide-y divide-white/5 text-sm">
          {history.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-2 py-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${m.status === "sent" ? "bg-emerald-500/15 text-emerald-200" : m.status === "failed" ? "bg-red-500/15 text-red-200" : "bg-white/5 text-white/45"}`}>{m.status}</span>
              <span>{m.toName}</span>
              <span className="text-white/45">{KIND[m.kind] ?? m.kind}</span>
              <span className="ml-auto text-xs text-white/40">
                {m.sentAt ? when(m.sentAt) : when(m.createdAt)}
                {m.sentBy ? ` · ${m.sentBy}` : ""}
              </span>
              {m.status !== "sent" && (
                <button type="button" onClick={() => act({ action: "message", id: m.id, status: "pending" }, "Moved back to To send")} className="text-xs text-sky-300">
                  Retry
                </button>
              )}
            </li>
          ))}
        </ul>
        {!showAll && data.outbox.length > 30 && (
          <button type="button" onClick={() => setShowAll(true)} className="mt-2 text-xs text-sky-300">
            Show all
          </button>
        )}
      </section>
    </div>
  );
}

type ImportResult = {
  committed: boolean;
  columns: Record<string, string>;
  counts: { add: number; update: number; unchanged: number; errors: number; duplicates: number; remindSoon: number };
  add: { row: number; name: string; phone: string; planName: string; expiresOn: string }[];
  update: { row: number; name: string; phone: string; expiresOn: string; was: string }[];
  errors: { row: number; message: string }[];
};
const FIELD_LABEL: Record<string, string> = { name: "Name", phone: "Mobile", email: "Email", plan: "Plan", start: "Start date", end: "End date", duration: "Duration", notes: "Notes" };
const TEMPLATE = "Name,Mobile,Email,Plan,Start date,End date,Notes\nRahul Kumar,9876543210,rahul@example.com,Quarterly,01/09/2026,30/11/2026,Morning batch\n";

/** Upload a CSV or Excel member list: a preview first (nothing saved), then one click to import. */
function ImportMembers({ reload }: { reload: () => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async (f: File, commit: boolean) => {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", f);
      form.set("commit", commit ? "1" : "0");
      const res = await fetch("/api/admin/members/import", { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult(null);
        setError(json.error || "Couldn't read the file.");
        return;
      }
      setResult(json as ImportResult);
      if (commit) await reload();
    } finally {
      setBusy(false);
    }
  };
  const close = () => {
    setFile(null);
    setResult(null);
    setError("");
  };
  const c = result?.counts;
  return (
    <>
      <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold ${busy ? "opacity-60" : ""}`}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />} Import CSV / Excel
        <input
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setFile(f);
            setResult(null);
            void send(f, false);
          }}
        />
      </label>
      {(error || result) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label="Import members">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-ink p-4 text-sm sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="font-bold">{result?.committed ? "Import finished" : "Check before importing"}</h2>
              <span className="truncate text-xs text-white/50">{file?.name}</span>
              <button type="button" onClick={close} aria-label="Close" className="ml-auto rounded-lg p-1 text-white/60 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            {error && (
              <div className="space-y-3">
                <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-rose-100">{error}</p>
                <p className="text-xs text-white/60">
                  Needed columns: Name, Mobile and an End date (or a Start date with a Duration such as &quot;3 months&quot;). Plan, Email and Notes are optional. Dates like 15/10/2026 or 15-Oct-2026 work.{" "}
                  <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`} download="members-template.csv" className="font-semibold text-sky-300 underline">
                    Download a template
                  </a>
                </p>
              </div>
            )}
            {result && c && (
              <div className="space-y-4">
                <p className="text-xs text-white/60">
                  Columns found:{" "}
                  {Object.entries(result.columns)
                    .map(([k, v]) => `${FIELD_LABEL[k] ?? k} ← "${v}"`)
                    .join(" · ")}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    [result.committed ? "Added" : "New members", c.add, "text-emerald-300"],
                    [result.committed ? "Extended" : "Later end date", c.update, "text-sky-300"],
                    ["Already up to date", c.unchanged, "text-white/70"],
                    ["Rows skipped", c.errors + c.duplicates, c.errors + c.duplicates ? "text-amber-300" : "text-white/70"],
                  ].map(([label, n, color]) => (
                    <div key={label as string} className="rounded-xl border border-white/10 p-3">
                      <p className={`text-2xl font-bold ${color}`}>{n as number}</p>
                      <p className="text-xs text-white/55">{label as string}</p>
                    </div>
                  ))}
                </div>
                {c.remindSoon > 0 && (
                  <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    {c.remindSoon} of them end within a week or ended in the last 10 days, so they get a renewal reminder at the next morning run.
                  </p>
                )}
                {result.add.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-white/70">{result.committed ? "Added" : "Will be added"}
                      {c.add > result.add.length ? ` (first ${result.add.length} of ${c.add})` : ""}</p>
                    <ul className="divide-y divide-white/5 rounded-xl border border-white/10 text-xs">
                      {result.add.map((m) => (
                        <li key={m.row} className="flex flex-wrap gap-x-3 px-3 py-1.5">
                          <span className="font-semibold">{m.name}</span>
                          <span className="text-white/60">{m.phone}</span>
                          <span className="text-white/60">{m.planName}</span>
                          <span className="ml-auto text-white/60">ends {formatDate(m.expiresOn)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.update.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-white/70">Existing members with a later end date in the file</p>
                    <ul className="divide-y divide-white/5 rounded-xl border border-white/10 text-xs">
                      {result.update.map((m) => (
                        <li key={m.row} className="flex flex-wrap gap-x-3 px-3 py-1.5">
                          <span className="font-semibold">{m.name}</span>
                          <span className="text-white/60">{m.phone}</span>
                          <span className="ml-auto text-white/60">
                            {formatDate(m.was)} → {formatDate(m.expiresOn)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.errors.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-amber-200">Rows that will be skipped (fix them in the file and upload again)</p>
                    <ul className="max-h-40 overflow-y-auto rounded-xl border border-amber-400/20 text-xs">
                      {result.errors.map((e, i) => (
                        <li key={`${e.row}-${i}`} className="px-3 py-1">
                          Row {e.row}: {e.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={close} className="rounded-xl border border-white/15 px-3 py-2 text-xs">
                    {result.committed ? "Done" : "Cancel"}
                  </button>
                  {!result.committed && file && c.add + c.update > 0 && (
                    <button type="button" disabled={busy} onClick={() => void send(file, true)} className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-xs font-bold disabled:opacity-60">
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Import {c.add + c.update} member{c.add + c.update === 1 ? "" : "s"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const emptyMember = (today: string) => ({ id: "", name: "", phone: "", email: "", planName: "", startOn: today, expiresOn: addDays(today, 29), notes: "", reminders: true });

function Members({ data, plans, act, gymName, reload }: { data: Data; plans: { name: string; duration: string }[]; act: Act; gymName: string; reload: () => Promise<void> }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "expiring" | "expired">("all");
  const [edit, setEdit] = useState<ReturnType<typeof emptyMember> | null>(null);
  const t = data.today;
  const rows = data.members.filter((m) => {
    const left = daysBetween(t, m.expiresOn);
    if (filter === "active" && left < 0) return false;
    if (filter === "expiring" && (left < 0 || left > 7)) return false;
    if (filter === "expired" && left >= 0) return false;
    const s = q.trim().toLowerCase();
    return !s || m.name.toLowerCase().includes(s) || m.phone.includes(s) || m.referralCode.toLowerCase().includes(s);
  });
  const pickPlan = (name: string) => {
    if (!edit) return;
    const p = plans.find((x) => x.name === name);
    const span = p ? parseDuration(p.duration) : null;
    setEdit({ ...edit, planName: name, expiresOn: span ? expiryFor(edit.startOn, span) : edit.expiresOn });
  };
  const [copied, setCopied] = useState("");
  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(`${what} copied`);
    } catch {
      setCopied(`${what}: ${text}`); // clipboard blocked: show it to copy by hand
    }
  };
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-white/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone or code" className="h-9 rounded-xl border border-white/10 bg-black/30 pl-9 pr-3 text-sm outline-none focus:border-sky" />
        </label>
        {(["all", "active", "expiring", "expired"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize ${filter === f ? "bg-white/10 text-white" : "text-white/50"}`}>
            {f}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          <ImportMembers reload={reload} />
          <button type="button" onClick={() => setEdit(emptyMember(t))} className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-xs font-bold">
            <Plus className="h-3.5 w-3.5" /> Add desk member
          </button>
        </div>
      </div>
      {copied && (
        <p className="break-all rounded-xl bg-white/10 px-3 py-2 text-xs" role="status">
          {copied}
        </p>
      )}
      <p className="text-xs text-white/45">Online payments add members automatically. Add members who pay at the desk here so they get renewal reminders too.</p>

      {edit && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await act({ action: "save-member", ...edit, id: edit.id || undefined }, edit.id ? "Member updated" : "Member added");
            if (ok) setEdit(null);
          }}
          className="grid gap-3 rounded-2xl bg-white/[.04] p-4 ring-1 ring-white/15 sm:grid-cols-2 lg:grid-cols-4"
        >
          {(
            [
              ["name", "Name", "text"],
              ["phone", "Mobile (10 digits)", "tel"],
              ["email", "Email (optional)", "email"],
            ] as const
          ).map(([k, label, type]) => (
            <label key={k} className="text-xs text-white/60">
              {label}
              <input required={k !== "email"} type={type} value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-sm text-white" />
            </label>
          ))}
          <label className="text-xs text-white/60">
            Plan
            <input required list="plan-names" value={edit.planName} onChange={(e) => pickPlan(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-sm text-white" />
            <datalist id="plan-names">
              {plans.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.duration}
                </option>
              ))}
            </datalist>
          </label>
          <label className="text-xs text-white/60">
            Start date
            <input required type="date" value={edit.startOn} onChange={(e) => setEdit({ ...edit, startOn: e.target.value })} className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-sm text-white" />
          </label>
          <label className="text-xs text-white/60">
            Last day of membership
            <input required type="date" value={edit.expiresOn} onChange={(e) => setEdit({ ...edit, expiresOn: e.target.value })} className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-sm text-white" />
          </label>
          <label className="text-xs text-white/60 sm:col-span-2">
            Notes
            <input value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-sm text-white" />
          </label>
          <label className="flex items-center gap-2 text-xs text-white/70">
            <input type="checkbox" checked={edit.reminders} onChange={(e) => setEdit({ ...edit, reminders: e.target.checked })} /> Send renewal reminders
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-bold">
              <Check className="h-3.5 w-3.5" /> Save
            </button>
            <button type="button" onClick={() => setEdit(null)} className="rounded-lg border border-white/15 px-3 py-2 text-xs">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-2xl ring-1 ring-white/10">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-white/[.04] text-left text-[10px] uppercase tracking-wider text-white/45">
            <tr>
              <th className="px-3 py-2">Member</th>
              <th>Plan</th>
              <th>Ends</th>
              <th>Referral code</th>
              <th className="pr-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const left = daysBetween(t, m.expiresOn);
              const renew = `${data.siteUrl}/join?renew=${m.renewToken}`;
              const share = `${data.siteUrl}/join?ref=${m.referralCode}`;
              return (
                <tr key={m.id} className="border-t border-white/5 align-top">
                  <td className="px-3 py-2">
                    <b>{m.name}</b>
                    <span className="block text-xs text-white/45">
                      {m.phone} · {m.source === "online" ? "paid online" : "desk"}
                      {!m.reminders && " · reminders off"}
                    </span>
                  </td>
                  <td className="py-2 text-white/75">{m.planName}</td>
                  <td className="py-2">
                    {formatDate(m.expiresOn)}
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${left < 0 ? "bg-red-500/15 text-red-200" : left <= 7 ? "bg-amber-500/15 text-amber-200" : "bg-emerald-500/15 text-emerald-200"}`}>{left < 0 ? `ended ${-left}d ago` : left === 0 ? "last day" : `${left}d left`}</span>
                  </td>
                  <td className="py-2 font-mono text-xs">{m.referralCode}</td>
                  <td className="py-2 pr-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1.5 text-xs">
                      <a href={waLink(`91${m.phone}`, `Hi ${m.name.split(" ")[0]}, your ${m.planName} membership at ${gymName} ${left < 0 ? "ended" : "ends"} on ${formatDate(m.expiresOn)}. Renew here: ${renew}`)} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#25d366]/20 px-2 py-1 text-emerald-200">
                        Remind
                      </a>
                      <button type="button" onClick={() => copy(renew, "Renewal link")} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1">
                        <Copy className="h-3 w-3" /> Renew link
                      </button>
                      <button type="button" onClick={() => copy(share, "Share link")} className="rounded-lg border border-white/15 px-2 py-1">
                        Share link
                      </button>
                      <button type="button" onClick={() => setEdit({ id: m.id, name: m.name, phone: m.phone, email: m.email ?? "", planName: m.planName, startOn: m.startOn, expiresOn: m.expiresOn, notes: m.notes, reminders: m.reminders })} className="rounded-lg border border-white/15 px-2 py-1">
                        Edit
                      </button>
                      <button type="button" aria-label="Delete member" onClick={() => confirm(`Delete ${m.name}? This also removes their referral history.`) && act({ action: "delete-member", id: m.id }, "Deleted")} className="rounded-lg px-1.5 py-1 text-white/40 hover:text-red-300">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-white/45">
                  No members match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Leads({ data, act }: { data: Data; act: Act }) {
  const [filter, setFilter] = useState<LeadStatus | "open" | "all">("open");
  const rows = data.leads.filter((l) => (filter === "all" ? true : filter === "open" ? l.status === "new" || l.status === "contacted" || l.status === "trial" : l.status === filter));
  const counts = (s: LeadStatus) => data.leads.filter((l) => l.status === s).length;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-1.5">
        {(["open", "new", "contacted", "trial", "joined", "lost", "all"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize ${filter === f ? "bg-white/10 text-white" : "text-white/50"}`}>
            {f}
            {f !== "open" && f !== "all" && ` (${counts(f)})`}
          </button>
        ))}
      </div>
      <p className="text-xs text-white/45">New leads get a WhatsApp thank-you, then follow-ups on day 2 and day 5 while they&apos;re “new” or “contacted”. Mark them joined or lost to stop the follow-ups.</p>
      <ul className="grid gap-3 md:grid-cols-2">
        {rows.map((l) => (
          <li key={l.id} className="rounded-2xl bg-white/[.04] p-4 ring-1 ring-white/10">
            <div className="flex flex-wrap items-start gap-2">
              <div className="mr-auto">
                <p className="font-semibold">{l.name}</p>
                <p className="text-xs text-white/45">
                  {l.phone} · {when(l.createdAt)} · {l.source}
                  {l.email && ` · ${l.email}`}
                  {l.goal && ` · ${l.goal}`}
                </p>
              </div>
              <select value={l.status} onChange={(e) => act({ action: "lead", id: l.id, status: e.target.value }, "Lead updated")} className={`rounded-lg px-2 py-1 text-xs font-bold capitalize ${STATUS_TONE[l.status]}`}>
                {(["new", "contacted", "trial", "joined", "lost"] as const).map((s) => (
                  <option key={s} value={s} className="bg-ink text-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>
            {l.message && <p className="mt-2 text-sm text-white/70">“{l.message}”</p>}
            <textarea defaultValue={l.notes} placeholder="Notes (saved when you click away)" onBlur={(e) => e.target.value !== l.notes && act({ action: "lead", id: l.id, notes: e.target.value }, "Notes saved")} rows={2} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-2 text-xs text-white" />
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <a href={`tel:${l.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1">
                <Phone className="h-3 w-3" /> Call
              </a>
              <a href={waLink(l.phone.replace(/\D/g, "").length === 10 ? `91${l.phone.replace(/\D/g, "")}` : l.phone, `Hi ${l.name.split(" ")[0]}, `)} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#25d366]/20 px-2 py-1 text-emerald-200">
                WhatsApp
              </a>
              <label className="ml-auto flex items-center gap-1.5 text-white/60">
                <input type="checkbox" checked={l.followUps} onChange={(e) => act({ action: "lead", id: l.id, followUps: e.target.checked })} /> Auto follow-ups
              </label>
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-white/45">No leads here.</li>}
      </ul>
    </div>
  );
}

const STAGES = { new: "New", draft_ready: "Draft ready", in_progress: "Editing", sent: "Sent", refunded: "Refunded" } as const;
const PLAN_NAMES: Record<string, string> = Object.fromEntries(DIET_PLANS.map((p) => [p.id, p.name]));

function DietOrders({ data, act }: { data: Data; act: Act }) {
  return (
    <div className="grid gap-3">
      <p className="text-xs text-white/45">
        Paid plans. A draft PDF is built automatically from the client&apos;s answers. <b>Preview</b> it, then <b>Approve &amp; send</b> — it goes to the client on WhatsApp and email. To change anything, open it in the Diet Calculator and use <b>Send to client</b> there.
        {data.channels.autoSend && data.channels.autoSend !== "off" && <span className="text-amber-200"> Auto-send is on ({data.channels.autoSend === "all" ? "every plan" : "clients with no health condition or medicines"}).</span>}
        {!data.channels.email && " Email isn't connected yet, so plans queue in Messages."}
      </p>
      {data.dietOrders.length === 0 && <p className="text-sm text-white/50">No paid diet-chart orders yet. The order page is at /diet-chart.</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {data.dietOrders.map((o) => {
          const i = o.intake;
          return (
            <li key={o.id} className="rounded-2xl bg-white/[.04] p-4 ring-1 ring-white/10">
              <div className="flex flex-wrap items-start gap-2">
                <div className="mr-auto">
                  <p className="font-semibold">{o.name}</p>
                  <p className="text-xs text-white/45">
                    {PLAN_NAMES[o.plan] ?? o.plan} · {o.phone}
                    {o.email ? ` · ${o.email}` : ""} · {rupees(o.amountPaise)} · paid {o.paidAt ? when(o.paidAt) : "—"}
                  </p>
                </div>
                <select value={o.stage} onChange={(e) => act({ action: "diet-stage", id: o.id, stage: e.target.value }, "Updated")} className="rounded-lg bg-white/10 px-2 py-1 text-xs font-bold">
                  {Object.entries(STAGES).map(([k, v]) => (
                    <option key={k} value={k} className="bg-ink">
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-2 text-sm text-white/75">
                {i.sex}, {i.age} y · {i.heightCm} cm · {i.weightKg} kg · goal {i.goal} · {i.diet} · {i.cuisine === "any" ? "all-India" : `${i.cuisine} Indian`} · {i.mealsPerDay} meals · wakes {i.wakeTime}
              </p>
              {(i.conditions.length > 0 || i.allergies.length > 0) && <p className="mt-1 text-xs text-amber-200">{[...i.conditions, ...i.allergies.map((a) => `avoid ${a}`)].join(" · ")}</p>}
              {i.medicines && <p className="mt-1 text-xs text-amber-200">Medicines: {i.medicines}</p>}
              {i.notes && <p className="mt-1 text-xs text-white/60">“{i.notes}”</p>}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {o.planPath ? (
                  <>
                    <a href={`/api/admin/growth/diet-plan?id=${o.id}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-white/10 px-3 py-1.5 font-bold">
                      Preview plan
                    </a>
                    <button
                      type="button"
                      onClick={() => confirm(`Send ${o.name.split(" ")[0]}'s plan on WhatsApp${o.email ? " and email" : ""} now?`) && act({ action: "diet-send", id: o.id }, "Plan sent")}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 font-bold text-black"
                    >
                      {o.stage === "sent" ? "Send again" : "Approve & send"}
                    </button>
                  </>
                ) : (
                  <span className="rounded-lg bg-amber-400/15 px-3 py-1.5 text-amber-200">No draft yet</span>
                )}
                <button type="button" onClick={() => act({ action: "diet-regenerate", id: o.id }, "Draft rebuilt")} className="rounded-lg bg-white/10 px-3 py-1.5">
                  {o.planPath ? "Rebuild draft" : "Build draft"}
                </button>
                <a href={`/admin/diet-pro?order=${o.id}`} className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 font-bold">
                  <Salad className="h-3.5 w-3.5" /> Open in Diet Calculator
                </a>
                <a href={waLink(`91${o.phone}`, `Hi ${o.name.split(" ")[0]}, here is your personal diet chart.`)} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#25d366]/20 px-3 py-1.5 text-emerald-200">
                  WhatsApp
                </a>
              </div>
              <ClientAccess o={o} act={act} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const REASON: Record<string, string> = { ok: "can update now", "too-soon": "next update not open yet", "in-review": "waiting for your review", "none-left": "all plans used", "single-plan": "single-plan package", expired: "package ended", revoked: "paused by you" };

/** The client's dashboard access: what they have used, and the admin's controls over it. */
function ClientAccess({ o, act }: { o: DietOrder; act: Act }) {
  const e = o.entitlement;
  const [extra, setExtra] = useState(String(o.extraGenerations ?? 0));
  const [until, setUntil] = useState(o.accessUntil ?? "");
  const [email, setEmail] = useState(o.email ?? "");
  if (!e) return null;
  return (
    <details className="mt-3 rounded-xl bg-black/20 p-3 text-xs">
      <summary className="cursor-pointer select-none font-semibold text-white/80">
        Client dashboard · {e.used} of {e.allowed} plans · {REASON[e.reason] ?? e.reason} · {o.userId ? "signed in" : "not signed in yet"}
      </summary>
      <p className="mt-2 text-white/55">
        Plan updates until {e.accessUntil}
        {e.nextAt ? ` · next update opens ${e.nextAt}` : ""}. The client signs in at /account/plans with {o.email ?? "their email"}.
      </p>
      <ul className="mt-2 divide-y divide-white/5">
        {(o.versions ?? []).map((v) => (
          <li key={v.id} className="flex flex-wrap items-center gap-2 py-1.5">
            <span className="w-8 font-bold">#{v.version}</span>
            <span className="flex-1 text-white/60">
              {when(v.createdAt)} · {v.source} ·{" "}
              <span className={v.status === "sent" ? "text-emerald-300" : v.status === "draft" ? "text-amber-200" : "text-white/40 line-through"}>{v.status === "draft" ? "waiting for review" : v.status}</span>
            </span>
            <a href={`/api/admin/growth/diet-plan?v=${v.id}`} target="_blank" rel="noopener noreferrer" className="rounded bg-white/10 px-2 py-1">
              Preview
            </a>
            {v.status !== "rejected" && (
              <button type="button" onClick={() => confirm(`Remove plan #${v.version}? It disappears from the client's dashboard and no longer counts against the package.`) && act({ action: "version-reject", versionId: v.id }, "Plan removed")} className="rounded bg-red-500/15 px-2 py-1 text-red-200">
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <label className="text-white/60">
          Extra plans (+/-)
          <input type="number" min={-50} max={50} value={extra} onChange={(ev) => setExtra(ev.target.value)} className="mt-1 w-full rounded-lg bg-white/10 px-2 py-1.5 text-white" />
        </label>
        <label className="text-white/60">
          Updates until
          <input type="date" value={until} onChange={(ev) => setUntil(ev.target.value)} className="mt-1 w-full rounded-lg bg-white/10 px-2 py-1.5 text-white" />
        </label>
        <label className="text-white/60">
          Login email
          <input type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} className="mt-1 w-full rounded-lg bg-white/10 px-2 py-1.5 text-white" />
        </label>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            act(
              { action: "client-access", id: o.id, extraGenerations: Number(extra) || 0, accessUntil: until || null, ...(email && email !== o.email ? { email } : {}) },
              "Access saved",
            )
          }
          className="rounded-lg bg-emerald-500 px-3 py-1.5 font-bold text-black"
        >
          Save access
        </button>
        <button type="button" onClick={() => act({ action: "client-access", id: o.id, revoked: !o.revokedAt }, o.revokedAt ? "Access resumed" : "Access paused")} className="rounded-lg bg-white/10 px-3 py-1.5">
          {o.revokedAt ? "Resume updates" : "Pause updates"}
        </button>
        {o.userId && (
          <button type="button" onClick={() => confirm("Unlink this order from the account that claimed it? The next account to sign in with the order's email gets it.") && act({ action: "client-access", id: o.id, unlink: true }, "Unlinked")} className="rounded-lg bg-white/10 px-3 py-1.5">
            Unlink account
          </button>
        )}
      </div>
    </details>
  );
}

function Referrals({ data }: { data: Data }) {
  const top = Object.values(
    data.rewards.reduce<Record<string, { name: string; code: string; n: number; days: number }>>((acc, r) => {
      acc[r.referrerCode] ??= { name: r.referrer, code: r.referrerCode, n: 0, days: 0 };
      acc[r.referrerCode].n++;
      acc[r.referrerCode].days += r.days;
      return acc;
    }, {}),
  ).sort((a, b) => b.n - a.n);
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <section className="rounded-2xl bg-white/[.03] p-4 ring-1 ring-white/10">
        <h2 className="font-display text-lg">Top referrers</h2>
        {top.length === 0 && <p className="mt-2 text-sm text-white/50">No referrals yet. Every member gets a code in their welcome message and on the payment screen.</p>}
        <ol className="mt-2 grid gap-1.5 text-sm">
          {top.map((t) => (
            <li key={t.code} className="flex justify-between">
              <span>
                {t.name} <span className="font-mono text-xs text-white/40">{t.code}</span>
              </span>
              <span className="text-white/70">
                {t.n} friend{t.n > 1 ? "s" : ""} · +{t.days} days
              </span>
            </li>
          ))}
        </ol>
      </section>
      <section className="rounded-2xl bg-white/[.03] p-4 ring-1 ring-white/10">
        <h2 className="font-display text-lg">Rewards given</h2>
        <ul className="mt-2 grid gap-1.5 text-sm">
          {data.rewards.map((r) => (
            <li key={r.id} className="text-white/75">
              {r.referred} joined with {r.referrer}&apos;s code · {when(r.createdAt)} · +{r.days} days each
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Daily marketing: today's ready-to-post message for WhatsApp Status, Instagram and Google, plus the week ahead. */
function Marketing({ today, biz }: { today: string; biz: PostBiz }) {
  const posts = useMemo(() => upcomingPosts(today, biz, 7), [today, biz]);
  const [pick, setPick] = useState(0);
  const [copied, setCopied] = useState("");
  const p: DailyPost = posts[pick];
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      setCopied("");
    }
  };
  const blocks: [string, string, string, string | null][] = [
    ["whatsapp", "WhatsApp Status / broadcast", p.whatsapp, `https://wa.me/?text=${encodeURIComponent(p.whatsapp)}`],
    ["instagram", "Instagram caption (put the link in your bio)", p.instagram, null],
    ["google", "Google Business Profile post", p.google, "https://business.google.com/"],
  ];
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <section className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">{pick === 0 ? "Today's post" : formatDate(p.date)} · {p.theme}</p>
          <h2 className="font-display mt-1 text-2xl text-white">{p.title}</h2>
          <p className="mt-2 text-sm text-white/60"><strong className="text-white/80">Photo / design:</strong> {p.visual}</p>
          <p className="mt-2 text-xs text-white/40">Links are tagged with the channel and date, so orders from this post can be traced.</p>
        </div>
        {blocks.map(([key, label, text, open]) => (
          <div key={key} className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-white">{label}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => copy(key, text)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/85 hover:text-white">
                  {copied === key ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />} {copied === key ? "Copied" : "Copy"}
                </button>
                {open && (
                  <a href={open} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-black">
                    {key === "whatsapp" ? "Share on WhatsApp" : "Open Google"}
                  </a>
                )}
              </div>
            </div>
            <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-white/80">{text}</pre>
          </div>
        ))}
      </section>
      <aside className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
          <p className="text-sm font-bold text-white">This week</p>
          <ul className="mt-2 space-y-1">
            {posts.map((x, i) => (
              <li key={x.date}>
                <button type="button" onClick={() => setPick(i)} className={`w-full rounded-lg px-2.5 py-2 text-left text-xs ${i === pick ? "bg-white/10 text-white" : "text-white/60 hover:text-white"}`}>
                  <span className="block font-semibold">{i === 0 ? "Today" : formatDate(x.date)}</span>
                  <span className="block text-white/45">{x.theme}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4 text-xs leading-relaxed text-white/55">
          <p className="font-bold text-white/80">Daily routine (10 minutes)</p>
          <ol className="mt-1 list-decimal space-y-1 pl-4">
            <li>Take the photo or make the graphic.</li>
            <li>Post the WhatsApp Status and send it to your broadcast list.</li>
            <li>Post on Instagram with the caption.</li>
            <li>Add the Google Business post.</li>
            <li>Reply to every message within an hour.</li>
          </ol>
          <p className="mt-2">With COACH_EMAIL set, this post is also emailed to you every morning.</p>
        </div>
      </aside>
    </div>
  );
}
