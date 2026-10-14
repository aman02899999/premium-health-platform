import "server-only";
import { pool } from "@/health/db";
import { getContent } from "@/lib/content/store";
import { applyOffer } from "@/lib/offers";
import { SITE_URL } from "@/lib/site";
import { todayIST } from "@/lib/growth/dates";
import { insertLead } from "@/lib/growth/leads";
import { dailyPost, type PostBiz } from "@/lib/growth/daily-posts";
import { buildReply, detectIntent, forInstagram, shouldReply, type Intent, type ReplyCtx } from "./auto-reply";
import { indianMobile, type Inbound } from "./inbound";
import { autoReplyOn, facebookConfigured, instagramConfigured, publishFacebookPhoto, publishInstagramPhoto, refreshInstagramToken, sendFacebookMessage, sendInstagramMessage, sendWhatsAppText, whatsappReplyConfigured } from "./meta";

async function replyCtx(name: string): Promise<ReplyCtx> {
  const c = await getContent();
  return { business: c.business, plans: applyOffer(c.plans, todayIST()), siteUrl: SITE_URL, name };
}

const LEAD_INTEREST: Partial<Record<Intent, "diet" | "membership">> = { diet: "diet", price: "membership", trial: "membership", visit: "membership" };

/** A WhatsApp sender becomes a lead once a month, unless they are already a member. */
async function ensureLead(m: Inbound, intent: Intent): Promise<string | null> {
  const phone = indianMobile(m.from);
  if (!phone) return null;
  const { rows } = await pool.query<{ id: string }>(
    `select id from public.leads where right(regexp_replace(phone, '\\D', '', 'g'), 10) = $1 and created_at > now() - interval '30 days'
     union all select null from public.members where phone = $1 limit 1`,
    [phone],
  );
  if (rows.length) return rows[0].id;
  return insertLead({
    name: m.fromName.length >= 2 ? m.fromName : "WhatsApp enquiry",
    phone,
    email: null,
    interest: LEAD_INTEREST[intent] ?? "",
    goal: "",
    message: m.text.slice(0, 600),
    source: "whatsapp-inbound",
    marketing: false,
  });
}

/** Records one inbound message or comment and answers it if the rules say so. Duplicates are ignored. */
export async function handleInbound(m: Inbound): Promise<"duplicate" | "replied" | "logged" | "failed"> {
  const intent = detectIntent(m.text);
  const ins = await pool.query(
    `insert into public.social_inbox (id, channel, kind, from_id, from_name, body, intent) values ($1, $2, $3, $4, $5, $6, $7) on conflict (id) do nothing`,
    [m.id, m.channel, m.kind, m.from, m.fromName, m.text, intent],
  );
  if (!ins.rowCount) return "duplicate";

  const leadId = m.channel === "whatsapp" ? await ensureLead(m, intent).catch((err) => (console.error("[social] lead:", (err as Error).message), null)) : null;
  if (leadId) await pool.query(`update public.social_inbox set lead_id = $2 where id = $1`, [m.id, leadId]);

  const { rows } = await pool.query<{ n: number }>(
    `select count(*)::int as n from public.social_inbox where channel = $1 and from_id = $2 and kind = 'message' and id <> $3 and created_at > now() - interval '12 hours'`,
    [m.channel, m.from, m.id],
  );
  const canSend = m.channel === "whatsapp" ? whatsappReplyConfigured() : m.channel === "facebook" ? facebookConfigured() : instagramConfigured();
  if (!autoReplyOn() || !canSend || !shouldReply(intent, m.kind, rows[0].n > 0)) return "logged";

  const text = buildReply(intent, await replyCtx(m.fromName));
  const res =
    m.channel === "whatsapp"
      ? await sendWhatsAppText(m.from, text)
      : m.channel === "facebook"
        ? await sendFacebookMessage(m.kind === "comment" ? { comment_id: m.id.replace(/^fbc:/, "") } : { id: m.from }, forInstagram(text))
        : await sendInstagramMessage(m.kind === "comment" ? { comment_id: m.id.replace(/^igc:/, "") } : { id: m.from }, forInstagram(text));
  await pool.query(`update public.social_inbox set replied = $2, reply_error = $3 where id = $1`, [m.id, res.ok, res.ok ? null : res.error.slice(0, 300)]);
  return res.ok ? "replied" : "failed";
}

export const postImageUrl = (date: string) => `${SITE_URL}/api/social/post-image/${date}.jpg`;

/**
 * Publishes the day's post to Instagram once. Re-running the same day is a no-op once it has
 * published; a failed day is retried on the next run.
 */
