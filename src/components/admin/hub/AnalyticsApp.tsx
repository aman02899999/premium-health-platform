"use client";

import { ArrowDownRight, ArrowLeft, ArrowUpRight, BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ANALYTICS_RANGES, change, inr, pctOf, totals, type DayRow } from "@/lib/admin/hub";
import { sourceName } from "@/lib/growth/funnel";
import type { Analytics } from "@/lib/admin/hub-data";
import type { CampaignRow } from "@/lib/growth/campaigns";

const card = "rounded-2xl bg-white/[.04] p-4 ring-1 ring-white/10 sm:p-5";
// One hue per chart: each chart shows one measure, so colour never has to tell series apart.
const BAR = "#38bdf8";

const short = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

function Delta({ now, before }: { now: number; before: number }) {
  const d = change(now, before);
  if (d === null) return <span className="text-xs text-white/40">no earlier data</span>;
  const up = d >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs ${up ? "text-emerald-300" : "text-red-300"}`}>
      {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {Math.abs(d)}% vs previous
    </span>
  );
}

function DayChart({ title, rows, field, money }: { title: string; rows: DayRow[]; field: keyof Omit<DayRow, "day">; money?: boolean }) {
  const fmt = (v: number) => (money ? inr(v) : v.toLocaleString("en-IN"));
  return (
    <section className={card}>
      <h2 className="font-display text-lg">{title}</h2>
      <div className="mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 4, left: -12, bottom: 0 }} barCategoryGap={2}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,.08)" />
            <XAxis dataKey="day" tickFormatter={short} tick={{ fill: "rgba(255,255,255,.5)", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,.5)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => (money && v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : String(v))} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,.06)" }}
              contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,.15)", borderRadius: 12, color: "#fff" }}
              labelFormatter={(l) => short(String(l))}
              formatter={(v) => [fmt(Number(v)), title]}
            />
            <Bar dataKey={field} fill={BAR} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

/** Sent → delivered → read → clicked, as plain bars: each step's share of what was sent. */
function Funnel({ t }: { t: Omit<DayRow, "day"> }) {
  const steps = [
    { label: "Sent", n: t.sent },
    { label: "Delivered", n: t.delivered },
    { label: "Read / opened", n: t.read },
    { label: "Clicked the link", n: t.clicked },
  ];
  return (
    <section className={card}>
      <h2 className="font-display text-lg">Message funnel</h2>
      <p className="text-sm text-white/50">Every WhatsApp message and email the site sent in this period.</p>
      <ul className="mt-4 space-y-3">
        {steps.map((s) => (
          <li key={s.label}>
            <div className="flex justify-between text-sm">
              <span>{s.label}</span>
              <span className="text-white/70">
                {s.n.toLocaleString("en-IN")} <span className="text-white/45">· {pctOf(s.n, t.sent)}%</span>
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full" style={{ width: `${pctOf(s.n, t.sent)}%`, background: BAR }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-white/45">Read and delivered come from WhatsApp and the email provider; people who switch off read receipts never show as read.</p>
    </section>
  );
}

export function AnalyticsApp({ range, data, campaigns }: { range: number; data: Analytics | null; campaigns: CampaignRow[] }) {
  const t = data ? totals(data.days) : null;
  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3">
          <a href="/admin" aria-label="Back to Command Center" className="rounded-lg p-1.5 text-white/70 hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <BarChart3 className="h-5 w-5 text-sky-300" />
          <span className="font-display text-lg">Analytics</span>
          <nav className="ml-auto flex rounded-xl bg-white/5 p-1 text-sm" aria-label="Period">
            {ANALYTICS_RANGES.map((r) => (
              <a key={r} href={`/admin/analytics?days=${r}`} aria-current={r === range ? "page" : undefined} className={`rounded-lg px-3 py-1.5 ${r === range ? "bg-white/15 font-semibold" : "text-white/60 hover:text-white"}`}>
                {r} days
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {!data || !t ? (
          <p className="rounded-xl bg-amber-400/10 px-4 py-3 text-sm text-amber-100">Analytics need the database.</p>
        ) : (
          <>
            <p className="text-sm text-white/50">
              {short(data.from)} – {short(data.to)}, India time. Arrows compare with the {range} days before.
            </p>
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Totals">
              {[
                { label: "Revenue", v: inr(t.revenue), now: t.revenue, before: data.previous.revenue },
                { label: "Paid orders", v: String(t.orders), now: t.orders, before: data.previous.orders },
                { label: "New leads", v: String(t.leads), now: t.leads, before: data.previous.leads },
                { label: "Messages received", v: String(t.inbound), now: t.inbound, before: data.previous.inbound },
                { label: "Messages sent", v: t.sent.toLocaleString("en-IN"), now: t.sent, before: data.previous.sent },
              ].map((k) => (
                <div key={k.label} className={card}>
                  <p className="text-xs text-white/50">{k.label}</p>
                  <p className="mt-1 font-display text-2xl">{k.v}</p>
                  <Delta now={k.now} before={k.before} />
                </div>
              ))}
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <DayChart title="Revenue per day" rows={data.days} field="revenue" money />
              <DayChart title="New leads per day" rows={data.days} field="leads" />
              <DayChart title="WhatsApp + Instagram messages received" rows={data.days} field="inbound" />
              <Funnel t={t} />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <section className={card}>
                <h2 className="font-display text-lg">Where leads came from</h2>
                {data.sources.length ? (
                  <table className="mt-3 w-full text-sm">
                    <tbody>
                      {data.sources.map((s) => (
                        <tr key={s.source} className="border-t border-white/5">
                          <td className="py-2">{sourceName(s.source)}</td>
                          <td className="py-2 text-right text-white/70">{s.leads}</td>
                          <td className="w-12 py-2 text-right text-white/45">{pctOf(s.leads, t.leads)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="mt-2 text-sm text-white/50">No leads in this period.</p>
                )}
              </section>
              <section className={card}>
                <h2 className="font-display text-lg">Revenue by product</h2>
                {data.revenueByKind.length ? (
                  <table className="mt-3 w-full text-sm">
                    <tbody>
                      {data.revenueByKind.map((k) => (
                        <tr key={k.kind} className="border-t border-white/5">
                          <td className="py-2">{k.kind}</td>
                          <td className="py-2 text-right text-white/45">{k.orders} orders</td>
                          <td className="py-2 text-right">{inr(k.rupees)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="mt-2 text-sm text-white/50">No online payments in this period. Desk payments are not counted here.</p>
                )}
              </section>
              <section className={card}>
                <h2 className="font-display text-lg">By channel</h2>
                {data.channels.length ? (
                  <table className="mt-3 w-full text-sm">
                    <thead className="text-xs text-white/45">
                      <tr>
                        <th className="py-1 text-left font-normal">Channel</th>
                        <th className="py-1 text-right font-normal">Sent</th>
                        <th className="py-1 text-right font-normal">Read</th>
                        <th className="py-1 text-right font-normal">Clicked</th>
                        <th className="py-1 text-right font-normal">Failed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.channels.map((c) => (
                        <tr key={c.channel} className="border-t border-white/5">
                          <td className="py-2 capitalize">{c.channel}</td>
                          <td className="py-2 text-right">{c.sent}</td>
                          <td className="py-2 text-right">{pctOf(c.read, c.sent)}%</td>
                          <td className="py-2 text-right">{c.clicked}</td>
                          <td className="py-2 text-right text-white/70">{c.failed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="mt-2 text-sm text-white/50">Nothing sent in this period.</p>
                )}
              </section>
            </div>

            <section className={card}>
              <div className="flex items-center gap-2">
                <h2 className="flex-1 font-display text-lg">Latest campaigns</h2>
                <a href="/admin/audience" className="text-sm text-sky-300 hover:underline">
                  All campaigns
                </a>
              </div>
              {campaigns.length ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="text-xs text-white/45">
                      <tr>
                        <th className="py-1 text-left font-normal">Campaign</th>
                        <th className="py-1 text-right font-normal">Sent</th>
                        <th className="py-1 text-right font-normal">Delivered</th>
                        <th className="py-1 text-right font-normal">Read</th>
                        <th className="py-1 text-right font-normal">Clicked</th>
                        <th className="py-1 text-right font-normal">Replied</th>
                        <th className="py-1 text-right font-normal">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((c) => (
                        <tr key={c.id} className="border-t border-white/5">
                          <td className="py-2">
                            {c.name}
                            <span className="block text-xs text-white/45">
                              {c.channel} · {short(c.createdAt.slice(0, 10))}
                              {c.pending ? ` · ${c.pending} waiting` : ""}
                            </span>
                          </td>
                          <td className="py-2 text-right">{c.sent}</td>
                          <td className="py-2 text-right">{pctOf(c.delivered, c.sent)}%</td>
                          <td className="py-2 text-right">{pctOf(c.read, c.sent)}%</td>
                          <td className="py-2 text-right">{c.clicked}</td>
                          <td className="py-2 text-right">{c.replied}</td>
                          <td className="py-2 text-right">{c.revenue ? inr(c.revenue) : "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-2 text-sm text-white/50">No campaigns yet.</p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
