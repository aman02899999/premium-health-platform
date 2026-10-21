import "server-only";
import { pool } from "@/health/db";
import { addDays, todayIST } from "@/lib/growth/dates";
import { fillDays, type Counters, type DayRow } from "./hub";
import { callListCount } from "@/lib/growth/call-list";

// Live numbers for the Command Center and the Analytics page. Every query stands alone and a
// missing table reads as zero, so one unapplied migration never blanks the whole dashboard.

const one = async (sql: string, params: unknown[] = []): Promise<number> => {
  try {
    const { rows } = await pool.query<{ n: string | number | null }>(sql, params);
    return Number(rows[0]?.n ?? 0) || 0;
  } catch (err) {
    console.error("[hub] counter:", (err as Error).message);
    return 0;
  }
};

const many = async <T,>(sql: string, params: unknown[] = []): Promise<T[]> => {
  try {
    return (await pool.query(sql, params)).rows as T[];
  } catch (err) {
    console.error("[hub] query:", (err as Error).message);
    return [];
  }
};

// Paid money, net of refunds, in rupees, with the time it was paid. Shop totals are rupees already.
const PAID = `
  select paid_at, (amount_paise - refunded_paise) / 100.0 as rupees, 'Membership' as kind from public.membership_orders where status = 'paid' and paid_at is not null
  union all select paid_at, (amount_paise - refunded_paise) / 100.0, 'Diet plan' from public.diet_orders where status = 'paid' and paid_at is not null
  union all select paid_at, total - refunded_paise / 100.0, 'Supplements' from public.shop_orders where status = 'paid' and paid_at is not null
  union all select paid_at, (amount_paise - refunded_paise) / 100.0, 'Book' from public.book_orders where status = 'paid' and paid_at is not null
  union all select paid_at, (amount_paise - refunded_paise) / 100.0, 'Payment link' from public.payment_requests where status = 'paid' and paid_at is not null`;

// India's calendar day for a timestamp.
const IST_DAY = (col: string) => `to_char(${col} at time zone 'Asia/Kolkata', 'YYYY-MM-DD')`;

export async function hubCounters(now = new Date()): Promise<Counters> {
  const today = todayIST(now);
  const [chatsWaiting, leadsToday, leadsUncontacted, trialsToday, activeMembers, expiring7, plansToReview, pending, failed7, revenueToday, revenue30, sent, delivered, read, clicked, shopToShip, reviewsPending, callList] = await Promise.all([
    // Conversations whose newest message is the customer's: theirs is later than anything we sent.
    one(`with last_in as (select from_id as peer, max(created_at) as at from public.social_inbox where channel = 'whatsapp' and kind = 'message' and created_at > now() - interval '7 days' group by 1),
          last_out as (select to_id as peer, max(created_at) as at from public.chat_replies where channel = 'whatsapp' and ok group by 1)
         select count(*) as n from last_in i left join last_out o on o.peer = i.peer where o.at is null or o.at < i.at`),
    one(`select count(*) as n from public.leads where ${IST_DAY("created_at")} = $1`, [today]),
    one(`select count(*) as n from public.leads where status = 'new' and follow_ups and created_at between now() - interval '3 days' and now() - interval '2 hours'`),
    one(`select count(*) as n from public.leads where trial_at is not null and ${IST_DAY("trial_at")} = $1`, [today]),
    one(`select count(*) as n from public.members where expires_on >= $1::date`, [today]),
    one(`select count(*) as n from public.members where expires_on between $1::date and $2::date`, [today, addDays(today, 7)]),
    one(`select count(*) as n from public.diet_orders where status = 'paid' and stage in ('new', 'draft_ready')`),
    one(`select count(*) as n from public.message_outbox where status = 'pending'`),
    one(`select count(*) as n from public.message_outbox where status = 'failed' and created_at > now() - interval '7 days'`),
    one(`select coalesce(sum(rupees), 0) as n from (${PAID}) p where ${IST_DAY("paid_at")} = $1`, [today]),
    one(`select coalesce(sum(rupees), 0) as n from (${PAID}) p where paid_at > now() - interval '30 days'`),
    one(`select count(*) as n from public.message_outbox where dedupe_key like 'campaign:%' and status = 'sent' and sent_at > now() - interval '7 days'`),
    one(`select count(*) as n from public.message_outbox where dedupe_key like 'campaign:%' and status = 'sent' and sent_at > now() - interval '7 days' and delivered_at is not null`),
    one(`select count(*) as n from public.message_outbox where dedupe_key like 'campaign:%' and status = 'sent' and sent_at > now() - interval '7 days' and read_at is not null`),
    one(`select count(*) as n from public.message_outbox where dedupe_key like 'campaign:%' and status = 'sent' and sent_at > now() - interval '7 days' and clicks > 0`),
    one(`select count(*) as n from public.shop_orders where status = 'paid' and fulfilment in ('new', 'packed')`),
    one(`select count(*) as n from public.reviews where status = 'pending'`),
    callListCount(now),
  ]);
  return {
    chatsWaiting,
    leadsToday,
    leadsUncontacted,
    trialsToday,
    activeMembers,
    expiring7,
    plansToReview,
    pending,
    failed7,
    revenueToday: Math.round(revenueToday),
    revenue30: Math.round(revenue30),
    campaign7: { sent, delivered, read, clicked },
    shopToShip,
    reviewsPending,
    callList,
  };
}

