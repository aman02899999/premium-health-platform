"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { ArrowLeft, Download, Pause, Play, Printer, QrCode, ShieldCheck, ShieldOff } from "lucide-react";
import type { QrKind } from "@/lib/admin/qr-core";

type Code = { code: string; createdAt: string; label: string; kind: QrKind; target: string; active: boolean; scans: number; scans7: number; lastScanAt: string | null; leads: number };
type Optins = {
  whatsappIn: number;
  whatsappOut: number;
  unreachable: number;
  emailIn: number;
  emailOut: number;
  recent: { at: string; channel: "whatsapp" | "email"; address: string; name: string; change: "in" | "out"; source: string }[];
};
type Data = { codes: Code[]; optins: Optins; kinds: { id: QrKind; label: string; hint: string }[]; pages: { path: string; label: string }[]; siteUrl: string; hasReview: boolean };

const card = "rounded-2xl bg-white/[.04] p-4 ring-1 ring-white/10 sm:p-5";
const input = "w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 placeholder:text-white/35 focus:outline-none focus:ring-brand/60";

async function call<T>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : undefined);
  if (r.status === 401) {
    location.href = "/admin/login";
    throw new Error("Signed out");
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Something went wrong");
  return j as T;
}

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
// Numbers are shown with the middle hidden: this list is for counts and trends, not for copying.
const masked = (a: string, ch: string) => (ch === "email" ? a.replace(/^(.).*?(@.*)$/, "$1•••$2") : `+${a.slice(0, -10)} ${a.slice(-10, -7)}•••${a.slice(-3)}`);

function Qr({ url, size = 132 }: { url: string; size?: number }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" }).then(setSvg, () => setSvg(""));
  }, [url]);
  return <div className="shrink-0 rounded-lg bg-white p-1.5" style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} aria-label="QR code" role="img" />;
}

