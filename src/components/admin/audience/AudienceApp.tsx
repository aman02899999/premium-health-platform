"use client";

import { ArrowLeft, Download, Mail, Megaphone, MessageCircle, RefreshCw, Send, Upload, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { CampaignRow } from "@/lib/growth/campaigns";

type Segment = { id: string; label: string; hint: string; total: number; whatsapp: number; email: number };
type Data = { segments: Segment[]; campaigns: CampaignRow[]; imported: { total: number; tags: { tag: string; n: number }[] }; links: { id: string; label: string; whatsapp: boolean }[] };
type Preview = { committed: boolean; columns: Record<string, string>; plan: { add: number; update: number; members: number; total: number }; errors: { row: number; message: string }[]; errorCount: number };

const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";
const input = "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-emerald-400/60 focus:outline-none";
const btn = "inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-40";
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json as T;
}

function ImportCard({ onDone }: { onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState("past");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(commit: boolean) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("tag", tag);
      form.set("status", status);
      form.set("commit", commit ? "1" : "0");
      const p = await call<Preview>("/api/admin/audience", { method: "POST", body: form });
      setPreview(p);
      if (commit) onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={card}>
      <h2 className="flex items-center gap-2 font-display text-lg">
        <Upload className="h-5 w-5 text-emerald-300" /> Import old members or contacts
      </h2>
      <p className="mt-1 text-sm text-white/60">A CSV or Excel sheet with columns like <b>Name</b>, <b>Mobile</b> and <b>Email</b>. People already on your member list are skipped. Nothing is sent when you import.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => (setFile(e.target.files?.[0] ?? null), setPreview(null))} className="text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white sm:col-span-3" />
        <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="List name, e.g. Members 2023" maxLength={60} className={input} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={input}>
          <option value="past" className="bg-[#111]">Past members</option>
          <option value="current" className="bg-[#111]">Current members (no dates)</option>
          <option value="other" className="bg-[#111]">Other contacts</option>
        </select>
        <button disabled={!file || busy} onClick={() => run(false)} className={`${btn} bg-white/10`}>
          Check file
        </button>
      </div>
      {preview && (
        <div className="mt-3 rounded-xl bg-white/5 p-3 text-sm">
          <p>
            {preview.committed ? "✅ Imported: " : "Found: "}
            <b>{preview.plan.add}</b> new · <b>{preview.plan.update}</b> updated · {preview.plan.members} already members (skipped) · {preview.errorCount} rows with problems
          </p>
          <p className="mt-1 text-xs text-white/50">Columns read: {Object.entries(preview.columns).map(([k, v]) => `${k} ← "${v}"`).join(", ")}</p>
          {preview.errors.length > 0 && (
            <ul className="mt-2 max-h-28 overflow-y-auto text-xs text-amber-100">
              {preview.errors.map((e) => (
                <li key={e.row}>
                  Row {e.row}: {e.message}
                </li>
              ))}
            </ul>
          )}
          {!preview.committed && preview.plan.add + preview.plan.update > 0 && (
            <button disabled={busy} onClick={() => run(true)} className={`${btn} mt-3 bg-emerald-500`}>
              Import {preview.plan.add + preview.plan.update} contacts
            </button>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-200">{error}</p>}
    </section>
  );
}

function Composer({ data, segment, setSegment, onDone }: { data: Data; segment: string; setSegment: (s: string) => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [link, setLink] = useState("trial");
  const [offer, setOffer] = useState("");
  const [subject, setSubject] = useState("");
  const [repeat, setRepeat] = useState("none");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const seg = data.segments.find((s) => s.id === segment);
  const reach = seg ? (channel === "whatsapp" ? seg.whatsapp : seg.email) : 0;
  const linkLabel = data.links.find((l) => l.id === link)?.label ?? "";
  async function queue() {
    setBusy(true);
    setError("");
    setResult("");
    try {
      const r = await call<{ queued: number; skipped: { optedOut: number; recent: number; missing: number } }>("/api/admin/audience", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "campaign", name, segment, channel, link, offer, subject, repeat }),
      });
      setResult(`✅ ${r.queued} messages queued. Skipped: ${r.skipped.optedOut} opted out, ${r.skipped.recent} got a promotion this week, ${r.skipped.missing} have no ${channel === "whatsapp" ? "mobile" : "email"}. Use "Send next 50" below.`);
      setAgree(false);
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={card} id="composer">
      <h2 className="flex items-center gap-2 font-display text-lg">
        <Megaphone className="h-5 w-5 text-emerald-300" /> New campaign
      </h2>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name, e.g. Diwali comeback" maxLength={80} className={input} />
          <select value={segment} onChange={(e) => setSegment(e.target.value)} className={input}>
            {data.segments.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#111]">
                {s.label} ({s.total})
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            {(["whatsapp", "email"] as const).map((c) => (
              <button key={c} onClick={() => setChannel(c)} className={`${btn} flex-1 ${channel === c ? "bg-emerald-500" : "bg-white/10"}`}>
                {c === "whatsapp" ? <MessageCircle className="h-4 w-4" /> : <Mail className="h-4 w-4" />} {c === "whatsapp" ? "WhatsApp" : "Email"}
              </button>
            ))}
          </div>
          {channel === "email" && <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" maxLength={120} className={input} />}
          <textarea value={offer} onChange={(e) => setOffer(e.target.value)} rows={3} maxLength={channel === "whatsapp" ? 160 : 1000} placeholder="The offer, e.g. Diwali special: 3 months of gym + a personal diet plan for ₹4,000, till 31 Oct" className={input} />
          <p className="text-right text-xs text-white/40">
            {offer.length}/{channel === "whatsapp" ? 160 : 1000}
          </p>
          <select value={repeat} onChange={(e) => setRepeat(e.target.value)} className={input}>
            <option value="none" className="bg-[#111]">Send once</option>
            <option value="weekly" className="bg-[#111]">Repeat every week (new people each time)</option>
            <option value="monthly" className="bg-[#111]">Repeat every month (new people each time)</option>
          </select>
          <select value={link} onChange={(e) => setLink(e.target.value)} className={input}>
            {data.links.filter((l) => channel === "email" || l.whatsapp).map((l) => (
              <option key={l.id} value={l.id} className="bg-[#111]">
                Button: {l.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-white/50">Preview</p>
          <div className="rounded-2xl rounded-tr-sm bg-emerald-700/70 p-3 text-sm leading-relaxed">
            {channel === "whatsapp" ? (
              <p>
                Hi Rahul, Royal Fitness Club has something for you: {offer.trim() || "…"}. See details here: <u>{linkLabel}</u>
                <br />
                <span className="mt-2 inline-block rounded-lg bg-white/15 px-2 py-1 text-xs">Stop promotions</span>
              </p>
            ) : (
              <p className="whitespace-pre-wrap">
                <b>{subject || "Subject"}</b>
                {"\n\n"}Hi Rahul,{"\n\n"}
                {offer.trim() || "…"}
                {"\n\n"}[{linkLabel}]{"\n\n"}Unsubscribe link included.
              </p>
            )}
          </div>
          <p className="text-xs text-white/60">
            Reaches up to <b>{reach}</b> people. Opted-out people and anyone who got a promotion in the last 7 days are skipped automatically.
            {repeat !== "none" && <> It runs again every {repeat === "weekly" ? "week" : "month"} with the daily automation, for whoever is in the group then; nobody gets the same run twice.</>}
            {channel === "whatsapp" && (
              <>
                {" "}
                Meta charges about ₹0.80–0.90 per marketing message (approximate; billed by Meta). New numbers can message about 250 people a day.
              </>
            )}
          </p>
          {channel === "whatsapp" && (
            <p className="text-xs text-amber-100">
              Needs the <code>rfc_offer_broadcast_v1</code> template approved by Meta. Submit it with <b>Create missing templates</b> on the{" "}
              <a href="/api/admin/whatsapp-templates" className="underline">
                templates page
              </a>
              .
            </p>
          )}
          <label className="flex items-start gap-2 text-xs text-white/70">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-500" />
            These people are my members, ex-members or enquiries, and every message lets them opt out.
          </label>
          <button disabled={busy || !agree || !name.trim() || offer.trim().length < 5 || reach === 0} onClick={queue} className={`${btn} w-full bg-emerald-500`}>
            <Send className="h-4 w-4" /> Queue campaign
          </button>
          {result && <p className="text-sm text-emerald-200">{result}</p>}
          {error && <p className="text-sm text-red-200">{error}</p>}
        </div>
      </div>
    </section>
  );
}

/** Admin: the marketing audience (members, ex-members, imported contacts, leads) and campaigns to it. */
export function AudienceApp() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [segment, setSegment] = useState("ex-recent");
  const [sending, setSending] = useState(false);
  const [sendNote, setSendNote] = useState("");
  const load = useCallback(async () => {
    try {
      setData(await call<Data>("/api/admin/audience"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);
  const pending = data?.campaigns.reduce((a, c) => a + c.pending, 0) ?? 0;
  async function sendNext() {
    setSending(true);
    setSendNote("");
    try {
      const r = await call<{ sent: number; failed: number; skipped: boolean }>("/api/admin/audience", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "send", max: 50 }) });
      setSendNote(r.skipped ? "WhatsApp/email sending isn't configured." : `Sent ${r.sent}, failed ${r.failed}.`);
      await load();
    } catch (e) {
      setSendNote((e as Error).message);
    } finally {
      setSending(false);
    }
  }
  async function stop(id: string) {
    try {
      await call("/api/admin/audience", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "stop", id }) });
      await load();
    } catch (e) {
      setSendNote((e as Error).message);
    }
  }
  return (
    <div className="min-h-[100dvh] bg-[#0b0b0f] text-white">
      <header className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <a href="/admin" aria-label="Back to admin" className="rounded-lg p-1.5 text-white/70 hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </a>
        <h1 className="flex-1 font-display text-lg">Audience & campaigns</h1>
        <button onClick={load} aria-label="Refresh" className="rounded-lg p-1.5 text-white/70 hover:bg-white/10">
          <RefreshCw className="h-4 w-4" />
        </button>
      </header>
      <main className="mx-auto max-w-6xl space-y-4 p-4">
        {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
        {!data && !error && <p className="text-sm text-white/50">Loading…</p>}
        {data && (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.segments.map((s) => (
                <div key={s.id} className={`${card} flex flex-col ${segment === s.id ? "ring-1 ring-emerald-400/60" : ""}`}>
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-white/50">
                    <Users className="h-3.5 w-3.5" /> {s.label}
                  </p>
                  <p className="mt-1 font-display text-3xl">{s.total}</p>
                  <p className="text-xs text-white/50">{s.hint}</p>
                  <p className="mt-2 text-xs text-white/70">
                    📱 {s.whatsapp} WhatsApp · ✉️ {s.email} email
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      disabled={!s.total}
                      onClick={() => {
                        setSegment(s.id);
                        document.getElementById("composer")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`${btn} flex-1 bg-emerald-500/90 px-2 text-xs`}
                    >
                      <Megaphone className="h-3.5 w-3.5" /> Campaign
                    </button>
                    <a href={s.total ? `/api/admin/audience?export=${s.id}` : undefined} title="Customer list for a Meta Ads custom audience" className={`${btn} bg-white/10 px-2 text-xs ${s.total ? "" : "pointer-events-none opacity-40"}`}>
                      <Download className="h-3.5 w-3.5" /> Meta ads
                    </a>
                  </div>
                </div>
              ))}
            </section>
            <p className="text-xs text-white/50">
              <b>Meta ads</b> downloads a customer list for Ads Manager → Audiences → Create audience → Custom audience → Customer list. Show ads on Instagram and Facebook to these people, or to a lookalike audience of people like them.
            </p>
            <Composer data={data} segment={segment} setSegment={setSegment} onDone={load} />
            <ImportCard onDone={load} />
            <section className={card}>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="flex-1 font-display text-lg">Campaigns</h2>
                {pending > 0 && (
                  <button disabled={sending} onClick={sendNext} className={`${btn} bg-emerald-500`}>
                    <Send className="h-4 w-4" /> Send next 50 ({pending} waiting)
                  </button>
                )}
              </div>
              {sendNote && <p className="mt-1 text-sm text-white/70">{sendNote}</p>}
              {data.campaigns.length === 0 ? (
                <p className="mt-2 text-sm text-white/50">No campaigns yet.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="text-xs uppercase text-white/50">
                      <tr>
                        <th className="py-2">Campaign</th>
                        <th>Channel</th>
                        <th>Sent</th>
                        <th>Waiting</th>
                        <th>Failed</th>
                        <th>Skipped</th>
                        <th>Repeats</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.campaigns.map((c) => (
                        <tr key={c.id} className="border-t border-white/5">
                          <td className="py-2">
                            <p className="font-semibold">{c.name}</p>
                            <p className="text-xs text-white/50">
                              {data.segments.find((s) => s.id === c.segment)?.label ?? c.segment} · {when(c.createdAt)}
                            </p>
                          </td>
                          <td>{c.channel === "whatsapp" ? "WhatsApp" : "Email"}</td>
                          <td className="text-emerald-300">{c.sent}</td>
                          <td>{c.pending}</td>
                          <td className={c.failed ? "text-red-300" : ""}>{c.failed}</td>
                          <td className="text-white/50">{c.skipped + c.cancelled}</td>
                          <td className="text-xs">
                            {c.repeat === "none" || !c.active ? (
                              <span className="text-white/40">{c.repeat === "none" ? "Once" : "Stopped"}</span>
                            ) : (
                              <span className="flex flex-col items-start gap-1">
                                <span>
                                  {c.repeat === "weekly" ? "Weekly" : "Monthly"} · next {c.nextRun}
                                </span>
                                <button onClick={() => stop(c.id)} className="rounded-lg bg-white/10 px-2 py-0.5 hover:bg-white/20">
                                  Stop repeating
                                </button>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
