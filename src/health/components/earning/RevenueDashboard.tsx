import type { ChannelRow, RevenueReport } from "@/lib/revenue/report";

// Admin earnings, from the real order and lead tables (see src/lib/revenue/report.ts).
// Server component: no figure here is estimated, and missing data says so.

const inr = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
const pct = (r: number | null) => (r === null ? "Data not available" : `${(r * 100).toFixed(1)}%`);
const NA = "Data not available";

type Audience = { newsletter: number; whatsapp: number; push: number; clicks30: number; referrals: number; converted: number };

function Tile({ label, value, formula }: { label: string; value: string; formula: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
      <div className="text-xs text-stone-500">{label}</div>
      <div className="mt-1 text-xl font-black tabular-nums">{value}</div>
      <div className="mt-1 text-[11px] text-stone-500">{formula}</div>
    </div>
  );
}

function ChannelTable({ title, rows, note }: { title: string; rows: ChannelRow[]; note: string }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="text-sm font-bold">{title}</h3>
      <p className="mt-1 text-xs text-stone-500">{note}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">No leads or paid orders in this period.</p>
      ) : (
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-xs uppercase text-stone-500">
            <tr>
              <th className="py-1">Source</th>
              <th className="py-1 text-right">Leads</th>
              <th className="py-1 text-right">Paid orders</th>
              <th className="py-1 text-right">Net revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-stone-100 dark:border-stone-800">
                <td className="py-1.5">{r.key === "unknown" ? "Unknown (before tracking, or no cookie)" : r.key === "none" ? "No campaign tag" : r.key}</td>
                <td className="py-1.5 text-right tabular-nums">{r.leads}</td>
                <td className="py-1.5 text-right tabular-nums">{r.orders}</td>
                <td className="py-1.5 text-right tabular-nums">{inr(r.netPaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function RevenueDashboard({ report, audience }: { report: RevenueReport; audience: Audience | null }) {
  const t = report.totals;
  return (
    <div className="space-y-6">
      <form className="flex flex-wrap items-end gap-3 text-sm" method="get">
        <label className="flex flex-col text-xs text-stone-500">
          From
          <input type="date" name="from" defaultValue={report.period.from} className="mt-1 rounded-lg border border-stone-300 px-2 py-1 text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100" />
        </label>
        <label className="flex flex-col text-xs text-stone-500">
          To
          <input type="date" name="to" defaultValue={report.period.to} className="mt-1 rounded-lg border border-stone-300 px-2 py-1 text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100" />
        </label>
        <button className="rounded-lg bg-emerald-700 px-3 py-1.5 font-semibold text-white">Show</button>
        <span className="text-xs text-stone-500">
          {report.period.from} to {report.period.to} (IST) · {report.currency} · source: Razorpay orders recorded on this site and its lead forms
        </span>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Collected (gross)" value={inr(t.grossPaise)} formula={`Sum of ${t.orders} paid orders, by payment date`} />
        <Tile label="Refunded" value={inr(t.refundedPaise)} formula="Refunds recorded on those orders" />
        <Tile label="Net collected" value={inr(t.netPaise)} formula="Collected − refunded. Revenue, not profit" />
        <Tile label="Average order" value={t.averageOrderPaise === null ? NA : inr(t.averageOrderPaise)} formula="Collected ÷ paid orders" />
        <Tile label="Leads" value={String(report.leads.total)} formula={`${report.leads.attributed} with a known source`} />
        <Tile label="Lead → customer" value={pct(report.leads.conversionRate)} formula={`${report.leads.converted} leads whose mobile paid afterwards ÷ leads`} />
        <Tile label="Returning buyers" value={pct(report.buyers.returningRate)} formula={`${report.buyers.returning} of ${report.buyers.total} buyers had paid before`} />
        <Tile label="Unfinished checkouts" value={String(t.pendingOrders)} formula={`Orders opened, not paid; ${t.failedOrders} failed payments`} />
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
        <h3 className="text-sm font-bold">By product</h3>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-xs uppercase text-stone-500">
            <tr>
              <th className="py-1">Product</th>
              <th className="py-1 text-right">Paid orders</th>
              <th className="py-1 text-right">Collected</th>
              <th className="py-1 text-right">Refunded</th>
              <th className="py-1 text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            {report.lines.map((l) => (
              <tr key={l.line} className="border-t border-stone-100 dark:border-stone-800">
                <td className="py-1.5">{l.label}</td>
                <td className="py-1.5 text-right tabular-nums">{l.orders}</td>
                <td className="py-1.5 text-right tabular-nums">{inr(l.grossPaise)}</td>
                <td className="py-1.5 text-right tabular-nums">{inr(l.refundedPaise)}</td>
                <td className="py-1.5 text-right tabular-nums font-semibold">{inr(l.netPaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-stone-500">Personal training isn&apos;t sold online, so it isn&apos;t recorded separately. Desk (cash/UPI) payments aren&apos;t included.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChannelTable title="By first-touch channel" rows={report.byFirstChannel} note="How the person first found the site (kept for 90 days in the visitor's browser)." />
        <ChannelTable title="By last-touch channel" rows={report.byLastChannel} note="What brought them back before they enquired or paid." />
      </div>
      <ChannelTable title="By campaign" rows={report.byCampaign} note="The utm_campaign tag of the first touch, else the last." />

      <div className="rounded-3xl border border-amber-300 bg-amber-50 p-6 text-sm dark:border-amber-800 dark:bg-amber-950">
        <h3 className="font-bold">Data not available</h3>
        <ul className="mt-2 list-disc pl-5 text-stone-700 dark:text-stone-300">
          {report.unavailable.map((u) => (
            <li key={u}>{u}</li>
          ))}
          <li>Premium subscriptions on the health site: online payment isn&apos;t live there, so there is no subscription revenue.</li>
        </ul>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
        <h3 className="text-sm font-bold">Health site audience (all time unless noted)</h3>
        {audience ? (
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            <div>Newsletter subscribers: <b>{audience.newsletter}</b></div>
            <div>WhatsApp opt-ins: <b>{audience.whatsapp}</b></div>
            <div>Push subscribers: <b>{audience.push}</b></div>
            <div>Affiliate clicks, last 30 days: <b>{audience.clicks30}</b></div>
            <div>Referrals: <b>{audience.referrals}</b> ({audience.converted} converted)</div>
            <div className="text-stone-500">Affiliate commission isn&apos;t reported back to the site, so it isn&apos;t shown.</div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-stone-500">{NA}</p>
        )}
      </div>
    </div>
  );
}
