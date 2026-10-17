import "server-only";
import { pool } from "@/health/db";
import { getContent } from "@/lib/content/store";
import { applyOffer } from "@/lib/offers";
import { SITE_URL } from "@/lib/site";
import { todayIST } from "@/lib/growth/dates";
import { insertLead } from "@/lib/growth/leads";
import { dailyPost, type PostBiz } from "@/lib/growth/daily-posts";
import { storyItem } from "@/lib/growth/sales-catalog";
import { buildReply, detectIntent, forInstagram, shouldReply, type Intent, type ReplyCtx } from "./auto-reply";
import { indianMobile, type Inbound } from "./inbound";
import { addDays } from "@/lib/growth/dates";
import { mediaStorageConfigured, putPublicMedia, removePublicMedia } from "./media-storage";
import {
  autoReplyOn,
  facebookConfigured,
  instagramConfigured,
  publishFacebookPhoto,
  publishFacebookReel,
  publishInstagramPhoto,
  publishInstagramReel,
  publishInstagramStory,
  refreshInstagramToken,
  sendFacebookMessage,
  sendInstagramMessage,
  sendWhatsAppDocument,
  sendWhatsAppText,
  whatsappReplyConfigured,
} from "./meta";
import { renderReel } from "./reel";
import { recordReply } from "./chat";
import { chatAlertEmail } from "./chat-window";
import { dispatch, enqueue } from "@/lib/growth/outbox";

async function replyCtx(name: string, text: string): Promise<ReplyCtx> {
  const c = await getContent();
  return { business: c.business, plans: applyOffer(c.plans, todayIST()), siteUrl: SITE_URL, name, text };
}

/** The plan preview sent with a diet reply on WhatsApp (public/samples). */
export const DIET_SAMPLE_URL = `${SITE_URL}/samples/royal-fitness-diet-plan-sample.pdf`;

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
    `insert into public.social_inbox (id, channel, kind, from_id, from_name, body, intent, media_type, media_id) values ($1, $2, $3, $4, $5, $6, $7, $8, $9) on conflict (id) do nothing`,
    [m.id, m.channel, m.kind, m.from, m.fromName, m.text, intent, m.media?.type ?? null, m.media?.id ?? null],
  );
  if (!ins.rowCount) return "duplicate";

  // The coach has no phone app on an API number: email them so a customer is never left waiting.
  const coach = process.env.COACH_EMAIL;
  if (coach && m.channel === "whatsapp" && m.kind === "message") {
    await enqueue([chatAlertEmail({ peer: m.from, name: m.fromName, text: m.text }, coach, `${SITE_URL}/admin/chats`)])
      .then((n) => (n ? dispatch(3) : null))
      .catch((err: Error) => console.error("[social] chat alert:", err.message));
  }

  const leadId = m.channel === "whatsapp" ? await ensureLead(m, intent).catch((err) => (console.error("[social] lead:", (err as Error).message), null)) : null;
  if (leadId) await pool.query(`update public.social_inbox set lead_id = $2 where id = $1`, [m.id, leadId]);

  const { rows } = await pool.query<{ n: number }>(
    `select count(*)::int as n from public.social_inbox where channel = $1 and from_id = $2 and kind = 'message' and id <> $3 and created_at > now() - interval '12 hours'`,
    [m.channel, m.from, m.id],
  );
  const canSend = m.channel === "whatsapp" ? whatsappReplyConfigured() : m.channel === "facebook" ? facebookConfigured() : instagramConfigured();
  if (!autoReplyOn() || !canSend || !shouldReply(intent, m.kind, rows[0].n > 0)) return "logged";

  const text = buildReply(intent, await replyCtx(m.fromName, m.text));
  const res =
    m.channel === "whatsapp"
      ? await sendWhatsAppText(m.from, text)
      : m.channel === "facebook"
        ? await sendFacebookMessage(m.kind === "comment" ? { comment_id: m.id.replace(/^fbc:/, "") } : { id: m.from }, forInstagram(text))
        : await sendInstagramMessage(m.kind === "comment" ? { comment_id: m.id.replace(/^igc:/, "") } : { id: m.from }, forInstagram(text));
  await pool.query(`update public.social_inbox set replied = $2, reply_error = $3 where id = $1`, [m.id, res.ok, res.ok ? null : res.error.slice(0, 300)]);
  // WhatsApp replies show up in the admin chat next to the customer's messages.
  if (m.channel === "whatsapp") await recordReply({ to: m.from, body: text, by: "auto-reply", ok: res.ok, error: res.ok ? null : res.error, externalId: res.ok ? res.id : null });
  // A diet enquiry on WhatsApp also gets the plan preview, so they see what they'd receive.
  if (res.ok && intent === "diet" && m.channel === "whatsapp") {
    const caption = "📄 A real sample plan (made for an example client). Yours is built on your own body, food and goal.";
    const doc = await sendWhatsAppDocument(m.from, DIET_SAMPLE_URL, "Royal Fitness Club - sample diet plan.pdf", caption);
    if (!doc.ok) console.error("[social] diet sample PDF:", doc.error);
    await recordReply({ to: m.from, body: `📄 Sample diet plan PDF\n${caption}`, kind: "document", by: "auto-reply", ok: doc.ok, error: doc.ok ? null : doc.error, externalId: doc.ok ? doc.id : null });
  }
  return res.ok ? "replied" : "failed";
}

