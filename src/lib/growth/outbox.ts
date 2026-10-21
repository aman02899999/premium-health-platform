import "server-only";
import { pool } from "@/health/db";
import { SITE_URL } from "@/lib/site";
import { getContent } from "@/lib/content/store";
import { emailHtml, emailText, type EmailLinks } from "./email-html";
import { unsubscribeUrl } from "./marketing";
import { MARKETING_KINDS, isMarketingKind, type Draft } from "./messages";
import { emailConfigured, sendEmail, whatsappConfigured, type SendResult } from "./providers";
import { sendKind } from "./wa-templates";
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
      `insert into public.message_outbox (channel, to_address, to_name, kind, body, template, params, dedupe_key, subject, attachment, link_code, link_url)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) on conflict (dedupe_key) do nothing`,
      [d.channel, d.to, d.toName.slice(0, 80), d.kind, d.body.slice(0, 6000), d.template, JSON.stringify(d.params), d.dedupeKey, d.subject?.slice(0, 200) ?? null, d.attachment ?? null, d.link?.code ?? null, d.link?.url.slice(0, 1000) ?? null],
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

/** What every email shows around the body: the footer line, quick links and the published rating. */
async function emailContext(): Promise<{ footer: string; links: EmailLinks; trust: string }> {
  const b = await getContent()
    .then((c) => c.business)
    .catch(() => undefined);
  const phone = b?.phone ?? "";
  // The number a person answers (calls and manual chats); the API number only sends templates.
  const talk = phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1");
  return {
    footer: `Royal Fitness Club · Gejha, Sector 93, Noida${phone ? ` · Call / WhatsApp ${phone}` : ""}`,
    links: {
      site: SITE_URL,
      join: `${SITE_URL}/membership`,
      trial: `${SITE_URL}/contact#trial`,
      whatsapp: talk ? `https://wa.me/${talk}` : undefined,
      directions: b?.googleMapsUrl || `${SITE_URL}/contact`,
      instagram: b?.instagram ? `https://www.instagram.com/${b.instagram.replace(/^@/, "")}/` : undefined,
    },
    trust: b?.rating?.count ? `★ ${b.rating.value} · ${b.rating.count}+ ratings on ${b.rating.source} · Trainers on the floor · Secure online payments` : "",
  };
}

