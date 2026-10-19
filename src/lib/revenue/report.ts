import "server-only";
import { pool } from "@/health/db";
import { addDays, daysBetween, isIsoDate } from "@/lib/growth/dates";

// Revenue and acquisition figures computed from the order and lead tables, never estimated.
// Money is in paise. A figure the data can't support is null, and the screen shows
// "Data not available" for it instead of a number.

export type Period = { from: string; to: string }; // ISO dates (IST), inclusive

export type LineRevenue = { line: "membership" | "diet" | "shop" | "library"; label: string; orders: number; grossPaise: number; refundedPaise: number; netPaise: number };
export type ChannelRow = { key: string; leads: number; orders: number; netPaise: number };

export type RevenueReport = {
  period: Period;
  currency: "INR";
  lines: LineRevenue[];
  totals: { orders: number; grossPaise: number; refundedPaise: number; netPaise: number; averageOrderPaise: number | null; pendingOrders: number; failedOrders: number };
  buyers: { total: number; returning: number; returningRate: number | null };
  leads: { total: number; converted: number; conversionRate: number | null; attributed: number };
  byFirstChannel: ChannelRow[];
  byLastChannel: ChannelRow[];
  byCampaign: ChannelRow[];
  /** Ad spend, product cost and shipping cost aren't recorded anywhere yet. */
  unavailable: string[];
};

const LABELS: Record<LineRevenue["line"], string> = { membership: "Memberships", diet: "Diet plans", shop: "Supplement store", library: "Book library" };

// Every paid order in one shape. Store totals are whole rupees; phones normalised to 10 digits.
const ORDERS = `
  select 'membership' as line, id, status, amount_paise::bigint as amount, refunded_paise::bigint as refunded, created_at, paid_at, right(regexp_replace(phone, '\\D', '', 'g'), 10) as phone, attribution from public.membership_orders
  union all select 'diet', id, status, amount_paise, refunded_paise, created_at, paid_at, phone, attribution from public.diet_orders
  union all select 'shop', id, status, total::bigint * 100, refunded_paise, created_at, paid_at, phone, attribution from public.shop_orders
  union all select 'library', id, status, amount_paise, refunded_paise, created_at, paid_at, right(regexp_replace(phone, '\\D', '', 'g'), 10), attribution from public.book_orders`;

/** `col` falls on one of the period's IST calendar days ($1 = from, $2 = to). */
const within = (col: string) => `${col} >= ($1::date - interval '5 hours 30 minutes') and ${col} < ($2::date + interval '1 day' - interval '5 hours 30 minutes')`;

const ratio = (a: number, b: number) => (b > 0 ? a / b : null);