export const postImageUrl = (date: string) => `${SITE_URL}/api/social/post-image/${date}.jpg`;
export const storyImageUrl = (date: string) => `${SITE_URL}/api/social/story-image/${date}.jpg`;

/** Claims today's post for a channel (or a failed one to retry); null when it's already done. */
async function claimPost(channel: "instagram" | "facebook" | "instagram-story", date: string, theme: string): Promise<string | null> {
  const { rows } = await pool.query<{ id: string }>(
    `insert into public.social_posts (channel, post_date, theme) values ($1, $2, $3)
     on conflict (channel, post_date) do update set status = 'pending', error = null, created_at = now()
       where public.social_posts.status = 'failed'
          -- A run that died half way (a timeout) leaves 'pending' behind: take it over after 20 minutes.
          or (public.social_posts.status = 'pending' and public.social_posts.created_at < now() - interval '20 minutes')
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

/** The day's sales Story on Instagram (one product from the catalogue), once a day. */
export async function runInstagramStory(now = new Date()): Promise<{ story: string; token?: string }> {
  if (!instagramConfigured()) return { story: "off" };
  // The morning run keeps the long-lived Instagram token fresh (it refreshes at most weekly).
  const token = await refreshInstagramToken(now).catch(() => "failed" as const);
  const today = todayIST(now);
  const id = await claimPost("instagram-story", today, storyItem(today).title);
  if (!id) return { story: "already-posted", token };
  const res = await publishInstagramStory(storyImageUrl(today));
  await recordPost(id, res);
  if (!res.ok) console.error("[instagram] story failed:", res.error);
  return { story: res.ok ? "published" : `failed: ${res.error}`, token };
}

type ReelDeps = { render: (date: string, biz: PostBiz) => Promise<Buffer>; upload: (path: string, data: Buffer, type: string) => Promise<string>; remove: (path: string) => Promise<void> };
const REEL_DEPS: ReelDeps = { render: renderReel, upload: putPublicMedia, remove: removePublicMedia };

/**
 * The evening run (peak time): the day's post as a Reel on Instagram and the Facebook Page. The
 * video is rendered and uploaded once; if a Reel can't be published on a channel, the day's photo
 * post goes there instead, so the feed never misses a day. Safe to run again: a channel that is
 * already done is skipped, a failed one is retried.
 */
export async function runReels(now = new Date(), biz: PostBiz, deps: ReelDeps = REEL_DEPS): Promise<{ reel: string; instagram: string; facebook: string }> {
  const ig = instagramConfigured();
  const fb = facebookConfigured();
  if (!ig && !fb) return { reel: "off", instagram: "off", facebook: "off" };
  const today = todayIST(now);
  const post = dailyPost(today, biz);
  const igId = ig ? await claimPost("instagram", today, post.theme) : null;
  const fbId = fb ? await claimPost("facebook", today, post.theme) : null;
  if (!igId && !fbId) return { reel: "already-posted", instagram: ig ? "already-posted" : "off", facebook: fb ? "already-posted" : "off" };

  let videoUrl: string | null = null;
  let reel = "rendered";
  if (!mediaStorageConfigured() && deps === REEL_DEPS) reel = "skipped: Supabase Storage is not configured";
  else {
    try {
      videoUrl = await deps.upload(`reels/${today}.mp4`, await deps.render(today, biz), "video/mp4");
      // Keep storage small: last month's Reel is no longer needed once Instagram has its copy.
      await deps.remove(`reels/${addDays(today, -30)}.mp4`).catch(() => {});
    } catch (err) {
      reel = `failed: ${(err as Error).message.slice(0, 200)}`;
      console.error("[reel] render/upload failed:", (err as Error).message);
    }
  }

  const publish = async (
    id: string | null,
    on: boolean,
    asReel: (url: string) => ReturnType<typeof publishInstagramReel>,
    asPhoto: () => ReturnType<typeof publishInstagramPhoto>,
    label: string,
  ): Promise<string> => {
    if (!on) return "off";
    if (!id) return "already-posted";
    const r = videoUrl ? await asReel(videoUrl) : null;
    if (r?.ok) {
      await recordPost(id, r);
      return "reel";
    }
    if (r && !r.ok) console.error(`[${label}] reel failed, posting the photo instead:`, r.error);
    const p = await asPhoto();
    await recordPost(id, p.ok ? p : { ok: false, error: r && !r.ok ? `Reel: ${r.error} · Photo: ${p.error}` : p.error });
    if (!p.ok) return `failed: ${p.error}`;
    return r && !r.ok ? `photo (reel failed: ${r.error.slice(0, 120)})` : "photo";
  };

  const [instagram, facebook] = await Promise.all([
    publish(igId, ig, (u) => publishInstagramReel(u, post.instagram), () => publishInstagramPhoto(postImageUrl(today), post.instagram), "instagram"),
    publish(fbId, fb, (u) => publishFacebookReel(u, post.facebook), () => publishFacebookPhoto(postImageUrl(today), post.facebook), "facebook"),
  ]);
  return { reel, instagram, facebook };
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
