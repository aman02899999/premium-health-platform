"use client";

import { ArrowLeft, Bot, Check, CircleAlert, Clock, Info, Loader2, Pause, Play, RefreshCw, Search, Send, Sparkles, X, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { initials } from "@/lib/admin/team-core";
import type { ChatMessage, ChatSummary } from "@/lib/social/chat";
import type { Contact } from "@/lib/social/chat-tools";
import { windowLabel, type WindowState } from "@/lib/social/chat-window";
import { NotificationBell } from "@/components/admin/NotificationBell";

const LIST_EVERY = 20_000;
const THREAD_EVERY = 8_000;


const time = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const day = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
};
const shortWhen = (iso: string) => (day(iso) === "Today" ? time(iso) : day(iso));
const pretty = (peer: string) => (peer.length === 12 && peer.startsWith("91") ? `+91 ${peer.slice(2, 7)} ${peer.slice(7)}` : `+${peer}`);
const byLabel = (by: string) => (by === "auto-reply" ? "Auto-reply" : by === "ai-agent" ? "AI agent" : by === "scheduled" ? "Scheduled message" : by.split("@")[0]);

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json as T;
}

function Media({ m }: { m: NonNullable<ChatMessage["media"]> }) {
  const src = `/api/admin/chats/media/${encodeURIComponent(m.id)}`;
  if (m.type === "image" || m.type === "sticker")
    return (
      <a href={src} target="_blank" rel="noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element -- streamed from WhatsApp through the admin route */}
        <img src={src} alt="Photo from the customer" className="max-h-72 rounded-lg" loading="lazy" />
      </a>
    );
  if (m.type === "audio") return <audio controls src={src} className="w-60 max-w-full" preload="none" />;
  if (m.type === "video") return <video controls src={src} className="max-h-72 rounded-lg" preload="none" />;
  return (
    <a href={src} target="_blank" rel="noreferrer" className="underline">
      📄 Open document
    </a>
  );
}

function Bubble({ m }: { m: ChatMessage }) {
  return (
    <div className={`flex ${m.fromThem ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed sm:max-w-[70%] ${m.fromThem ? "rounded-tl-sm bg-white/10 text-white" : "rounded-tr-sm bg-emerald-600/80 text-white"}`}>
        {m.media && (
          <div className="mb-1">
            <Media m={m.media} />
          </div>
        )}
        {m.body ? <p className="whitespace-pre-wrap break-words">{m.body}</p> : !m.media ? <p className="italic text-white/50">(empty message)</p> : null}
        <div className="mt-1 flex items-center justify-end gap-1.5 text-[11px] text-white/60">
          {!m.fromThem && <span>{byLabel(m.by)} ·</span>}
          <span>{time(m.at)}</span>
          {!m.fromThem && (m.ok ? <Check className="h-3 w-3" /> : <CircleAlert className="h-3 w-3 text-red-300" />)}
        </div>
        {!m.ok && m.error && <p className="mt-1 text-[11px] text-red-200">Not delivered: {m.error}</p>}
      </div>
    </div>
  );
}

type ThreadData = {
  name: string;
  messages: ChatMessage[];
  window: WindowState;
  contact: Contact;
  quickReplies: { id: string; label: string }[];
  templates: { kind: string; label: string; marketing: boolean; preview: string }[];
  payments?: { id: string; url: string; purpose: string; rupees: number; state: "open" | "paid" | "cancelled" | "expired"; createdAt: string; paymentId: string | null }[];
  purposes?: string[];
  aiDraft?: boolean;
};

const PAY_TONE = { open: "bg-sky-500/20 text-sky-100", paid: "bg-emerald-500/20 text-emerald-100", cancelled: "bg-white/10 text-white/50", expired: "bg-white/10 text-white/50" } as const;

