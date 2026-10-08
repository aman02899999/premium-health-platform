"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, Copy, Gift, Inbox, Loader2, MessageCircle, Phone, Play, Plus, Salad, Search, Send, TrendingUp, Users, X } from "lucide-react";
import { addDays, daysBetween, expiryFor, formatDate, parseDuration } from "@/lib/growth/dates";
import { waLink } from "@/lib/growth/messages";
import type { DietIntake } from "@/lib/growth/diet-intake";

type Member = { id: string; name: string; phone: string; email: string | null; planName: string; startOn: string; expiresOn: string; source: "online" | "desk"; referralCode: string; renewToken: string; reminders: boolean; notes: string };
type Lead = { id: string; createdAt: string; name: string; phone: string; goal: string; message: string; source: string; status: LeadStatus; contactedAt: string | null; notes: string; followUps: boolean };
type LeadStatus = "new" | "contacted" | "trial" | "joined" | "lost";
type Msg = { id: string; createdAt: string; channel: string; to: string; toName: string; kind: string; body: string; status: "pending" | "sent" | "failed" | "cancelled"; attempts: number; lastError: string | null; sentAt: string | null; sentBy: string | null };
type DietOrder = { id: string; createdAt: string; name: string; phone: string; email: string | null; amountPaise: number; intake: DietIntake; paidAt: string | null; stage: "new" | "in_progress" | "sent" | "refunded"; sentAt: string | null };
type Reward = { id: string; createdAt: string; referrer: string; referrerCode: string; referred: string; days: number };
type Unapplied = { razorpayOrderId: string; name: string; phone: string; planName: string; duration: string; paidAt: string };
type Data = { today: string; siteUrl: string; channels: { whatsappApi: boolean; email: boolean; cronSecret: boolean }; members: Member[]; leads: Lead[]; outbox: Msg[]; dietOrders: DietOrder[]; rewards: Reward[]; unapplied: Unapplied[] };
type Tab = "today" | "messages" | "members" | "leads" | "diet" | "referrals";

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

export function GrowthApp({ plans, gymName }: { plans: { name: string; duration: string }[]; gymName: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("today");
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
      dietToDo: data.dietOrders.filter((o) => o.stage === "new" || o.stage === "in_progress"),
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
            {tab === "messages" && <Messages data={data} act={act} />}
            {tab === "members" && <Members data={data} plans={plans} act={act} gymName={gymName} />}
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

const emptyMember = (today: string) => ({ id: "", name: "", phone: "", email: "", planName: "", startOn: today, expiresOn: addDays(today, 29), notes: "", reminders: true });

function Members({ data, plans, act, gymName }: { data: Data; plans: { name: string; duration: string }[]; act: Act; gymName: string }) {
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
        <button type="button" onClick={() => setEdit(emptyMember(t))} className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-xs font-bold">
          <Plus className="h-3.5 w-3.5" /> Add desk member
        </button>
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

const STAGES = { new: "New", in_progress: "Preparing", sent: "Sent", refunded: "Refunded" } as const;

function DietOrders({ data, act }: { data: Data; act: Act }) {
  return (
    <div className="grid gap-3">
      <p className="text-xs text-white/45">Paid personal diet charts. Open each one in the Diet Calculator, where the client&apos;s answers are already filled in. Check the profile, download the branded PDF, send it on WhatsApp, then mark it sent.</p>
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
                    {o.phone} · {rupees(o.amountPaise)} · paid {o.paidAt ? when(o.paidAt) : "—"}
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
              {i.notes && <p className="mt-1 text-xs text-white/60">“{i.notes}”</p>}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <a href={`/admin/diet-pro?order=${o.id}`} className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 font-bold">
                  <Salad className="h-3.5 w-3.5" /> Open in Diet Calculator
                </a>
                <a href={waLink(`91${o.phone}`, `Hi ${o.name.split(" ")[0]}, here is your personal diet chart.`)} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#25d366]/20 px-3 py-1.5 text-emerald-200">
                  WhatsApp
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
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
