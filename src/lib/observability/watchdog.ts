import "server-only";
import { pool } from "@/health/db";
import { lastSyncAt } from "@/health/lib/live-sync";
import { SITE_URL } from "@/lib/site";
import { todayIST } from "@/lib/growth/dates";
import { dispatch, enqueue } from "@/lib/growth/outbox";
import { evaluate, type JobRun, type Problem, type Snapshot } from "./checks";
import { alertDraft, telegramText } from "./alerts";

// Reads what the background jobs, webhooks and messages did recently (counts only, no personal
// data), and emails the owner about anything wrong, once per problem per day.

type Status = { at: string; ok: boolean; summary?: string };

/** A query that can't run reads as "nothing to report", so a missing table never raises a false alarm. */
async function one<T>(sql: string, fallback: T, params: unknown[] = []): Promise<T> {
  try {
    const { rows } = await pool.query(sql, params);
    return (rows[0] as T | undefined) ?? fallback;
  } catch (err) {
    console.error("[watchdog] query failed:", (err as Error).message);
    return fallback;
  }
}

export async function snapshot(): Promise<Snapshot> {
  const db = await pool
    .query("select 1")
    .then(() => true)
    .catch(() => false);
  const empty: Snapshot = {
    db,
    dailyRun: null,
    reelRun: null,
    healthSyncAt: null,
    reconcile: null,
    razorpay: { paidOrders14d: 0, events14d: 0, flagged24h: 0 },
    whatsapp: { sent: 0, withStatus: 0, failed: 0, topFailCode: null },
    email: { sent: 0, bounced: 0, failedToSend: 0 },
  };
  if (!db) return empty;
  const paidTables = ["membership_orders", "book_orders", "diet_orders", "shop_orders", "payment_requests"];
  const [status, sync, paid, events, wa, waCode, em] = await Promise.all([
    pool.query<{ key: string; value: Status & Record<string, unknown> }>(`select key, value from public.system_status where key in ('daily-run', 'reel-run', 'reconcile-run')`).then(
      (r) => r.rows,
      () => [],
    ),
    lastSyncAt(),
    one<{ n: number }>(
      `select (${paidTables.map((t) => `(select count(*) from public.${t} where status = 'paid' and razorpay_payment_id is not null and paid_at > now() - interval '14 days')`).join(" + ")})::int as n`,
      { n: 0 },
    ),
    one<{ total: number; flagged: number }>(
      `select count(*)::int as total,
              count(*) filter (where received_at > now() - interval '24 hours'
                and (outcome in ('unknown_order', 'amount_mismatch', 'error') or (outcome = 'received' and received_at < now() - interval '1 hour')))::int as flagged
         from public.payment_events where received_at > now() - interval '14 days'`,
      { total: 0, flagged: 0 },
    ),
    // Sent 2–26 hours ago, so Meta has had time to report back on each one.
    one<{ sent: number; with_status: number; failed: number }>(
      `select count(*)::int as sent, count(*) filter (where delivery is not null)::int as with_status, count(*) filter (where delivery = 'failed')::int as failed
         from public.message_outbox where channel = 'whatsapp' and status = 'sent' and sent_at between now() - interval '26 hours' and now() - interval '2 hours'`,
      { sent: 0, with_status: 0, failed: 0 },
    ),
    one<{ code: string | null }>(
      `select fail_code as code from public.message_outbox where channel = 'whatsapp' and delivery = 'failed' and fail_code is not null
          and sent_at between now() - interval '26 hours' and now() - interval '2 hours' group by fail_code order by count(*) desc limit 1`,
      { code: null },
    ),
    one<{ sent: number; bounced: number; failed: number }>(
      `select count(*) filter (where status = 'sent' and sent_at > now() - interval '24 hours')::int as sent,
              count(*) filter (where delivery = 'bounced' and sent_at > now() - interval '24 hours')::int as bounced,
              count(*) filter (where status = 'failed' and created_at > now() - interval '24 hours')::int as failed
         from public.message_outbox where channel = 'email' and created_at > now() - interval '3 days'`,
      { sent: 0, bounced: 0, failed: 0 },
    ),
  ]);
  const get = (k: string) => status.find((s) => s.key === k)?.value ?? null;
  const run = (k: string): JobRun => {
    const v = get(k);
    return v ? { at: v.at, ok: v.ok, summary: v.summary } : null;
  };
  const rec = get("reconcile-run") as (Status & { recovered?: number; mismatched?: string[]; errors?: string[] }) | null;
  return {
    db,
    dailyRun: run("daily-run"),
    reelRun: run("reel-run"),
    healthSyncAt: sync ? new Date(sync).toISOString() : null,
    reconcile: rec ? { at: rec.at, recovered: rec.recovered ?? 0, mismatched: rec.mismatched ?? [], errors: rec.errors ?? [] } : null,
    razorpay: { paidOrders14d: paid.n, events14d: events.total, flagged24h: events.flagged },
    whatsapp: { sent: wa.sent, withStatus: wa.with_status, failed: wa.failed, topFailCode: waCode.code },
    email: { sent: em.sent, bounced: em.bounced, failedToSend: em.failed },
  };
}

/** Telegram, when the owner has set a bot up (the same kind of bot the n8n site-down alert uses). */
async function telegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch (err) {
    console.error("[watchdog] telegram:", (err as Error).message);
    return false;
  }
}

/**
 * Checks everything and alerts the owner about new problems. Safe to call often: each problem
 * alerts once per India day (the outbox refuses a second copy), and only alert emails are sent
 * here, never queued customer messages.
 */
export async function runWatchdog(now = new Date()): Promise<{ problems: Problem[]; alerted: string[] }> {
  const problems = evaluate(await snapshot(), now);
  for (const p of problems) console.error(`[watchdog] ${p.key}: ${p.title}`);
  const to = process.env.ALERT_EMAIL || process.env.COACH_EMAIL;
  if (problems[0]?.key === "db-down") {
    // With the database down the outbox can't record anything; Telegram (if set) and the uptime
    // check outside Vercel are the only way to hear about it.
    await telegram(telegramText(problems[0]));
    return { problems, alerted: [] };
  }
  // The outbox row is the once-a-day claim, so without an address there is nothing to send.
  if (!to || !problems.length) return { problems, alerted: [] };
  const date = todayIST(now);
  const alerted: string[] = [];
  for (const p of problems) {
    if ((await enqueue([alertDraft(p, to, date, `${SITE_URL}/admin/growth`)]).catch(() => 0)) === 0) continue;
    alerted.push(p.key);
    await telegram(telegramText(p));
  }
  if (alerted.length) await dispatch(alerted.length, Date.now() + 30_000, { onlyKeys: alerted.map((k) => `admin-alert:${k}:${date}`) }).catch((err: Error) => console.error("[watchdog] send:", err.message));
  return { problems, alerted };
}