async function downloadPng(url: string, name: string) {
  const data = await QRCode.toDataURL(url, { width: 1200, margin: 2, errorCorrectionLevel: "M" });
  const a = document.createElement("a");
  a.href = data;
  a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "qr"}.png`;
  a.click();
}

export function QrApp() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<{ kind: QrKind; label: string; page: string; text: string }>({ kind: "bot", label: "", page: "/membership", text: "" });
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await call<Data>("/api/admin/qr"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote("");
    try {
      await call("/api/admin/qr", { action: "create", ...form });
      setNote(`Made “${form.label}”. Download it or print the poster below.`);
      setForm({ ...form, label: "", text: "" });
      load();
    } catch (err) {
      setNote((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const kind = data?.kinds.find((k) => k.id === form.kind);
  const o = data?.optins;
  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <a href="/admin" aria-label="Back to Command Center" className="rounded-lg p-1.5 text-white/70 hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <QrCode className="h-5 w-5 text-emerald-300" />
          <span className="font-display text-lg">QR codes & opt-ins</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
        {!data && !error && <p className="text-sm text-white/50">Loading…</p>}
        {data && o && (
          <>
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Opt-in totals">
              {[
                { label: "WhatsApp: asked for offers", v: o.whatsappIn, icon: ShieldCheck, tone: "text-emerald-300" },
                { label: "WhatsApp: stopped promotions", v: o.whatsappOut, icon: ShieldOff, tone: "text-amber-300" },
                { label: "WhatsApp: can't receive", v: o.unreachable, icon: ShieldOff, tone: "text-red-300" },
                { label: "Email subscribers", v: o.emailIn, icon: ShieldCheck, tone: "text-emerald-300" },
                { label: "Email unsubscribed", v: o.emailOut, icon: ShieldOff, tone: "text-amber-300" },
              ].map((k) => (
                <div key={k.label} className={card}>
                  <p className="flex items-center gap-1.5 text-xs text-white/50">
                    <k.icon className={`h-3.5 w-3.5 ${k.tone}`} /> {k.label}
                  </p>
                  <p className="mt-1 font-display text-2xl">{k.v.toLocaleString("en-IN")}</p>
                </div>
              ))}
            </section>

            <form onSubmit={create} className={`${card} grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end`}>
              <h2 className="font-display text-lg md:col-span-3">Make a QR code</h2>
              <label className="text-sm">
                <span className="mb-1 block text-white/60">What it opens</span>
                <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as QrKind })} className={input}>
                  {data.kinds.map((k) => (
                    <option key={k.id} value={k.id} disabled={k.id === "review" && !data.hasReview}>
                      {k.label}
                      {k.id === "review" && !data.hasReview ? " (add the review link in Business details)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-white/60">Where it will be stuck</span>
                <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Reception poster, Society notice board" maxLength={60} className={input} required />
              </label>
              <button disabled={busy} className="btn-brand order-last rounded-lg px-5 py-2 text-sm font-bold disabled:opacity-50 md:order-none">
                Make QR
              </button>
              {form.kind === "page" && (
                <label className="text-sm md:col-span-2">
                  <span className="mb-1 block text-white/60">Page</span>
                  <select value={form.page} onChange={(e) => setForm({ ...form, page: e.target.value })} className={input}>
                    {data.pages.map((p) => (
                      <option key={p.path} value={p.path}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {(form.kind === "bot" || form.kind === "desk") && (
                <label className="text-sm md:col-span-2">
                  <span className="mb-1 block text-white/60">Message typed for them (optional)</span>
                  <input value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Hi! I saw your QR code. Please share the membership offer." maxLength={300} className={input} />
                </label>
              )}
              <p className="text-xs text-white/50 md:col-span-3">{kind?.hint}</p>
              {note && <p className="rounded-lg bg-white/[.05] px-3 py-2 text-sm md:col-span-3">{note}</p>}
            </form>

            <section className="space-y-3" aria-label="Your QR codes">
              <h2 className="font-display text-lg">Your QR codes</h2>
              {!data.codes.length && <p className="text-sm text-white/50">None yet. Start with a “Fees, timings & free trial” QR at reception and a Google review QR at the desk.</p>}
              <div className="grid gap-3 md:grid-cols-2">
                {data.codes.map((c) => {
                  const url = `${data.siteUrl}/q/${c.code}`;
                  return (
                    <article key={c.code} className={`${card} flex gap-4 ${c.active ? "" : "opacity-60"}`}>
                      <Qr url={url} />
                      <div className="min-w-0 flex-1 space-y-1.5 text-sm">
                        <h3 className="truncate font-semibold">{c.label}</h3>
                        <p className="text-xs text-white/50">
                          {data.kinds.find((k) => k.id === c.kind)?.label} · made {when(c.createdAt)}
                          {!c.active && " · paused"}
                        </p>
                        <p>
                          <b className="font-display text-xl">{c.scans}</b> {c.scans === 1 ? "scan" : "scans"} <span className="text-white/50">({c.scans7} this week)</span>
                          {c.kind !== "optin" && c.kind !== "review" && (
                            <>
                              {" · "}
                              <b>{c.leads}</b> {c.leads === 1 ? "lead" : "leads"}
                            </>
                          )}
                        </p>
                        {c.lastScanAt && <p className="text-xs text-white/45">Last scan {when(c.lastScanAt)}</p>}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <a href={`/admin/qr/print/${c.code}`} target="_blank" className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs">
                            <Printer className="h-3.5 w-3.5" /> Poster
                          </a>
                          <button onClick={() => downloadPng(url, c.label)} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs">
                            <Download className="h-3.5 w-3.5" /> PNG
                          </button>
                          <button
                            onClick={() => call("/api/admin/qr", { action: c.active ? "pause" : "resume", code: c.code }).then(load, (e) => setNote(e.message))}
                            className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs"
                            title={c.active ? "Scans go to the home page while paused" : "Turn scanning back on"}
                          >
                            {c.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {c.active ? "Pause" : "Resume"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className={card}>
              <h2 className="font-display text-lg">Recent opt-ins & opt-outs</h2>
              <p className="text-sm text-white/50">Campaigns skip everyone who opted out or can&apos;t receive messages. “Start promotions” on WhatsApp records consent with the time.</p>
              {o.recent.length ? (
                <ul className="mt-3 divide-y divide-white/5 text-sm">
                  {o.recent.map((r, i) => (
                    <li key={i} className="flex items-center gap-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${r.change === "in" ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-400/15 text-amber-200"}`}>{r.change === "in" ? "Opted in" : "Opted out"}</span>
                      <span className="w-6">{r.channel === "whatsapp" ? "📱" : "✉️"}</span>
                      <span className="min-w-0 flex-1 truncate">
                        {r.name || masked(r.address, r.channel)} {r.source && <span className="text-white/40">· {r.source}</span>}
                      </span>
                      <span className="shrink-0 text-xs text-white/45">{when(r.at)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-white/50">No opt-ins or opt-outs yet.</p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