/** Coach and admin alerts get the compact layout; customer mail the full one. */
const INTERNAL_KIND = /^(chat-alert|admin-|coach-|review-pending)/;

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
    return sendKind(m.to_address, m.kind, m.template ?? "", m.params, doc);
  }
  // Marketing emails carry an unsubscribe link and the one-click List-Unsubscribe headers.
  const marketing = m.kind.startsWith("nurture-");
  const unsub = marketing ? unsubscribeUrl(m.to_address) : undefined;
  const attachments = m.attachment ? [{ filename: fileName(m.attachment), content: (await getFile(m.attachment)).toString("base64") }] : undefined;
  const ctx = await emailContext();
  const FOOTER = ctx.footer;
  return sendEmail(m.to_address, m.subject || "Royal Fitness Club", emailText(m.body, `${FOOTER}${unsub ? `\nUnsubscribe: ${unsub}` : ""}`), {
    html: emailHtml(m.body, {
      brand: "Royal Fitness Club",
      footer: `${FOOTER} · ${SITE_URL.replace(/^https?:\/\//, "")}`,
      unsubscribeUrl: unsub,
      style: marketing ? "newsletter" : INTERNAL_KIND.test(m.kind) ? "internal" : "personal",
      siteUrl: SITE_URL,
      kind: m.kind,
      links: ctx.links,
      trust: ctx.trust,
    }),
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
export async function dispatch(max = 100, deadline = Infinity, opts: { waitForCap?: boolean } = {}): Promise<{ sent: number; failed: number; skipped: boolean; marketingHeld?: boolean; waitedMs?: number }> {
  const channels = [whatsappConfigured() && "whatsapp", emailConfigured() && "email"].filter(Boolean) as string[];
  if (!channels.length) return { sent: 0, failed: 0, skipped: true };
  let sent = 0;
  let failed = 0;
  let waitedMs = 0;
  let marketingLeft = 0;
  let emailLeft = 0;
  /** Promotions sent in the last 24 hours, and when the oldest of each falls out of that window. */
  const refreshCaps = async () => {
    const { rows } = await pool.query<{ wa: number; email: number; wa_free: Date | null; email_free: Date | null }>(
      `select count(*) filter (where channel = 'whatsapp' and kind = any($1))::int as wa, count(*) filter (where channel = 'email' and kind like 'nurture-%')::int as email,
              min(sent_at) filter (where channel = 'whatsapp' and kind = any($1)) + interval '24 hours' as wa_free,
              min(sent_at) filter (where channel = 'email' and kind like 'nurture-%') + interval '24 hours' as email_free
         from public.message_outbox where status = 'sent' and sent_at > now() - interval '24 hours'`,
      [MARKETING_KINDS],
    );
    marketingLeft = Math.max(0, marketingDailyCap() - (rows[0]?.wa ?? 0));
    emailLeft = Math.max(0, emailMarketingDailyCap() - (rows[0]?.email ?? 0));
    return { waFree: rows[0]?.wa_free ?? null, emailFree: rows[0]?.email_free ?? null };
  };
  /**
   * The daily run fires at the same time every day, so yesterday's batch is often still inside the
   * 24-hour window for a few minutes. With `waitForCap`, a full cap that frees up before the
   * deadline is waited out (then the batch goes), instead of skipping the whole day. Meta's limit is
   * per rolling 24 hours, so this never sends more than the cap in any 24 hours.
   */
  const waitForRoom = async (): Promise<boolean> => {
    if (!opts.waitForCap) return false;
    const { waFree, emailFree } = await refreshCaps();
    const pending = await pool.query<{ wa: boolean | null; email: boolean | null }>(
      `select bool_or(channel = 'whatsapp' and kind = any($1)) as wa, bool_or(channel = 'email' and kind like 'nurture-%') as email
         from public.message_outbox where status = 'pending' and attempts < 3 and channel = any($2)`,
      [MARKETING_KINDS, channels],
    );
    const waWaiting = !!pending.rows[0]?.wa;
    const emailWaiting = !!pending.rows[0]?.email;
    // Room opened up (time passed) for something that is waiting: go and send it.
    if ((waWaiting && marketingLeft > 0) || (emailWaiting && emailLeft > 0)) return true;
    // Otherwise wait for the first blocked cap that frees up before the deadline.
    const frees = [waWaiting && marketingLeft <= 0 ? waFree : null, emailWaiting && emailLeft <= 0 ? emailFree : null].filter((d): d is Date => !!d).map((d) => d.getTime());
    const next = frees.length ? Math.min(...frees) : Infinity;
    if (next + 1000 >= deadline) return false;
    const ms = Math.max(0, next - Date.now()) + 500;
    await new Promise((r) => setTimeout(r, ms));
    waitedMs += ms;
    await refreshCaps();
    return true;
  };
  await refreshCaps();
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
        // Only promotions are left and their cap is full: wait if it frees up in time.
        if ((marketingLeft <= 0 || emailLeft <= 0) && (await waitForRoom())) continue;
        break;
      }
      // Promotions never go to a number that tapped "Stop promotions".
      if (m.channel === "whatsapp" && isMarketingKind(m.kind)) {
        const { rows: stop } = await client.query<{ why: string }>(
          `select 'Opted out of promotions' as why from public.whatsapp_optouts where phone = $1
           union all select 'WhatsApp says this number can''t receive messages' from public.whatsapp_unreachable where phone = $1 limit 1`,
          [m.to_address],
        );
        if (stop[0]) {
          await client.query(`update public.message_outbox set status = 'cancelled', last_error = $2 where id = $1`, [m.id, stop[0].why]);
          await client.query("commit");
          continue;
        }
      }
      const r = await sendOne(m).catch((err: Error): SendResult => ({ ok: false, error: err.message.slice(0, 300), retry: true }));
      if (r.ok) {
        // The provider's message id matches later delivery, read and click reports to this row.
        await client.query(`update public.message_outbox set status = 'sent', sent_at = now(), sent_by = $2, attempts = attempts + 1, last_error = null, provider_id = $3 where id = $1`, [
          m.id,
          m.channel === "whatsapp" ? "whatsapp-api" : "email-api",
          r.id.slice(0, 200) || null,
        ]);
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
  return { sent, failed, skipped: false, marketingHeld: marketingLeft <= 0 || emailLeft <= 0, ...(waitedMs ? { waitedMs } : {}) };
}