export type Analytics = {
  from: string;
  to: string;
  days: DayRow[];
  /** The same totals for the period before, for the change arrows. */
  previous: Omit<DayRow, "day">;
  sources: { source: string; leads: number }[];
  revenueByKind: { kind: string; rupees: number; orders: number }[];
  channels: { channel: string; sent: number; delivered: number; read: number; clicked: number; failed: number }[];
};

type Agg = { day: string; n: string | number };

/** Day-by-day numbers for the last `range` days (India time), with the period before for comparison. */
export async function analyticsData(range: number, now = new Date()): Promise<Analytics> {
  const to = todayIST(now);
  const from = addDays(to, -(range - 1));
  const prevFrom = addDays(from, -range);
  // Covers both periods; each series is split by day afterwards.
  const window = [prevFrom, addDays(to, 1)];
  const span = (col: string) => `${col} >= ($1::date::timestamp at time zone 'Asia/Kolkata') and ${col} < ($2::date::timestamp at time zone 'Asia/Kolkata')`;
  const [leads, sent, delivered, read, clicked, inbound, revenue, orders, sources, byKind, channels] = await Promise.all([
    many<Agg>(`select ${IST_DAY("created_at")} as day, count(*) as n from public.leads where ${span("created_at")} group by 1`, window),
    many<Agg>(`select ${IST_DAY("sent_at")} as day, count(*) as n from public.message_outbox where status = 'sent' and ${span("sent_at")} group by 1`, window),
    many<Agg>(`select ${IST_DAY("sent_at")} as day, count(*) as n from public.message_outbox where status = 'sent' and delivered_at is not null and ${span("sent_at")} group by 1`, window),
    many<Agg>(`select ${IST_DAY("sent_at")} as day, count(*) as n from public.message_outbox where status = 'sent' and read_at is not null and ${span("sent_at")} group by 1`, window),
    many<Agg>(`select ${IST_DAY("sent_at")} as day, count(*) as n from public.message_outbox where status = 'sent' and clicks > 0 and ${span("sent_at")} group by 1`, window),
    many<Agg>(`select ${IST_DAY("created_at")} as day, count(*) as n from public.social_inbox where kind = 'message' and ${span("created_at")} group by 1`, window),
    many<Agg>(`select ${IST_DAY("paid_at")} as day, sum(rupees) as n from (${PAID}) p where ${span("paid_at")} group by 1`, window),
    many<Agg>(`select ${IST_DAY("paid_at")} as day, count(*) as n from (${PAID}) p where ${span("paid_at")} group by 1`, window),
    many<{ source: string; leads: string }>(`select source, count(*) as leads from public.leads where ${span("created_at")} group by 1 order by 2 desc limit 8`, [from, addDays(to, 1)]),
    many<{ kind: string; rupees: string; orders: string }>(`select kind, sum(rupees) as rupees, count(*) as orders from (${PAID}) p where ${span("paid_at")} group by 1 order by 2 desc`, [from, addDays(to, 1)]),
    many<{ channel: string; sent: string; delivered: string; read: string; clicked: string; failed: string }>(
      `select channel, count(*) filter (where status = 'sent') as sent,
              count(*) filter (where status = 'sent' and delivered_at is not null) as delivered,
              count(*) filter (where status = 'sent' and read_at is not null) as read,
              count(*) filter (where status = 'sent' and clicks > 0) as clicked,
              count(*) filter (where status = 'failed' or delivery in ('failed', 'bounced')) as failed
         from public.message_outbox where ${span("coalesce(sent_at, created_at)")} and status in ('sent', 'failed') group by 1 order by 1`,
      [from, addDays(to, 1)],
    ),
  ]);
  const rows = new Map<string, Partial<DayRow>>();
  const put = (series: Agg[], key: keyof Omit<DayRow, "day">) => {
    for (const r of series) {
      const row = rows.get(r.day) ?? { day: r.day };
      row[key] = Math.round(Number(r.n) || 0);
      rows.set(r.day, row);
    }
  };
  put(leads, "leads");
  put(sent, "sent");
  put(delivered, "delivered");
  put(read, "read");
  put(clicked, "clicked");
  put(inbound, "inbound");
  put(revenue, "revenue");
  put(orders, "orders");
  const all = [...rows.values()];
  const days = fillDays(all, from, to);
  const before = fillDays(all, prevFrom, addDays(from, -1));
  const previous = before.reduce(
    (t, r) => ({ leads: t.leads + r.leads, sent: t.sent + r.sent, delivered: t.delivered + r.delivered, read: t.read + r.read, clicked: t.clicked + r.clicked, inbound: t.inbound + r.inbound, revenue: t.revenue + r.revenue, orders: t.orders + r.orders }),
    { leads: 0, sent: 0, delivered: 0, read: 0, clicked: 0, inbound: 0, revenue: 0, orders: 0 },
  );
  return {
    from,
    to,
    days,
    previous,
    sources: sources.map((s) => ({ source: s.source, leads: Number(s.leads) })),
    revenueByKind: byKind.map((k) => ({ kind: k.kind, rupees: Math.round(Number(k.rupees)), orders: Number(k.orders) })),
    channels: channels.map((c) => ({ channel: c.channel, sent: Number(c.sent), delivered: Number(c.delivered), read: Number(c.read), clicked: Number(c.clicked), failed: Number(c.failed) })),
  };
}
