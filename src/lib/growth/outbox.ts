import "server-only";
import { pool } from "@/health/db";
import type { Draft } from "./messages";
import { sendWhatsAppTemplate, whatsappConfigured } from "./providers";

// public.message_outbox: every automated message is recorded here before it is sent.
// The unique dedupe_key means a reminder can be queued any number of times but exists once.

export type OutboxItem = {
  id: string;
  createdAt: string;
  channel: "whatsapp" | "email";
  to: string;
  toName: string;
  kind: string;
  body: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  attempts: number;
  lastError: string | null;
  sentAt: string | null;
  sentBy: string | null;
};

type Row = { id: string; created_at: Date; channel: OutboxItem["channel"]; to_address: string; to_name: string; kind: string; body: string; status: OutboxItem["status"]; attempts: number; last_error: string | null; sent_at: Date | null; sent_by: string | null };
const fromRow = (r: Row): OutboxItem => ({ id: r.id, createdAt: r.created_at.toISOString(), channel: r.channel, to: r.to_address, toName: r.to_name, kind: r.kind, body: r.body, status: r.status, attempts: r.attempts, lastError: r.last_error, sentAt: r.sent_at?.toISOString() ?? null, sentBy: r.sent_by });
const COLUMNS = "id, created_at, channel, to_address, to_name, kind, body, status, attempts, last_error, sent_at, sent_by";

/** Queues drafts; returns how many were new (already-queued ones are skipped). */
export async function enqueue(drafts: Draft[]): Promise<number> {
  let added = 0;
  for (const d of drafts) {
    const { rowCount } = await pool.query(
      `insert into public.message_outbox (channel, to_address, to_name, kind, body, template, params, dedupe_key)
       values ($1, $2, $3, $4, $5, $6, $7, $8) on conflict (dedupe_key) do nothing`,
      [d.channel, d.to, d.toName.slice(0, 80), d.kind, d.body.slice(0, 2000), d.template, JSON.stringify(d.params), d.dedupeKey],
    );
    added += rowCount ?? 0;
  }
  return added;
}

export async function listOutbox(status: OutboxItem["status"] | "all" = "all", limit = 300): Promise<OutboxItem[]> {
  const { rows } = await pool.query<Row>(
    `select ${COLUMNS} from public.message_outbox ${status === "all" ? "" : "where status = $2"} order by created_at desc limit $1`,
    status === "all" ? [limit] : [limit, status],
  );
  return rows.map(fromRow);
}

/** The admin sent it by hand (click-to-chat) or decided not to send it. */
export async function markOutbox(id: string, status: "sent" | "cancelled" | "pending", by: string): Promise<void> {
  await pool.query(
    `update public.message_outbox set status = $2, sent_at = case when $2 = 'sent' then now() else null end, sent_by = case when $2 = 'sent' then $3 else null end where id = $1`,
    [id, status, by.slice(0, 200)],
  );
}

/** Cancels pending messages that no longer make sense (lead joined, member renewed). */
export async function cancelPending(kindPrefix: string, refId: string): Promise<void> {
  await pool.query(`update public.message_outbox set status = 'cancelled' where status = 'pending' and dedupe_key like $1`, [`${kindPrefix}%:${refId}%`]);
}

/**
 * Sends pending WhatsApp messages through the Cloud API, if configured. Each row is claimed
 * with SKIP LOCKED so two overlapping runs never send the same message twice.
 */
export async function dispatch(max = 100): Promise<{ sent: number; failed: number; skipped: boolean }> {
  if (!whatsappConfigured()) return { sent: 0, failed: 0, skipped: true };
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < max; i++) {
    const client = await pool.connect();
    try {
      await client.query("begin");
      const { rows } = await client.query<{ id: string; to_address: string; template: string; params: string[]; attempts: number }>(
        `select id, to_address, template, params, attempts from public.message_outbox
          where status = 'pending' and channel = 'whatsapp' and attempts < 3
          order by created_at limit 1 for update skip locked`,
      );
      const m = rows[0];
      if (!m) {
        await client.query("rollback");
        break;
      }
      const r = await sendWhatsAppTemplate(m.to_address, m.template, m.params);
      if (r.ok) {
        await client.query(`update public.message_outbox set status = 'sent', sent_at = now(), sent_by = 'whatsapp-api', attempts = attempts + 1, last_error = null where id = $1`, [m.id]);
        sent++;
      } else {
        await client.query(`update public.message_outbox set attempts = attempts + 1, last_error = $2, status = case when $3 then 'pending' else 'failed' end where id = $1`, [m.id, r.error, r.retry && m.attempts + 1 < 3]);
        failed++;
      }
      await client.query("commit");
    } catch (err) {
      await client.query("rollback").catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }
  return { sent, failed, skipped: false };
}
