"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageCircle, Phone, PhoneCall } from "lucide-react";
import type { Outcome, Prospect } from "@/lib/growth/call-list-core";

type Data = { prospects: Prospect[]; outcomes: { id: Outcome; label: string }[] };

const ago = (iso: string) => {
  const h = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 3_600_000));
  return h < 1 ? "just now" : h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};
const pretty = (ten: string) => `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
const TONE: Record<Outcome, string> = {
  interested: "bg-emerald-500 text-white",
  "no-answer": "bg-white/10 text-white/80",
  "not-interested": "bg-white/5 text-white/55",
};

/**
 * "Call these today": people who replied to an offer or clicked its link and haven't joined,
 * paid or heard from a person. The desk calls from the gym phone and taps what happened.
 */
export function CallList() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/call-list", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Couldn't load the call list.");
      setData(j);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function log(p: Prospect, outcome: Outcome) {
    setBusy(`${p.contact}:${outcome}`);
    setError("");
    try {
      const r = await fetch("/api/admin/call-list", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contact: p.contact, outcome, note: notes[p.contact] ?? "", name: p.name }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Couldn't save the call.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  const list = data?.prospects ?? [];
  return (
    <div id="calls" className="scroll-mt-20 rounded-2xl bg-white/[.04] p-4 ring-1 ring-white/10">
      <h2 className="flex items-center gap-2 font-semibold">
        <PhoneCall className="h-4 w-4 text-emerald-300" /> Call list {data && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{list.length}</span>}
      </h2>
      <p className="mt-1 text-xs text-white/55">People who replied to an offer or clicked its link in the last 3 days and haven&apos;t joined, paid or heard from a coach. Call from the gym phone, then tap what happened.</p>
      {error && <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p>}
      {!data && !error && <p className="mt-3 text-sm text-white/50">Loading…</p>}
      {data && list.length === 0 && <p className="mt-3 text-sm text-white/60">Nobody to call right now. People appear here within minutes of replying to or clicking an offer.</p>}
      <ul className="mt-3 divide-y divide-white/10">
        {list.map((p) => (
          <li key={p.contact} className="space-y-2 py-3 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-white">
                  {p.name || "Unknown name"}
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.type === "replied" ? "bg-red-500/20 text-red-100" : "bg-amber-500/20 text-amber-100"}`}>{p.type === "replied" ? "Replied" : "Clicked"}</span>
                  {p.tries > 0 && <span className="ml-1 text-[11px] text-white/45">· tried {p.tries}×</span>}
                </p>
                <p className="mt-0.5 break-words text-white/70">{p.why}</p>
                <p className="text-xs text-white/45">{ago(p.at)}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {p.phone ? (
                  <>
                    <a href={`tel:+91${p.phone}`} className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white">
                      <Phone className="h-3.5 w-3.5" /> {pretty(p.phone)}
                    </a>
                    <a href={`/admin/chats?peer=91${p.phone}`} aria-label="Open WhatsApp chat" className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1.5 text-white/80">
                      <MessageCircle className="h-3.5 w-3.5" />
                    </a>
                  </>
                ) : (
                  <a href={`mailto:${p.email}`} className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80">
                    {p.email}
                  </a>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                value={notes[p.contact] ?? ""}
                onChange={(e) => setNotes({ ...notes, [p.contact]: e.target.value })}
                maxLength={300}
                placeholder="Note (optional): goal, best time, trial day…"
                className="min-w-0 flex-1 basis-56 rounded-lg bg-white/[.06] px-3 py-1.5 text-xs text-white ring-1 ring-white/10 placeholder:text-white/35 focus:outline-none"
              />
              {data?.outcomes.map((o) => (
                <button key={o.id} type="button" disabled={!!busy} onClick={() => log(p, o.id)} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${TONE[o.id]}`}>
                  {busy === `${p.contact}:${o.id}` && <Loader2 className="h-3 w-3 animate-spin" />} {o.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {list.length > 0 && <p className="mt-2 text-[11px] text-white/45">Interested → becomes a lead, marked contacted. No answer → back tomorrow (3 tries). Not interested → off the list.</p>}
    </div>
  );
}