export async function revenueReport(period: Period): Promise<RevenueReport> {
  const args = [period.from, period.to];
  const [lines, states, buyers, leads, first, last, campaign] = await Promise.all([
    pool.query<{ line: LineRevenue["line"]; orders: number; gross: string; refunded: string }>(
      `select line, count(*)::int as orders, coalesce(sum(amount), 0)::text as gross, coalesce(sum(refunded), 0)::text as refunded
         from (${ORDERS}) o where status = 'paid' and ${within("paid_at")} group by line`,
      args,
    ),
    pool.query<{ pending: number; failed: number }>(
      `select count(*) filter (where status = 'created')::int as pending, count(*) filter (where status = 'failed')::int as failed
         from (${ORDERS}) o where ${within("created_at")}`,
      args,
    ),
    // A returning buyer had a paid order (any product) before their first one in this period.
    pool.query<{ total: number; returning: number }>(
      `with inside as (select phone, min(paid_at) as first_paid from (${ORDERS}) o where status = 'paid' and ${within("paid_at")} group by phone)
       select count(*)::int as total,
              count(*) filter (where exists (select 1 from (${ORDERS}) p where p.status = 'paid' and p.phone = inside.phone and p.paid_at < inside.first_paid))::int as returning
         from inside`,
      args,
    ),
    // A lead converted when the same mobile paid for anything after the lead came in.
    pool.query<{ total: number; converted: number; attributed: number }>(
      `select count(*)::int as total,
              count(*) filter (where exists (select 1 from (${ORDERS}) p where p.status = 'paid' and p.phone = right(regexp_replace(l.phone, '\\D', '', 'g'), 10) and p.paid_at >= l.created_at))::int as converted,
              count(*) filter (where l.attribution is not null)::int as attributed
         from public.leads l where ${within("l.created_at")}`,
      args,
    ),
    channelRows("coalesce(attribution->'first'->>'channel', 'unknown')", args),
    channelRows("coalesce(attribution->'last'->>'channel', 'unknown')", args),
    channelRows("coalesce(attribution->'first'->>'campaign', attribution->'last'->>'campaign', 'none')", args),
  ]);

  const byLine = new Map(lines.rows.map((r) => [r.line, r]));
  const lineRows: LineRevenue[] = (Object.keys(LABELS) as LineRevenue["line"][]).map((line) => {
    const r = byLine.get(line);
    const gross = Number(r?.gross ?? 0);
    const refunded = Number(r?.refunded ?? 0);
    return { line, label: LABELS[line], orders: r?.orders ?? 0, grossPaise: gross, refundedPaise: refunded, netPaise: gross - refunded };
  });
  const orders = lineRows.reduce((a, l) => a + l.orders, 0);
  const grossPaise = lineRows.reduce((a, l) => a + l.grossPaise, 0);
  const refundedPaise = lineRows.reduce((a, l) => a + l.refundedPaise, 0);
  const b = buyers.rows[0];
  const l = leads.rows[0];
  return {
    period,
    currency: "INR",
    lines: lineRows,
    totals: { orders, grossPaise, refundedPaise, netPaise: grossPaise - refundedPaise, averageOrderPaise: orders ? Math.round(grossPaise / orders) : null, pendingOrders: states.rows[0].pending, failedOrders: states.rows[0].failed },
    buyers: { total: b.total, returning: b.returning, returningRate: ratio(b.returning, b.total) },
    leads: { total: l.total, converted: l.converted, conversionRate: ratio(l.converted, l.total), attributed: l.attributed },
    byFirstChannel: first,
    byLastChannel: last,
    byCampaign: campaign,
    unavailable: ["Advertising spend (not recorded), so cost per lead, customer acquisition cost and return on ad spend", "Product, shipping and payment-fee costs (not recorded), so gross profit and contribution margin"],
  };
}

/** Leads and paid orders in the period grouped by an expression over the attribution column. */
async function channelRows(keyExpr: string, args: string[]): Promise<ChannelRow[]> {
  const { rows } = await pool.query<{ key: string; leads: number; orders: number; net: string }>(
    `select key, sum(leads)::int as leads, sum(orders)::int as orders, sum(net)::text as net from (
       select ${keyExpr} as key, 1 as leads, 0 as orders, 0::bigint as net from public.leads where ${within("created_at")}
       union all
       select ${keyExpr}, 0, 1, amount - refunded from (${ORDERS}) o where status = 'paid' and ${within("paid_at")}
     ) x group by key order by sum(net) desc, sum(leads) desc limit 20`,
    args,
  );
  return rows.map((r) => ({ key: r.key, leads: r.leads, orders: r.orders, netPaise: Number(r.net) }));
}

/** A period from query values, defaulting to the last 30 days (IST); at most a year, never in the future. */
export function parsePeriod(from: string | null | undefined, to: string | null | undefined, today: string): Period {
  const end = isIsoDate(to) && to <= today ? to : today;
  const start = isIsoDate(from) && from <= end && daysBetween(from, end) <= 366 ? from : addDays(end, -29);
  return { from: start, to: end };
}

/** Health-site audience counts that are actually recorded (sign-ups, push, affiliate clicks, referrals). */
export async function healthAudience() {
  const { rows } = await pool.query<{ newsletter: number; whatsapp: number; push: number; clicks30: number; referrals: number; converted: number }>(
    `select (select count(*) from public.marketing_contacts where channel = 'email' and unsubscribed_at is null)::int as newsletter,
            (select count(*) from public.marketing_contacts where channel = 'whatsapp' and unsubscribed_at is null)::int as whatsapp,
            (select count(*) from public.push_subscriptions)::int as push,
            (select count(*) from public.affiliate_clicks where created_at > now() - interval '30 days')::int as clicks30,
            (select count(*) from public.health_referrals)::int as referrals,
            (select count(*) from public.health_referrals where status = 'converted')::int as converted`,
  );
  return rows[0];
}