/** Claims today's post for a channel (or a failed one to retry); null when it's already done. */
async function claimPost(channel: "instagram" | "facebook", date: string, theme: string): Promise<string | null> {
  const { rows } = await pool.query<{ id: string }>(
    `insert into public.social_posts (channel, post_date, theme) values ($1, $2, $3)
     on conflict (channel, post_date) do update set status = 'pending', error = null
       where public.social_posts.status = 'failed'
     returning id`,
    [channel, date, theme.slice(0, 80)],
  );
  return rows[0]?.id ?? null;
}

async function recordPost(id: string, res: { ok: true; id: string; permalink?: string } | { ok: false; error: string }) {
  await pool.query(`update public.social_posts set status = $2, external_id = $3, permalink = $4, error = $5 where id = $1`, [
    id,
    res.ok ? "published" : "failed",
    res.ok ? res.id : null,
    res.ok ? (res.permalink ?? null) : null,
    res.ok ? null : res.error.slice(0, 300),
  ]);
}

/**
 * Publishes the day's post to Instagram once. Re-running the same day is a no-op once it has
 * published; a failed day is retried on the next run.
 */
export async function runInstagram(now = new Date(), biz: PostBiz): Promise<{ instagram: string; token?: string }> {
  if (!instagramConfigured()) return { instagram: "off" };
  const token = await refreshInstagramToken(now).catch(() => "failed" as const);
  const today = todayIST(now);
  const post = dailyPost(today, biz);
  const id = await claimPost("instagram", today, post.theme);
  if (!id) return { instagram: "already-posted", token };
  const res = await publishInstagramPhoto(postImageUrl(today), post.instagram);
  await recordPost(id, res);
  if (!res.ok) console.error("[instagram] publish failed:", res.error);
  return { instagram: res.ok ? "published" : `failed: ${res.error}`, token };
}

/** The same post on the Facebook Page, with a clickable link. */
export async function runFacebook(now = new Date(), biz: PostBiz): Promise<{ facebook: string }> {
  if (!facebookConfigured()) return { facebook: "off" };
  const today = todayIST(now);
  const post = dailyPost(today, biz);
  const id = await claimPost("facebook", today, post.theme);
  if (!id) return { facebook: "already-posted" };
  const res = await publishFacebookPhoto(postImageUrl(today), post.facebook);
  await recordPost(id, res);
  if (!res.ok) console.error("[facebook] publish failed:", res.error);
  return { facebook: res.ok ? "published" : `failed: ${res.error}` };
}

export type SocialStatus = {
  instagram: boolean;
  facebook: boolean;
  whatsapp: boolean;
  webhook: boolean;
  autoReply: boolean;
  posts: { date: string; channel: string; theme: string; status: string; permalink: string | null; error: string | null }[];
  inbox: { id: string; createdAt: string; channel: string; kind: string; from: string; name: string; body: string; intent: string; replied: boolean; error: string | null }[];
};

/** What the admin sees: what is switched on, recent posts and the latest messages. */
export async function socialStatus(): Promise<SocialStatus> {
  const [posts, inbox] = await Promise.all([
    pool.query<{ post_date: string; channel: string; theme: string; status: string; permalink: string | null; error: string | null }>(
      `select post_date::text as post_date, channel, theme, status, permalink, error from public.social_posts order by post_date desc, channel limit 28`,
    ),
    pool.query<{ id: string; created_at: Date; channel: string; kind: string; from_id: string; from_name: string; body: string; intent: string; replied: boolean; reply_error: string | null }>(
      `select id, created_at, channel, kind, from_id, from_name, body, intent, replied, reply_error from public.social_inbox order by created_at desc limit 50`,
    ),
  ]);
  return {
    instagram: instagramConfigured(),
    facebook: facebookConfigured(),
    whatsapp: whatsappReplyConfigured(),
    webhook: Boolean(process.env.META_VERIFY_TOKEN && (process.env.META_APP_SECRET || process.env.INSTAGRAM_APP_SECRET)),
    autoReply: autoReplyOn(),
    posts: posts.rows.map((r) => ({ date: r.post_date, channel: r.channel, theme: r.theme, status: r.status, permalink: r.permalink, error: r.error })),
    inbox: inbox.rows.map((r) => ({ id: r.id, createdAt: r.created_at.toISOString(), channel: r.channel, kind: r.kind, from: r.from_id, name: r.from_name, body: r.body, intent: r.intent, replied: r.replied, error: r.reply_error })),
  };
}