/** "Request payment": a Razorpay link for any amount, sent in the chat; the receipt comes back here. */
function PaymentRequests({ peer, data, onChange }: { peer: string; data: ThreadData; onChange: () => void }) {
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote("");
    try {
      const res = await fetch(`/api/admin/chats/${peer}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "pay-link", purpose, amount }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Couldn't create the link");
      setNote(j.sent ? "Link sent in the chat." : `Link made, but not sent: ${j.sendError}. Copy it below and send it yourself.`);
      setPurpose("");
      setAmount("");
      onChange();
    } catch (err) {
      setNote((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-3 rounded-xl border border-white/10 p-3">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-white/50">Request payment</h3>
      <form onSubmit={send} className="space-y-2">
        <input list="pay-purposes" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="What for (e.g. Personal training)" maxLength={120} required className="w-full rounded-lg bg-white/[.06] px-2 py-1.5 text-sm ring-1 ring-white/10" aria-label="Payment for" />
        <datalist id="pay-purposes">
          {(data.purposes ?? []).map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
        <div className="flex gap-2">
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₹ amount" required className="min-w-0 flex-1 rounded-lg bg-white/[.06] px-2 py-1.5 text-sm ring-1 ring-white/10" aria-label="Amount in rupees" />
          <button disabled={busy} className="shrink-0 rounded-lg bg-emerald-500/80 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "…" : "Send link"}
          </button>
        </div>
      </form>
      {note && <p className="mt-2 text-xs text-white/70">{note}</p>}
      {!!data.payments?.length && (
        <ul className="mt-3 space-y-1.5">
          {data.payments.map((r) => (
            <li key={r.id} className="rounded-lg bg-white/[.04] px-2 py-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate">{r.purpose}</span>
                <span className="shrink-0 font-semibold">{rupees(r.rupees)}</span>
                <span className={`shrink-0 rounded px-1.5 ${PAY_TONE[r.state]}`}>{r.state}</span>
              </div>
              {r.state === "open" && (
                <div className="mt-1 flex gap-3 text-white/60">
                  <button type="button" onClick={() => navigator.clipboard.writeText(r.url).then(() => setNote("Link copied."))} className="underline">
                    Copy link
                  </button>
                  <button type="button" onClick={() => postAction(peer, { action: "pay-cancel", id: r.id }).then(onChange, (e: Error) => setNote(e.message))} className="underline">
                    Cancel
                  </button>
                </div>
              )}
              {r.paymentId && <p className="mt-0.5 text-white/40">Razorpay {r.paymentId}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const LEAD_STATUSES = ["new", "contacted", "trial", "joined", "lost"] as const;
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const until = (iso: string) => {
  const d = new Date(iso);
  return d.getTime() - Date.now() > 7 * 86_400_000 ? "until you resume it" : `until ${day(iso) === "Today" ? time(iso) : `${day(iso)} ${time(iso)}`}`;
};

async function postAction(peer: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/admin/chats/${peer}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
}

/** Who the customer is, and the coach's controls: lead status, notes, promotions, bot pause. */
type Assign = { team: { email: string; name: string }[]; me: string; assignedTo: string | null; onAssigned: () => void };

function ContactPanel({ peer, data, onChange, onClose, assign }: { peer: string; data: ThreadData; onChange: () => void; onClose: () => void; assign?: Assign }) {
  const c = data.contact;
  const [notes, setNotes] = useState(c.notes);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const act = async (body: Record<string, unknown>, done = "Saved") => {
    setError("");
    try {
      await postAction(peer, body);
      setSaved(done);
      setTimeout(() => setSaved(""), 2000);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const row = "flex items-center justify-between gap-2 py-1.5 text-sm";
  return (
    <div className="h-full overflow-y-auto p-4 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg">Customer</h2>
        <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-white/60 hover:bg-white/10 lg:hidden">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="font-semibold">{c.name || pretty(peer)}</p>
      <p className="text-white/50">{pretty(peer)}</p>

      {assign && assign.team.length > 0 && (
        <label className="mt-4 block rounded-xl border border-white/10 p-3">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-white/50">Assigned to</span>
          <select
            value={assign.assignedTo ?? ""}
            onChange={(e) =>
              act({ action: "assign", email: e.target.value }, e.target.value ? "Assigned" : "Unassigned").then(assign.onAssigned)
            }
            className="w-full rounded-lg bg-white/[.06] px-2 py-1.5 text-sm ring-1 ring-white/10"
            aria-label="Assign this chat"
          >
            <option value="">Nobody (anyone can reply)</option>
            {assign.team.map((m) => (
              <option key={m.email} value={m.email}>
                {m.name || m.email}
                {m.email === assign.me ? " (me)" : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <section className="mt-4 rounded-xl border border-white/10 p-3">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-white/50">Status</h3>
        {c.member ? (
          <p className={row}>
            <span>Member · {c.member.planName}</span>
            <span className={c.member.active ? "text-emerald-300" : "text-amber-300"}>{c.member.active ? `till ${c.member.expiresOn}` : `ended ${c.member.expiresOn}`}</span>
          </p>
        ) : null}
        {c.lead ? (
          <label className={row}>
            <span>Lead{c.lead.interest ? ` · ${c.lead.interest}` : ""}</span>
            <select value={c.lead.status} onChange={(e) => act({ action: "lead-status", status: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 capitalize">
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-[#111]">
                  {s}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {!c.member && !c.lead && <p className="text-white/50">Not a lead or member yet.</p>}
        {c.diet.length > 0 && (
          <div className="mt-2 border-t border-white/10 pt-2">
            <p className="text-xs text-white/50">Diet plan orders</p>
            {c.diet.map((d) => (
              <p key={d.at} className={row}>
                <span className="truncate">{d.plan || "Diet plan"} · {rupees(d.rupees)}</span>
                <span className={d.status === "paid" ? "text-emerald-300" : "text-white/50"}>{d.status === "paid" ? "Paid" : d.status === "created" ? "Not paid" : d.status}</span>
              </p>
            ))}
          </div>
        )}
      </section>

      <section className="mt-3 rounded-xl border border-white/10 p-3">
        <h3 className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-white/50">
          <Bot className="h-3.5 w-3.5" /> Auto-replies
        </h3>
        <p className="text-white/70">{c.botPausedUntil ? `Paused ${until(c.botPausedUntil)}.` : "On: the bot answers this customer."}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {c.botPausedUntil ? (
            <button onClick={() => act({ action: "pause", hours: 0 }, "Bot on")} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold">
              <Play className="h-3.5 w-3.5" /> Resume bot
            </button>
          ) : (
            <>
              <button onClick={() => act({ action: "pause", hours: 24 }, "Paused")} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5">
                <Pause className="h-3.5 w-3.5" /> Pause 24 h
              </button>
              <button onClick={() => act({ action: "pause", hours: 720 }, "Paused")} className="rounded-lg bg-white/10 px-3 py-1.5">
                Pause for good
              </button>
            </>
          )}
        </div>
        <p className="mt-2 text-xs text-white/40">Your own replies pause the bot for 2 hours automatically.</p>
      </section>

      <section className="mt-3 rounded-xl border border-white/10 p-3">
        <label className={row}>
          <span>Promotional messages</span>
          <input type="checkbox" checked={!c.optedOut} onChange={(e) => act({ action: "opt-out", optedOut: !e.target.checked })} className="h-4 w-4 accent-emerald-500" />
        </label>
        <p className="text-xs text-white/40">{c.optedOut ? "Off: they tapped Stop promotions, or you turned it off." : "On: offers and win-back messages may be sent."}</p>
      </section>

      <PaymentRequests peer={peer} data={data} onChange={onChange} />

      <section className="mt-3">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-white/50">Private notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== c.notes && act({ action: "notes", notes })}
          rows={5}
          maxLength={2000}
          placeholder="Goal, injuries, preferred batch, follow-up date…"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/30 focus:border-emerald-400/60 focus:outline-none"
        />
        <p className="text-xs text-white/40">Only you see these. Saved when you click away.</p>
      </section>
      {saved && <p className="mt-2 text-xs text-emerald-300">{saved} ✓</p>}
      {error && <p className="mt-2 rounded-lg bg-red-500/10 p-2 text-xs text-red-100">{error}</p>}
    </div>
  );
}

/** Once the 24-hour window has closed, only an approved template can start the conversation again. */
function TemplatePicker({ peer, templates, onSent }: { peer: string; templates: ThreadData["templates"]; onSent: () => void }) {
  const [pick, setPick] = useState(templates[0]?.kind ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const t = templates.find((x) => x.kind === pick);
  if (!templates.length) return <p className="p-3 text-xs text-white/50">No template fits this customer right now. They need to message you first.</p>;
  return (
    <div className="space-y-2 p-2">
      <p className="text-xs text-amber-100">The 24-hour window is closed. Send an approved template to start the chat again:</p>
      <div className="flex gap-2">
        <select value={pick} onChange={(e) => setPick(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
          {templates.map((x) => (
            <option key={x.kind} value={x.kind} className="bg-[#111]">
              {x.label}
              {x.marketing ? " (promo)" : ""}
            </option>
          ))}
        </select>
        <button
          disabled={busy || !t}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await postAction(peer, { action: "template", kind: pick });
              onSent();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold disabled:opacity-40"
        >
          <Send className="h-4 w-4" /> Send
        </button>
      </div>
      {t && <p className="whitespace-pre-wrap rounded-xl bg-white/5 p-2 text-xs text-white/70">{t.preview}</p>}
      {error && <p className="text-xs text-red-200">{error}</p>}
    </div>
  );
}

function Thread({ peer, fallbackName, onBack, onSent, assign }: { peer: string; fallbackName: string; onBack: () => void; onSent: () => void; assign?: Assign }) {
  const [data, setData] = useState<ThreadData | null>(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [panel, setPanel] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const count = useRef(0);

  const load = useCallback(async () => {
    try {
      setData(await getJson<ThreadData>(`/api/admin/chats/${peer}`));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [peer]);

  // The component is keyed by the chat, so a new chat starts fresh. The first load runs on the next
  // tick, then every few seconds while the chat is open.
  useEffect(() => {
    const first = setTimeout(load, 0);
    const t = setInterval(load, THREAD_EVERY);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [load]);

  useEffect(() => {
    // Scroll to the newest message when the chat opens and when a new one arrives.
    if (data && data.messages.length !== count.current) {
      count.current = data.messages.length;
      bottom.current?.scrollIntoView({ block: "end" });
    }
  }, [data]);

  async function send(body: Record<string, unknown>) {
    if (sending) return;
    setSending(true);
    setError("");
    try {
      await postAction(peer, body);
      if (body.action === "text") setText("");
      await load();
      onSent();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }
  const sendText = () => text.trim() && send({ action: "text", text });
  const [drafting, setDrafting] = useState(false);
  const [draftNote, setDraftNote] = useState("");
  // The AI writes a reply to the customer's latest message into the box; the desk checks it and sends.
  async function aiDraft() {
    if (drafting) return;
    setDrafting(true);
    setError("");
    setDraftNote("");
    try {
      const res = await fetch(`/api/admin/chats/${peer}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "ai-draft" }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Couldn't write a draft.");
      setText(j.draft);
      setDraftNote(j.handoff ? `AI draft. The AI thinks a person should handle this: ${j.reason || "check it"}.` : "AI draft: check it, edit if needed, then send.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDrafting(false);
    }
  }

  const name = data?.name || fallbackName;
  const open = data?.window.open ?? false;
  const paused = data?.contact.botPausedUntil;
  let lastDay = "";
  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
          <button onClick={onBack} aria-label="Back to chats" className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-white">{name || pretty(peer)}</p>
            <p className="truncate text-xs text-white/50">
              {name ? `${pretty(peer)} · ` : ""}
              <a href={`tel:+${peer}`} className="underline">
                Call
              </a>
            </p>
          </div>
          {data && (
            <button
              onClick={() => send({ action: "pause", hours: paused ? 0 : 24 })}
              title={paused ? "Auto-replies are paused. Tap to turn them on." : "Auto-replies are on. Tap to pause for 24 hours."}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${paused ? "bg-amber-500/20 text-amber-200" : "bg-emerald-500/15 text-emerald-200"}`}
            >
              {paused ? <Pause className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              {paused ? "Bot paused" : "Bot on"}
            </button>
          )}
          <button onClick={() => setPanel((v) => !v)} aria-label="Customer details" className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden">
            <Info className="h-5 w-5" />
          </button>
        </header>
        {data && (
          <p className={`flex items-center gap-1.5 px-3 py-1.5 text-xs ${open ? "bg-emerald-500/10 text-emerald-200" : "bg-amber-500/10 text-amber-100"}`}>
            <Clock className="h-3.5 w-3.5 shrink-0" /> {windowLabel(data.window)}
          </p>
        )}
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
          {!data && !error && <p className="text-center text-sm text-white/50">Loading…</p>}
          {data?.messages.map((m) => {
            const d = day(m.at);
            const sep = d !== lastDay;
            lastDay = d;
            return (
              <div key={m.id}>
                {sep && <p className="my-2 text-center text-[11px] uppercase tracking-wide text-white/40">{d}</p>}
                <Bubble m={m} />
              </div>
            );
          })}
          <div ref={bottom} />
        </div>
        {error && <p className="border-t border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">{error}</p>}
        {data && !open ? (
          <div className="border-t border-white/10">
            <TemplatePicker peer={peer} templates={data.templates} onSent={() => (load(), onSent())} />
          </div>
        ) : (
          <div className="border-t border-white/10">
            {data && (
              <div className="flex gap-1.5 overflow-x-auto px-2 pt-2" aria-label="Quick replies">
                {data.aiDraft && (
                  <button
                    disabled={sending || drafting}
                    onClick={aiDraft}
                    title="Write a reply to their latest message with the AI agent. Nothing is sent until you press send."
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-violet-400/40 bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-100 hover:bg-violet-500/25 disabled:opacity-40"
                  >
                    {drafting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} {drafting ? "Writing…" : "AI draft"}
                  </button>
                )}
                {data.quickReplies.map((q) => (
                  <button
                    key={q.id}
                    disabled={sending}
                    onClick={() => send({ action: "quick", id: q.id })}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-40"
                  >
                    <Zap className="h-3 w-3" /> {q.label}
                  </button>
                ))}
              </div>
            )}
            {draftNote && text && <p className="px-3 pt-2 text-xs text-violet-200">{draftNote}</p>}
            <div className="flex items-end gap-2 p-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(min-width: 768px)").matches) {
                    e.preventDefault();
                    sendText();
                  }
                }}
                rows={Math.min(5, Math.max(1, text.split("\n").length))}
                maxLength={4000}
                placeholder="Type a reply…"
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-emerald-400/60 focus:outline-none"
              />
              <button onClick={sendText} disabled={sending || !text.trim()} aria-label="Send" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white disabled:opacity-40">
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
      {data && (
        <aside className={`${panel ? "fixed inset-0 z-20 block bg-[#0b0b0f]" : "hidden"} border-white/10 lg:static lg:block lg:w-72 lg:shrink-0 lg:border-l`}>
          <ContactPanel key={data.contact.notes} peer={peer} data={data} onChange={load} onClose={() => setPanel(false)} assign={assign} />
        </aside>
      )}
    </div>
  );
}

type Filter = "waiting" | "mine" | "all" | "lead" | "member";

/** WhatsApp inbox for the coach: conversations on the left, the open chat in the middle, the customer on the right. */
export function ChatsApp() {
  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [team, setTeam] = useState<{ email: string; name: string }[]>([]);
  const [me, setMe] = useState("");
  const [error, setError] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  useEffect(() => {
    // From Contacts: /admin/chats?peer=919812345678 opens that conversation.
    const p = new URLSearchParams(window.location.search).get("peer");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL after hydration
    if (p && /^\d{8,20}$/.test(p)) setActive(p);
  }, []);

  const load = useCallback(async () => {
    try {
      const j = await getJson<{ chats: ChatSummary[]; team?: { email: string; name: string }[]; me?: string }>("/api/admin/chats");
      setChats(j.chats);
      setTeam(j.team ?? []);
      setMe(j.me ?? "");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const t = setInterval(load, LIST_EVERY);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [load]);

  const isWaiting = (c: ChatSummary) => c.lastFromThem && c.window.open;
  const waiting = chats?.filter(isWaiting).length ?? 0;
  useEffect(() => {
    document.title = `${waiting ? `(${waiting}) ` : ""}WhatsApp chats · Admin`;
  }, [waiting]);

  const needle = q.trim().toLowerCase();
  const digits = needle.replace(/\D/g, "");
  const shown = (chats ?? []).filter(
    (c) =>
      (filter === "all" || (filter === "waiting" ? isWaiting(c) : filter === "mine" ? c.assignedTo === me : c.tag === filter)) &&
      (!needle || c.name.toLowerCase().includes(needle) || (digits.length >= 3 && c.peer.includes(digits)) || c.lastBody.toLowerCase().includes(needle)),
  );
  const counts: Record<Filter, number> = { waiting, mine: chats?.filter((c) => c.assignedTo === me && me !== "").length ?? 0, all: chats?.length ?? 0, lead: chats?.filter((c) => c.tag === "lead").length ?? 0, member: chats?.filter((c) => c.tag === "member").length ?? 0 };
  const tabs: [Filter, string][] = [
    ["all", "All"],
    ["waiting", "Waiting"],
    ...(team.length > 1 ? ([["mine", "Mine"]] as [Filter, string][]) : []),
    ["lead", "Leads"],
    ["member", "Members"],
  ];

  const current = chats?.find((c) => c.peer === active);
  return (
    <div className="flex h-[100dvh] flex-col bg-[#0b0b0f] text-white">
      {/* On a phone the open chat has its own back arrow, so this bar hides while a chat is open. */}
      <header className={`items-center gap-2 border-b border-white/10 px-3 py-2.5 ${active ? "hidden md:flex" : "flex"}`}>
        <a href="/admin" aria-label="Back to admin" className="rounded-lg p-1.5 text-white/70 hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </a>
        <h1 className="flex-1 font-display text-lg">WhatsApp chats</h1>
        <a href="/api/admin/whatsapp-templates" className="hidden rounded-lg px-2 py-1 text-xs text-white/60 hover:bg-white/10 sm:inline">
          Templates
        </a>
        {waiting > 0 && <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold">{waiting} waiting</span>}
        <button onClick={load} aria-label="Refresh" className="rounded-lg p-1.5 text-white/70 hover:bg-white/10">
          <RefreshCw className="h-4 w-4" />
        </button>
        <NotificationBell />
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className={`flex min-h-0 w-full flex-col border-white/10 md:flex md:w-80 md:border-r ${active ? "hidden" : "flex"}`}>
          <div className="space-y-2 border-b border-white/10 p-2">
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <Search className="h-4 w-4 text-white/40" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, number or message" className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-white/40 focus:outline-none" />
            </label>
            <div className="flex gap-1" role="tablist">
              {tabs.map(([f, label]) => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${filter === f ? "bg-emerald-500 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
                >
                  {label}
                  {counts[f] > 0 && <span className="ml-1 opacity-70">{counts[f]}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {error && <p className="m-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
            {!chats && !error && <p className="p-4 text-sm text-white/50">Loading…</p>}
            {chats?.length === 0 && <p className="p-4 text-sm text-white/50">No WhatsApp conversations yet. Customer messages to the business number appear here.</p>}
            {chats && chats.length > 0 && shown.length === 0 && <p className="p-4 text-sm text-white/50">Nothing here.</p>}
            {shown.map((c) => (
              <button
                key={c.peer}
                onClick={() => setActive(c.peer)}
                className={`flex w-full items-start gap-3 border-b border-white/5 px-3 py-3 text-left hover:bg-white/5 ${active === c.peer ? "bg-white/[0.07]" : ""}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600/30 text-sm font-bold">{(c.name || "#").slice(0, 1).toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className={`flex-1 truncate ${c.lastFromThem ? "font-bold" : "font-medium text-white/80"}`}>{c.name || pretty(c.peer)}</span>
                    <span className="shrink-0 text-[11px] text-white/40">{shortWhen(c.lastAt)}</span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5">
                    {c.tag && <span className={`shrink-0 rounded px-1.5 text-[10px] font-bold uppercase ${c.tag === "member" ? "bg-emerald-500/20 text-emerald-200" : "bg-sky-500/20 text-sky-200"}`}>{c.tag}</span>}
                    {c.botPaused && <Pause className="h-3 w-3 shrink-0 text-amber-300" aria-label="Bot paused" />}
                    {c.assignedTo && (
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-bold ${c.assignedTo === me ? "bg-brand text-white" : "bg-white/15 text-white/80"}`}
                        title={`Assigned to ${team.find((m) => m.email === c.assignedTo)?.name || c.assignedTo}`}
                      >
                        {initials(team.find((m) => m.email === c.assignedTo)?.name ?? "", c.assignedTo)}
                      </span>
                    )}
                    <span className={`flex-1 truncate text-sm ${c.lastFromThem ? "text-white" : "text-white/50"}`}>{c.lastFromThem ? "" : "You: "}{c.lastBody}</span>
                    {isWaiting(c) && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" aria-label="Waiting for a reply" />}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </aside>
        <main className={`min-h-0 min-w-0 flex-1 ${active ? "block" : "hidden md:block"}`}>
          {active ? (
            <Thread key={active} peer={active} fallbackName={current?.name ?? ""} onBack={() => setActive(null)} onSent={load} assign={{ team, me, assignedTo: current?.assignedTo ?? null, onAssigned: load }} />
          ) : (
            <p className="flex h-full items-center justify-center p-6 text-center text-sm text-white/40">Pick a conversation to read and reply.</p>
          )}
        </main>
      </div>
    </div>
  );
}
