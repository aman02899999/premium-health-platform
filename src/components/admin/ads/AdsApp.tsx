"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, Copy, Download, Megaphone, Pause, Play, TrendingUp } from "lucide-react";
import { adLink, adMetrics, adVerdict, whatsappAdText, type Platform } from "@/lib/admin/ads-core";

type Ad = { id: string; name: string; platform: Platform; slug: string; landing: string; startOn: string; endOn: string | null; spendPaise: number; notes: string; active: boolean; leads: number; orders: number; netPaise: number };
type Data = {
  ads: Ad[];
  setup: { key: string; label: string; on: boolean; why: string }[];
  platforms: { id: Platform; label: string }[];
  pages: { path: string; label: string }[];
  segments: { id: string; label: string }[];
  siteUrl: string;
};

const card = "rounded-2xl bg-white/[.04] p-4 ring-1 ring-white/10 sm:p-5";
const input = "w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 placeholder:text-white/35 focus:outline-none focus:ring-brand/60";
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

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

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text).then(() => (setDone(true), setTimeout(() => setDone(false), 1500)))}
      className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs hover:bg-white/15"
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />} {done ? "Copied" : label}
    </button>
  );
}

function AdCard({ a, data, onSaved, onError }: { a: Ad; data: Data; onSaved: () => void; onError: (m: string) => void }) {
  const [spend, setSpend] = useState(String(a.spendPaise / 100));
  const m = adMetrics(a);
  const verdict = adVerdict(a, m);
  const link = adLink(data.siteUrl, a.landing, a.platform, a.slug);
  const changed = spend !== String(a.spendPaise / 100);
  const save = (body: Record<string, unknown>) => call("/api/admin/ads", { action: "update", id: a.id, ...body }).then(onSaved, (e) => onError(e.message));
  return (
    <article className={`${card} space-y-3 ${a.active ? "" : "opacity-60"}`}>
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{a.name}</h3>
          <p className="text-xs text-white/50">
            {data.platforms.find((p) => p.id === a.platform)?.label} · from {day(a.startOn)}
            {a.endOn ? ` to ${day(a.endOn)}` : ""} · tag <code className="text-white/70">{a.slug}</code>
          </p>
        </div>
        <button onClick={() => save({ active: !a.active })} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs" title={a.active ? "Mark as ended (results keep counting)" : "Mark as running again"}>
          {a.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {a.active ? "Mark ended" : "Mark running"}
        </button>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
        {[
          ["Spent", inr(a.spendPaise / 100)],
          ["Leads", String(a.leads)],
          ["Per lead", m.cpl === null ? "–" : inr(m.cpl)],
          ["Sales", String(a.orders)],
          ["Revenue", inr(a.netPaise / 100)],
          ["Return", m.roas === null ? "–" : `${m.roas}×`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-white/[.04] px-1 py-2">
            <dt className="text-[11px] text-white/50">{k}</dt>
            <dd className={`font-display text-lg ${k === "Return" && m.roas !== null ? (m.roas >= 1 ? "text-emerald-300" : "text-amber-300") : ""}`}>{v}</dd>
          </div>
        ))}
      </dl>
      {verdict && <p className="rounded-lg bg-sky-500/10 px-3 py-2 text-sm text-sky-100">{verdict}</p>}
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          save({ spend });
        }}
      >
        <label className="text-xs text-white/60" htmlFor={`spend-${a.id}`}>
          Total spent so far (₹)
        </label>
        <input id={`spend-${a.id}`} inputMode="decimal" value={spend} onChange={(e) => setSpend(e.target.value)} className={`${input} w-32`} />
        <button disabled={!changed} className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold disabled:opacity-40">
          Save
        </button>
      </form>
      <div className="flex flex-wrap gap-1.5">
        <CopyButton text={link} label="Website link" />
        {a.platform === "meta" && <CopyButton text={whatsappAdText(a.slug)} label="Click-to-WhatsApp message" />}
      </div>
    </article>
  );
}

