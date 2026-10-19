import "server-only";
import { pool } from "@/health/db";
import { SITE_URL } from "@/lib/site";
import { getContent } from "@/lib/content/store";
import { emailHtml, emailText } from "./email-html";
import { unsubscribeUrl } from "./marketing";
import { MARKETING_KINDS, isMarketingKind, type Draft } from "./messages";
import { emailConfigured, sendEmail, sendWhatsAppTemplate, whatsappConfigured, type SendResult } from "./providers";
import { getFile, signedUrl } from "./storage";

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
      `insert into public.message_outbox (channel, to_address, to_name, kind, body, template, params, dedupe_key, subject, attachment)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) on conflict (dedupe_key) do nothing`,
      [d.channel, d.to, d.toName.slice(0, 80), d.kind, d.body.slice(0, 6000), d.template, JSON.stringify(d.params), d.dedupeKey, d.subject?.slice(0, 200) ?? null, d.attachment ?? null],
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

type Pending = { id: string; channel: "whatsapp" | "email"; to_address: string; to_name: string; kind: string; body: string; template: string | null; params: string[]; attempts: number; subject: string | null; attachment: string | null };

/** The email footer: the number people call or WhatsApp to talk to a person (the Business app line). */
async function emailFooter(): Promise<string> {
  const phone = await getContent()
    .then((c) => c.business?.phone ?? "")
    .catch(() => "");
  return `Royal Fitness Club · Gejha, Sector 93, Noida${phone ? ` · Call / WhatsApp ${phone}` : ""}`;
}
const fileName = (p: string) => p.split("/").pop() || "plan.pdf";

async function sendOne(m: Pending): Promise<SendResult> {
  if (m.channel === "whatsapp") {
    let doc;
    if (m.attachment) {
      const link = await signedUrl(m.attachment);
      // A document template can't go out without its document; the admin sends it by hand.
      if (!link) return { ok: false, error: "No public link for the attachment (storage not configured)", retry: false };
      doc = { link, filename: fileName(m.attachment) };
    }
    return sendWhatsAppTemplate(m.to_address, m.template ?? "", m.params, doc);
  }
  // Marketing emails carry an unsubscribe link and the one-click List-Unsubscribe headers.
  const marketing = m.kind.startsWith("nurture-");
  const unsub = marketing ? unsubscribeUrl(m.to_address) : undefined;
  const attachments = m.attachment ? [{ filename: fileName(m.attachment), content: (await getFile(m.attachment)).toString("base64") }] : undefined;
  const FOOTER = await emailFooter();
  return sendEmail(m.to_address, m.subject || "Royal Fitness Club", emailText(m.body, `${FOOTER}${unsub ? `\nUnsubscribe: ${unsub}` : ""}`), {
    // Order, plan and booking emails are written as a plain letter so Gmail keeps them in Primary.
    html: emailHtml(m.body, { brand: "Royal Fitness Club", footer: `${FOOTER} · ${SITE_URL.replace(/^https?:\/\//, "")}`, unsubscribeUrl: unsub, style: marketing ? "newsletter" : "personal" }),
    attachments,
    headers: unsub ? { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : undefined,
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
  });
}

/**
 * Sends pending messages through the WhatsApp Cloud API and Resend, whichever are configured.
 * Each row is claimed with SKIP LOCKED so two overlapping runs never send the same message twice.
 * Messages for a channel that isn't configured stay pending for the admin to send by hand.
 */
/**
 * WhatsApp promotions sent per rolling 24 hours. A new business number may message only a limited
 * number of new people a day (Meta's messaging tier, 250 until the business is verified), and a
 * burst of promotions to old contacts drags the number's quality rating down. Raise
 * WHATSAPP_MARKETING_DAILY_CAP as Meta raises the tier.
 */
export const marketingDailyCap = () => {
  const n = Number(process.env.WHATSAPP_MARKETING_DAILY_CAP);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 200;
};

/**
 * Marketing emails ("nurture-" kinds: sequences, campaigns, review asks) per rolling 24 hours.
 * Resend's free plan stops at 100 emails a day for everything, so promotions stop at 70 and
 * leave room for receipts and plans. On a paid plan, raise EMAIL_MARKETING_DAILY_CAP.
 */
export const emailMarketingDailyCap = () => {
  const n = Number(process.env.EMAIL_MARKETING_DAILY_CAP);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 70;
};

/**
 * Sends pending messages. Receipts, plans and reminders always go first; WhatsApp promotions and
 * marketing emails wait behind them and stop for the day at their caps (they stay pending for the next run).
 * `deadline` (epoch ms) stops the loop in time for the caller's function limit.
 */
export async function dispatch(max = 100, deadline = Infinity): Promise<{ sent: number; failed: number; skipped: boolean; marketingHeld?: boolean }> {
  const channels = [whatsappConfigured() && "whatsapp", emailConfigured() && "email"].filter(Boolean) as string[];
  if (!channels.length) return { sent: 0, failed: 0, skipped: true };
  let sent = 0;
  let failed = 0;
  const { rows: used } = await pool.query<{ wa: number; email: number }>(
    `select count(*) filter (where channel = 'whatsapp' and kind = any($1))::int as wa, count(*) filter (where channel = 'email' and kind like 'nurture-%')::int as email
       from public.message_outbox where status = 'sent' and sent_at > now() - interval '24 hours'`,
    [MARKETING_KINDS],
  );
  let marketingLeft = Math.max(0, marketingDailyCap() - (used[0]?.wa ?? 0));
  let emailLeft = Math.max(0, emailMarketingDailyCap() - (used[0]?.email ?? 0));
  for (let i = 0; i < max && Date.now() < deadline; i++) {
    const client = await pool.connect();
    try {
      await client.query("begin");
      const { rows } = await client.query<Pending>(
        `select id, channel, to_address, to_name, kind, body, template, params, attempts, subject, attachment from public.message_outbox
          where status = 'pending' and channel = any($1) and attempts < 3
            and ($3 or not (channel = 'whatsapp' and kind = any($2)))
            and ($4 or not (channel = 'email' and kind like 'nurture-%'))
          order by ((channel = 'whatsapp' and kind = any($2)) or (channel = 'email' and kind like 'nurture-%')), created_at limit 1 for update skip locked`,
        [channels, MARKETING_KINDS, marketingLeft > 0, emailLeft > 0],
      );
      const m = rows[0];
      if (!m) {
        await client.query("rollback");
        break;
      }
      // Promotions never go to a number that tapped "Stop promotions".
      if (m.channel === "whatsapp" && isMarketingKind(m.kind)) {
        const { rowCount } = await client.query(`select 1 from public.whatsapp_optouts where phone = $1`, [m.to_address]);
        if (rowCount) {
          await client.query(`update public.message_outbox set status = 'cancelled', last_error = 'Opted out of promotions' where id = $1`, [m.id]);
          await client.query("commit");
          continue;
        }
      }
      const r = await sendOne(m).catch((err: Error): SendResult => ({ ok: false, error: err.message.slice(0, 300), retry: true }));
      if (r.ok) {
        await client.query(`update public.message_outbox set status = 'sent', sent_at = now(), sent_by = $2, attempts = attempts + 1, last_error = null where id = $1`, [m.id, m.channel === "whatsapp" ? "whatsapp-api" : "email-api"]);
        sent++;
        if (m.channel === "whatsapp" && isMarketingKind(m.kind)) marketingLeft--;
        if (m.channel === "email" && m.kind.startsWith("nurture-")) emailLeft--;
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
  return { sent, failed, skipped: false, marketingHeld: marketingLeft <= 0 || emailLeft <= 0 };
}
