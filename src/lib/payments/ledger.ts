import "server-only";
import { pool } from "@/health/db";
import type { KnownOrder, OrderKind, RazorpayEvent } from "./webhook-event";

// Cross-table payment bookkeeping for the four Razorpay order tables (membership, library,
// diet chart, supplement store) and the payment_events log. Server-only tables.

const ORDER_TABLES: { kind: OrderKind; table: string; amount: string }[] = [
  { kind: "membership", table: "public.membership_orders", amount: "amount_paise" },
  { kind: "library", table: "public.book_orders", amount: "amount_paise" },
  { kind: "diet", table: "public.diet_orders", amount: "amount_paise" },
  // Store totals are whole rupees.
  { kind: "shop", table: "public.shop_orders", amount: "total * 100" },
];

/** The internal order for a Razorpay order id, with the amount we asked Razorpay to collect. */
export async function findOrder(razorpayOrderId: string): Promise<KnownOrder | null> {
  const sql = ORDER_TABLES.map(
    (t) => `select '${t.kind}'::text as kind, (${t.amount})::bigint as amount, status, razorpay_payment_id from ${t.table} where razorpay_order_id = $1`,
  ).join(" union all ");
  const { rows } = await pool.query<{ kind: OrderKind; amount: string; status: string; razorpay_payment_id: string | null }>(sql, [razorpayOrderId]);
  const r = rows[0];
  return r ? { kind: r.kind, amountPaise: Number(r.amount), status: r.status, paymentId: r.razorpay_payment_id } : null;
}

export type Claim = "new" | "retry" | "duplicate";

/**
 * Records a webhook delivery before acting on it. "duplicate" means an earlier delivery of the
 * same event finished (whatever its outcome), so this one must change nothing. "retry" means an
 * earlier delivery started but never finished (it failed or timed out): process it again; every
 * order update is idempotent, so that is safe.
 */
export async function claimEvent(e: RazorpayEvent): Promise<Claim> {
  const { rows } = await pool.query<{ inserted: boolean; processed: boolean }>(
    `insert into public.payment_events (event_id, event, razorpay_order_id, razorpay_payment_id, amount_paise, currency)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (event_id) do update set attempts = public.payment_events.attempts + 1
     returning (xmax = 0) as inserted, processed_at is not null as processed`,
    [e.eventId, e.event, e.orderId, e.paymentId, e.event.startsWith("refund.") ? e.refundedPaise : e.amountPaise, e.currency],
  );
  const r = rows[0];
  return r.inserted ? "new" : r.processed ? "duplicate" : "retry";
}

export type Outcome = "applied" | "ignored" | "unknown_order" | "amount_mismatch" | "error";

/** Closes an event. "error" leaves it open so Razorpay's retry processes it again. */
export async function finishEvent(eventId: string, outcome: Outcome, detail = ""): Promise<void> {
  await pool.query(`update public.payment_events set outcome = $2, detail = left($3, 500), processed_at = case when $2 = 'error' then null else now() end where event_id = $1`, [
    eventId,
    outcome,
    detail,
  ]);
}

/**
 * Records money returned on a payment. `refundedPaise` is the payment's running total, so
 * replays and out-of-order deliveries keep the largest figure instead of adding up.
 * Returns the kinds of order that matched (normally one).
 */
export async function recordRefund(paymentId: string, refundedPaise: number): Promise<OrderKind[]> {
  const kinds: OrderKind[] = [];
  for (const t of ORDER_TABLES) {
    const { rowCount } = await pool.query(
      `update ${t.table} set refunded_paise = greatest(refunded_paise, least($2::bigint, (${t.amount})::bigint)::int), refunded_at = coalesce(refunded_at, now()) where razorpay_payment_id = $1`,
      [paymentId, refundedPaise],
    );
    if (rowCount) kinds.push(t.kind);
  }
  return kinds;
}

/** Flags a payment the customer's bank has disputed (chargeback). The admin decides what to do. */
export async function recordDispute(paymentId: string): Promise<OrderKind[]> {
  const kinds: OrderKind[] = [];
  for (const t of ORDER_TABLES) {
    const { rowCount } = await pool.query(`update ${t.table} set disputed_at = coalesce(disputed_at, now()) where razorpay_payment_id = $1`, [paymentId]);
    if (rowCount) kinds.push(t.kind);
  }
  return kinds;
}

/** Unpaid orders old enough that the buyer has finished at Razorpay, young enough to still matter. */
export async function ordersToReconcile(now = new Date(), opts: { minAgeMinutes?: number; maxAgeHours?: number; limit?: number } = {}): Promise<{ kind: OrderKind; razorpayOrderId: string; amountPaise: number }[]> {
  const sql = ORDER_TABLES.map(
    (t) =>
      `select '${t.kind}'::text as kind, razorpay_order_id, (${t.amount})::bigint as amount, created_at from ${t.table}
        where status <> 'paid' and created_at between $1::timestamptz - make_interval(hours => $3) and $1::timestamptz - make_interval(mins => $2)`,
  ).join(" union all ");
  const { rows } = await pool.query<{ kind: OrderKind; razorpay_order_id: string; amount: string }>(`${sql} order by created_at desc limit $4`, [
    now.toISOString(),
    opts.minAgeMinutes ?? 20,
    opts.maxAgeHours ?? 72,
    opts.limit ?? 60,
  ]);
  return rows.map((r) => ({ kind: r.kind, razorpayOrderId: r.razorpay_order_id, amountPaise: Number(r.amount) }));
}

export type FlaggedEvent = { eventId: string; event: string; razorpayOrderId: string | null; razorpayPaymentId: string | null; amountPaise: number | null; outcome: string; detail: string; receivedAt: string };

/** Webhook events a person should look at: refused captures, unknown orders, failures, double payments. */
export async function flaggedEvents(limit = 50): Promise<FlaggedEvent[]> {
  const { rows } = await pool.query<{ event_id: string; event: string; razorpay_order_id: string | null; razorpay_payment_id: string | null; amount_paise: string | null; outcome: string; detail: string; received_at: Date }>(
    `select event_id, event, razorpay_order_id, razorpay_payment_id, amount_paise, outcome, detail, received_at from public.payment_events
      where outcome in ('unknown_order', 'amount_mismatch', 'error') or (outcome = 'applied' and detail <> '')
      order by received_at desc limit $1`,
    [limit],
  );
  return rows.map((r) => ({
    eventId: r.event_id,
    event: r.event,
    razorpayOrderId: r.razorpay_order_id,
    razorpayPaymentId: r.razorpay_payment_id,
    amountPaise: r.amount_paise === null ? null : Number(r.amount_paise),
    outcome: r.outcome,
    detail: r.detail,
    receivedAt: r.received_at.toISOString(),
  }));
}