export function AdsApp() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [form, setForm] = useState({ name: "", platform: "meta" as Platform, landing: "/membership", spend: "" });

  const load = useCallback(async () => {
    try {
      setData(await call<Data>("/api/admin/ads"));
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
    setNote("");
    try {
      const r = await call<{ slug: string }>("/api/admin/ads", { action: "create", ...form });
      setNote(`Campaign added with tag “${r.slug}”. Copy its link (or WhatsApp message) into the ad.`);
      setForm({ ...form, name: "", spend: "" });
      load();
    } catch (err) {
      setNote((err as Error).message);
    }
  }

  const all = data?.ads ?? [];
  const tot = all.reduce((t, a) => ({ spendPaise: t.spendPaise + a.spendPaise, leads: t.leads + a.leads, orders: t.orders + a.orders, netPaise: t.netPaise + a.netPaise }), { spendPaise: 0, leads: 0, orders: 0, netPaise: 0 });
  const tm = adMetrics(tot);
  const missing = data?.setup.filter((s) => !s.on) ?? [];

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <a href="/admin" aria-label="Back to Command Center" className="rounded-lg p-1.5 text-white/70 hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <TrendingUp className="h-5 w-5 text-sky-300" />
          <span className="font-display text-lg">Ads Manager</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
        {!data && !error && <p className="text-sm text-white/50">Loading…</p>}
        {data && (
          <>
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-6" aria-label="All campaigns">
              {[
                ["Spent", inr(tot.spendPaise / 100)],
                ["Leads", String(tot.leads)],
                ["Cost per lead", tm.cpl === null ? "–" : inr(tm.cpl)],
                ["Sales", String(tot.orders)],
                ["Revenue", inr(tot.netPaise / 100)],
                ["Return on spend", tm.roas === null ? "–" : `${tm.roas}×`],
              ].map(([k, v]) => (
                <div key={k} className={card}>
                  <p className="text-xs text-white/50">{k}</p>
                  <p className="mt-1 font-display text-2xl">{v}</p>
                </div>
              ))}
            </section>

            {missing.map((s) => (
              <p key={s.key} className="flex gap-2 rounded-xl bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <b>{s.label} is not connected.</b> {s.why}
                </span>
              </p>
            ))}

            <form onSubmit={create} className={`${card} grid gap-3 md:grid-cols-4 md:items-end`}>
              <h2 className="flex items-center gap-2 font-display text-lg md:col-span-4">
                <Megaphone className="h-5 w-5 text-sky-300" /> Add a campaign
              </h2>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block text-white/60">Campaign name</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Diwali offer – Sector 93" maxLength={80} className={input} required />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-white/60">Runs on</span>
                <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as Platform })} className={input}>
                  {data.platforms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-white/60">Opens page</span>
                <select value={form.landing} onChange={(e) => setForm({ ...form, landing: e.target.value })} className={input}>
                  {data.pages.map((p) => (
                    <option key={p.path} value={p.path}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-white/60">Spent so far (₹, optional)</span>
                <input inputMode="decimal" value={form.spend} onChange={(e) => setForm({ ...form, spend: e.target.value })} placeholder="0" className={input} />
              </label>
              <button className="btn-brand rounded-lg px-5 py-2 text-sm font-bold md:col-start-4">Add campaign</button>
              <p className="text-xs text-white/50 md:col-span-4">
                Website ads: paste the campaign&apos;s <b>Website link</b> as the ad&apos;s URL. Click-to-WhatsApp ads (Meta): paste the <b>Click-to-WhatsApp message</b>{" "}as the ad&apos;s pre-filled message, so each chat is credited to the ad. Update the spend from the ad
                platform&apos;s bill; results count every lead and sale the site can trace back to the campaign.
              </p>
              {note && <p className="rounded-lg bg-white/[.05] px-3 py-2 text-sm md:col-span-4">{note}</p>}
            </form>

            <section className="space-y-3" aria-label="Campaigns">
              <h2 className="font-display text-lg">Campaigns</h2>
              {!all.length && <p className="text-sm text-white/50">No campaigns yet.</p>}
              <div className="grid gap-3 lg:grid-cols-2">
                {all.map((a) => (
                  <AdCard key={`${a.id}:${a.spendPaise}`} a={a} data={data} onSaved={load} onError={setNote} />
                ))}
              </div>
            </section>

            <section className={card}>
              <h2 className="font-display text-lg">Audiences for ads</h2>
              <p className="text-sm text-white/50">
                Upload to Meta Ads Manager → Audiences → Custom audience → Customer list. Use “Current members” as an <b>exclusion</b>{" "}so you don&apos;t pay to show offers to people who already pay you, and
                “Left in the last 3 months” for win-back ads or as the seed of a lookalike audience.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.segments.map((s) => (
                  <a key={s.id} href={`/api/admin/audience?export=${s.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs hover:bg-white/15">
                    <Download className="h-3.5 w-3.5" /> {s.label}
                  </a>
                ))}
                <a href="/admin/contacts" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-sky-300 underline">
                  Make your own list in Contacts
                </a>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
