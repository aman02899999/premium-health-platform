import "server-only";
import { pool } from "@/health/db";
import { failureEffect, outranks, suppressesEmail, type Delivery, type EmailEvent, type WaStatus } from "./tracking-core";

type Hit = { id: string; delivery: Delivery | null; kind: string; to_address: string };

/**
 * The message a WhatsApp status belongs to: by Meta's message id, or, for messages sent before
 * ids were kept, the latest message sent to that number in the 3 days before the status.
 */
async function findWhatsApp(s: WaStatus): Promise<Hit | null> {
  const byId = await pool.query<Hit>(`select id, delivery, kind, to_address from public.message_outbox where provider_id = $1 limit 1`, [s.id]);
  if (byId.rows[0]) return byId.rows[0];
  const { rows } = await pool.query<Hit>(
    `select id, delivery, kind, to_address from public.message_outbox
      where channel = 'whatsapp' and status = 'sent' and provider_id is null and to_address = $1
        and sent_at between $2::timestamptz - interval '3 days' and $2::timestamptz + interval '5 minutes'
      order by sent_at desc limit 1`,
    [s.recipient, s.at.toISOString()],
  );
  if (rows[0]) await pool.query(`update public.message_outbox set provider_id = $2 where id = $1 and provider_id is null`, [rows[0].id, s.id]);
  return rows[0] ?? null;
}

/** Records one WhatsApp status. Returns what it changed, for logs and tests. */
export async function recordWhatsAppStatus(s: WaStatus): Promise<"unmatched" | "ignored" | Delivery> {
  if (s.status === "sent") return "ignored"; // "sent" is what the send call already told us
  const m = await findWhatsApp(s);
  if (!m) return "unmatched";
  const next: Delivery = s.status;
  await pool.query(`insert into public.message_events (outbox_id, event, at, detail) values ($1, $2, $3, $4)`, [
    m.id,
    next,
    s.at.toISOString(),
    s.code ? JSON.stringify({ code: s.code, reason: s.reason }) : null,
  ]);
  // One statement for every status: timestamps fill once, and the status only moves forward
  // ("read" also means delivered, even if Meta's "delivered" never arrives).
  await pool.query(
    `update public.message_outbox set
       delivered_at = case when $2 in ('delivered', 'read') then coalesce(delivered_at, $3::timestamptz) else delivered_at end,
       read_at = case when $2 = 'read' then coalesce(read_at, $3::timestamptz) else read_at end,
       failed_at = case when $2 = 'failed' then coalesce(failed_at, $3::timestamptz) else failed_at end,
       delivery = case when $4 then $2::text else delivery end,
       fail_code = case when $2 = 'failed' then $5::text else fail_code end,
       fail_reason = case when $2 = 'failed' then $6::text else fail_reason end
     where id = $1`,
    [m.id, next, s.at.toISOString(), outranks(next, m.delivery), s.code, s.reason],
  );
  const effect = next === "failed" ? failureEffect(s.code) : null;
  if (effect === "unreachable")
    await pool.query(
      `insert into public.whatsapp_unreachable (phone, code, reason) values ($1, $2, $3)
       on conflict (phone) do update set failures = public.whatsapp_unreachable.failures + 1, code = excluded.code, reason = excluded.reason, updated_at = now()`,
      [m.to_address, s.code, s.reason ?? ""],
    );
  if (effect === "opted-out") await pool.query(`insert into public.whatsapp_optouts (phone) values ($1) on conflict (phone) do nothing`, [m.to_address]);
  return next;
}

/** Records one Resend event against the email it belongs to. A complaint or hard bounce also suppresses the address. */
export async function recordEmailEvent(e: EmailEvent): Promise<"unmatched" | EmailEvent["type"]> {
  const { rows } = await pool.query<Hit>(`select id, delivery, kind, to_address from public.message_outbox where provider_id = $1 limit 1`, [e.emailId]);
  const m = rows[0];
  if (!m) return "unmatched";
  await pool.query(`insert into public.message_events (outbox_id, event, at, detail) values ($1, $2, $3, $4)`, [
    m.id,
    e.type,
    e.at.toISOString(),
    e.link || e.reason ? JSON.stringify({ link: e.link, reason: e.reason }) : null,
  ]);
  if (e.type === "opened") await pool.query(`update public.message_outbox set read_at = coalesce(read_at, $2), delivered_at = coalesce(delivered_at, $2), delivery = case when delivery is null or delivery = 'delivered' then 'read' else delivery end where id = $1`, [m.id, e.at.toISOString()]);
  else if (e.type === "clicked") await pool.query(`update public.message_outbox set clicks = clicks + 1, first_click_at = coalesce(first_click_at, $2) where id = $1 and link_code is null`, [m.id, e.at.toISOString()]);
  else
    await pool.query(
      `update public.message_outbox set
         delivered_at = case when $2 = 'delivered' then coalesce(delivered_at, $3::timestamptz) else delivered_at end,
         failed_at = case when $2 in ('bounced', 'complained') then coalesce(failed_at, $3::timestamptz) else failed_at end,
         delivery = case when $4 then $2::text else delivery end,
         fail_reason = case when $2 = 'bounced' then $5::text else fail_reason end
       where id = $1`,
      [m.id, e.type, e.at.toISOString(), outranks(e.type, m.delivery), e.reason],
    );
  if (e.type === "complained" || e.type === "bounced")
    await pool.query(`update public.marketing_contacts set unsubscribed_at = coalesce(unsubscribed_at, now()) where channel = 'email' and address = lower($1)`, [m.to_address]);
  // Imported contacts have no marketing_contacts row, so the update above misses them: the
  // suppression list covers every address, and the outbox checks it before each marketing email.
  if (suppressesEmail(e))
    await pool.query(`insert into public.email_suppressions (address, reason, detail) values (lower($1), $2, $3) on conflict (address) do nothing`, [
      m.to_address,
      e.type === "complained" ? "complained" : "bounced",
      (e.reason ?? "").slice(0, 300),
    ]);
  return e.type;
}

/** A person opened a tracked link: count it and return where it goes (null when the code is unknown). */
export async function recordClick(code: string, counted: boolean): Promise<string | null> {
  const { rows } = await pool.query<{ id: string; link_url: string }>(
    counted
      ? `update public.message_outbox set clicks = clicks + 1, first_click_at = coalesce(first_click_at, now()) where link_code = $1 returning id, link_url`
      : `select id, link_url from public.message_outbox where link_code = $1`,
    [code],
  );
  const m = rows[0];
  if (!m?.link_url) return null;
  if (counted) await pool.query(`insert into public.message_events (outbox_id, event) values ($1, 'clicked')`, [m.id]);
  return m.link_url;
}
