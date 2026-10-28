import "server-only";
import { pool } from "@/health/db";
import { getContent } from "@/lib/content/store";
import { applyOffer } from "@/lib/offers";
import { SITE_URL } from "@/lib/site";
import { todayIST } from "@/lib/growth/dates";
import { insertLead } from "@/lib/growth/leads";
import { dailyPost, type DailyPost, type PostBiz } from "@/lib/growth/daily-posts";
import { storyItem } from "@/lib/growth/sales-catalog";
import { cardPost, monthDay, reelPhoto, secondReelPost, type FeedSlot } from "@/lib/growth/month-plan";
import { daysBetween } from "@/lib/growth/dates";
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
  sendWhatsAppInteractive,
  sendWhatsAppText,
  whatsappReplyConfigured,
} from "./meta";
import { renderReel, renderReelPost } from "./reel";
import { TRIAL_OFFER_MARK, flowAction, flowReply, logText, toInteractive, type FlowAction } from "./wa-flow";
import { chatThread, recordReply } from "./chat";
import { chatAlertEmail } from "./chat-window";
import { dispatch, enqueue } from "@/lib/growth/outbox";
import { promotionsRequest } from "@/lib/growth/messages";
import { setPromotionsOptOut } from "@/lib/growth/optouts";
import { qrLeadSource } from "@/lib/admin/qr";
import { refFromText } from "@/lib/admin/qr-core";
import { adLeadSource } from "@/lib/admin/ads";
import { adRefFromText } from "@/lib/admin/ads-core";
import { COACH_PAUSE_HOURS, botPaused, pauseBot } from "./chat-tools";
import { aiConfigured, answersToday, draftAnswer, getAgentSettings, logRun } from "@/lib/ai/agent";
import { worthAnswering } from "@/lib/ai/agent-core";

async function replyCtx(name: string, text: string): Promise<ReplyCtx> {
  const c = await getContent();
  return { business: c.business, plans: applyOffer(c.plans, todayIST(), c.offers), siteUrl: SITE_URL, name, text };
}

/** The plan preview sent with a diet reply on WhatsApp (public/samples). */
export const DIET_SAMPLE_URL = `${SITE_URL}/samples/royal-fitness-diet-plan-sample.pdf`;

const LEAD_INTEREST: Partial<Record<Intent, "diet" | "membership">> = { diet: "diet", price: "membership", trial: "membership", visit: "membership" };

/** A WhatsApp sender becomes a lead once a month, unless they are already a member. */
async function ensureLead(m: Inbound, intent: Intent, afterOffer = false): Promise<string | null> {
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
    interest: LEAD_INTEREST[intent] ?? (afterOffer ? "membership" : ""),
    goal: "",
    message: m.text.slice(0, 600),
    // A chat opened from a Click-to-WhatsApp ad ends "(ad <slug>)", one from a printed QR "(ref <code>)".
    source: afterOffer ? "whatsapp-campaign" : ((await adLeadSource(adRefFromText(m.text))) ?? (await qrLeadSource(refFromText(m.text))) ?? "whatsapp-inbound"),
    marketing: false,
  });
}

/** Records one inbound message or comment and answers it if the rules say so. Duplicates are ignored. */
export async function handleInbound(m: Inbound): Promise<"duplicate" | "replied" | "logged" | "failed"> {
  const res = await recordAndAnswer(m);
  // An Instagram or Facebook DM the bot didn't answer needs a person, and they don't show in the
  // admin Chats (WhatsApp only): email the coach, who answers in the app. Comments stay in the bell.
  if ((res === "logged" || res === "failed") && m.channel !== "whatsapp" && m.kind === "message") {
    const coach = process.env.COACH_EMAIL;
    if (coach)
      await enqueue([chatAlertEmail({ peer: m.from, name: m.fromName, text: m.text, channel: m.channel }, coach, `${SITE_URL}/admin/chats`)])
        .then((n) => (n ? dispatch(3) : null))
        .catch((err: Error) => console.error("[social] DM alert:", err.message));
  }
  return res;
}

async function recordAndAnswer(m: Inbound): Promise<"duplicate" | "replied" | "logged" | "failed"> {
  const intent = detectIntent(m.text);
  const ins = await pool.query(
    `insert into public.social_inbox (id, channel, kind, from_id, from_name, body, intent, media_type, media_id) values ($1, $2, $3, $4, $5, $6, $7, $8, $9) on conflict (id) do nothing`,
    [m.id, m.channel, m.kind, m.from, m.fromName, m.text, intent, m.media?.type ?? null, m.media?.id ?? null],
  );
  if (!ins.rowCount) return "duplicate";

  // "Stop promotions" (the button on Marketing templates) or "Start promotions": record it and confirm.
  const promo = m.channel === "whatsapp" && m.kind === "message" ? promotionsRequest(m.text) : null;
  if (promo) {
    await setPromotionsOptOut(m.from, promo === "stop", m.fromName);
    if (!whatsappReplyConfigured()) return "logged";
    const text =
      promo === "stop"
        ? "Done: you won't get promotional messages from us any more. Messages about your own membership, trial or order still come through. Reply START PROMOTIONS to turn offers back on."
        : "Done: you'll get our offers and updates again. Reply STOP PROMOTIONS any time to stop them.";
    const res = await sendWhatsAppText(m.from, text);
    await pool.query(`update public.social_inbox set replied = $2, reply_error = $3 where id = $1`, [m.id, res.ok, res.ok ? null : res.error.slice(0, 300)]);
    await recordReply({ to: m.from, body: text, by: "auto-reply", ok: res.ok, error: res.ok ? null : res.error, externalId: res.ok ? res.id : null });
    return res.ok ? "replied" : "failed";
  }

  // The coach has no phone app on an API number: email them so a customer is never left waiting.
  const coach = process.env.COACH_EMAIL;
  if (coach && m.channel === "whatsapp" && m.kind === "message") {
    await enqueue([chatAlertEmail({ peer: m.from, name: m.fromName, text: m.text }, coach, `${SITE_URL}/admin/chats`)])
      .then((n) => (n ? dispatch(3) : null))
      .catch((err: Error) => console.error("[social] chat alert:", err.message));
  }

  // A reply to a campaign offer (the offer was the last thing we sent them) is about membership.
  const afterOffer = m.channel === "whatsapp" && m.kind === "message" && (await repliedToOffer(m.from));
  // WhatsApp runs the button conversation (wa-flow.ts): a tapped button, or "yes" to the trial
  // offer, always gets its next step; typed messages follow the usual reply rules.
  const flow = m.channel === "whatsapp" ? flowAction({ replyId: m.replyId, text: m.text }, await offeredTrial(m.from), afterOffer) : null;
  // "No thanks" to an offer: logged for the coach (already emailed above), not a lead, no reply.
  if (m.channel === "whatsapp" && !flow) return "logged";

  const leadId = m.channel === "whatsapp" ? await ensureLead(m, intent, afterOffer).catch((err) => (console.error("[social] lead:", (err as Error).message), null)) : null;
  if (leadId) await pool.query(`update public.social_inbox set lead_id = $2 where id = $1`, [m.id, leadId]);

  const { rows } = await pool.query<{ n: number }>(
    // Only messages that came before this one: when Meta delivers a burst at once, the first still gets its reply.
    `select count(*)::int as n from public.social_inbox p, public.social_inbox me
      where me.id = $3 and p.channel = $1 and p.from_id = $2 and p.kind = 'message' and p.id <> $3
        and p.created_at > me.created_at - interval '12 hours' and p.created_at < me.created_at`,
    [m.channel, m.from, m.id],
  );
  const canSend = m.channel === "whatsapp" ? whatsappReplyConfigured() : m.channel === "facebook" ? facebookConfigured() : instagramConfigured();
  // A typed question the keyword bot has no answer for (it would send the menu, or nothing mid-chat):
  // the AI agent answers it when it's switched on. If it can't, the usual rules below apply.
  if (flow && !flow.tapped && flow.action === "menu" && intent === "other" && !m.media && worthAnswering(m.text) && autoReplyOn() && canSend) {
    const ai = await aiReply(m).catch((err: Error) => (console.error("[ai-agent] reply:", err.message), "skipped" as const));
    if (ai !== "skipped") return ai;
  }
  if (!autoReplyOn() || !canSend || (!flow?.tapped && !shouldReply(intent, m.kind, rows[0].n > 0))) return "logged";
  // The coach paused the bot for this customer (or is chatting with them right now).
  if (flow && (await botPaused(m.from))) return "logged";
  if (flow) return replyOnWhatsApp(m, flow.action);

  // Instagram and Facebook: one text reply.
  const text = forInstagram(buildReply(intent, await replyCtx(m.fromName, m.text)));
  const res =
    m.channel === "facebook"
      ? await sendFacebookMessage(m.kind === "comment" ? { comment_id: m.id.replace(/^fbc:/, "") } : { id: m.from }, text)
      : await sendInstagramMessage(m.kind === "comment" ? { comment_id: m.id.replace(/^igc:/, "") } : { id: m.from }, text);
  await pool.query(`update public.social_inbox set replied = $2, reply_error = $3 where id = $1`, [m.id, res.ok, res.ok ? null : res.error.slice(0, 300)]);
  return res.ok ? "replied" : "failed";
}

/**
 * The AI agent's answer to one WhatsApp question. "skipped" when it is off, over today's cap or
 * couldn't answer, so the caller falls back to the keyword rules. A hand-off pauses the bot for
 * this customer so a coach can take over (the coach is already emailed about every message).
 */
async function aiReply(m: Inbound): Promise<"replied" | "failed" | "logged" | "skipped"> {
  if (!aiConfigured()) return "skipped";
  const settings = await getAgentSettings();
  if (settings.mode !== "auto") return "skipped";
  if (await botPaused(m.from)) return "logged";
  if ((await answersToday()) >= settings.dailyCap) return "skipped";
  const thread = await chatThread(m.from, 40);
  const history = thread.messages.filter((x) => x.id !== `in:${m.id}`).map((x) => ({ fromThem: x.fromThem, body: x.body, by: x.by }));
  const r = await draftAnswer({ question: m.text, history, name: m.fromName, settings });
  if (!r.ok) {
    await logRun({ source: "auto", peer: m.from, inboxId: m.id, question: m.text, result: r });
    return "skipped";
  }
  const res = await sendWhatsAppText(m.from, r.answer.reply);
  await recordReply({ to: m.from, body: r.answer.reply, by: "ai-agent", ok: res.ok, error: res.ok ? null : res.error, externalId: res.ok ? res.id : null });
  await pool.query(`update public.social_inbox set replied = $2, reply_error = $3 where id = $1`, [m.id, res.ok, res.ok ? null : res.error.slice(0, 300)]);
  await logRun({ source: "auto", peer: m.from, inboxId: m.id, question: m.text, result: r, sent: res.ok });
  if (res.ok && r.answer.handoff) await pauseBot(m.from, new Date(Date.now() + COACH_PAUSE_HOURS * 3_600_000), false);
  return res.ok ? "replied" : "failed";
}

/**
 * True when a campaign offer reached this number in the last 14 days and nothing has been sent to
 * them since, so their message is an answer to the offer.
 */
async function repliedToOffer(peer: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `select 1 from public.message_outbox o
      where o.channel = 'whatsapp' and o.kind = 'offer-broadcast' and o.status = 'sent'
        and right(o.to_address, 10) = right($1, 10) and o.sent_at > now() - interval '14 days'
        and not exists (select 1 from public.chat_replies r where r.channel = 'whatsapp' and r.to_id = $1 and r.created_at > o.sent_at)
      limit 1`,
    [peer],
  );
  return Boolean(rowCount);
}

/** True when our auto-reply offered the 7-Day Trial in the last 24 hours, so "yes" means "start it". */
async function offeredTrial(peer: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `select 1 from public.chat_replies where to_id = $1 and sent_by = 'auto-reply' and created_at > now() - interval '24 hours' and position($2 in body) > 0 limit 1`,
    [peer, TRIAL_OFFER_MARK],
  );
  return Boolean(rowCount);
}

/** Sends one step of the WhatsApp conversation; a button message that fails goes again as plain text. */
async function replyOnWhatsApp(m: Inbound, action: FlowAction): Promise<"replied" | "failed"> {
  const steps = flowReply(action, await replyCtx(m.fromName, m.text));
  let first: { ok: boolean; error?: string } | null = null;
  for (const step of steps) {
    const interactive = toInteractive(step);
    let res = interactive ? await sendWhatsAppInteractive(m.from, interactive) : await sendWhatsAppText(m.from, step.body);
    if (!res.ok && interactive) {
      console.error("[social] interactive reply failed, sending text:", res.error);
      res = await sendWhatsAppText(m.from, logText(step));
    }
    first ??= res.ok ? { ok: true } : { ok: false, error: res.error };
    await recordReply({ to: m.from, body: logText(step), by: "auto-reply", ok: res.ok, error: res.ok ? null : res.error, externalId: res.ok ? res.id : null });
  }
  await pool.query(`update public.social_inbox set replied = $2, reply_error = $3 where id = $1`, [m.id, first?.ok ?? false, first?.ok ? null : (first?.error ?? "").slice(0, 300)]);
  // A refund, cancellation or complaint: the bot steps back so a coach can take over.
  if (first?.ok && action === "support") await pauseBot(m.from, new Date(Date.now() + COACH_PAUSE_HOURS * 3_600_000), false);
  // A diet enquiry also gets the plan preview, so they see what they'd receive.
  if (first?.ok && action === "diet") {
    const caption = "📄 A real sample plan (made for an example client). Yours is built on your own body, food and goal.";
    const doc = await sendWhatsAppDocument(m.from, DIET_SAMPLE_URL, "Royal Fitness Club - sample diet plan.pdf", caption);
    if (!doc.ok) console.error("[social] diet sample PDF:", doc.error);
    await recordReply({ to: m.from, body: `📄 Sample diet plan PDF\n${caption}`, kind: "document", by: "auto-reply", ok: doc.ok, error: doc.ok ? null : doc.error, externalId: doc.ok ? doc.id : null });
  }
  return first?.ok ? "replied" : "failed";
}

export const postImageUrl = (date: string) => `${SITE_URL}/api/social/post-image/${date}.jpg`;
export const storyImageUrl = (date: string) => `${SITE_URL}/api/social/story-image/${date}.jpg`;

/** Claims today's post for a channel (or a failed one to retry); null when it's already done. */
type PostChannel = "instagram" | "facebook" | "instagram-story" | `${"instagram" | "facebook"}-${FeedSlot | "reel2"}`;
async function claimPost(channel: PostChannel, date: string, theme: string): Promise<string | null> {
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

/** The month plan's extra posts can be switched off without a deploy: SOCIAL_MONTH_PLAN=off. */
export const monthPlanOn = () => process.env.SOCIAL_MONTH_PLAN !== "off";
export const cardImageUrl = (date: string, slot: FeedSlot) => `${SITE_URL}/api/social/card/${date}-${slot}.jpg`;

type ChannelResult = "off" | "already-posted" | "published" | `failed: ${string}`;

/**
 * One of the month plan's cheat-sheet posts (morning "am" or afternoon "pm") on Instagram and the
 * Facebook Page. Only inside the plan's dates. Safe to run again: done channels are skipped, failed
 * ones retried.
 */
export async function runMonthPost(slot: FeedSlot, now = new Date(), biz: PostBiz): Promise<{ instagram: ChannelResult | "not-scheduled"; facebook: ChannelResult | "not-scheduled" }> {
  const today = todayIST(now);
  if (!monthPlanOn() || monthDay(today) === null) return { instagram: "not-scheduled", facebook: "not-scheduled" };
  const post = cardPost(today, slot, biz, (await getContent()).offers ?? []);
  if (!post) return { instagram: "not-scheduled", facebook: "not-scheduled" };
  const image = cardImageUrl(today, slot);
  const one = async (on: boolean, channel: PostChannel, send: () => ReturnType<typeof publishInstagramPhoto>): Promise<ChannelResult> => {
    if (!on) return "off";
    const id = await claimPost(channel, today, post.theme);
    if (!id) return "already-posted";
    const res = await send();
    await recordPost(id, res);
    if (!res.ok) console.error(`[month-plan] ${channel} failed:`, res.error);
    return res.ok ? "published" : `failed: ${res.error.slice(0, 160)}`;
  };
  const [instagram, facebook] = await Promise.all([
    one(instagramConfigured(), `instagram-${slot}`, () => publishInstagramPhoto(image, post.instagram)),
    one(facebookConfigured(), `facebook-${slot}`, () => publishFacebookPhoto(image, post.facebook)),
  ]);
  return { instagram, facebook };
}

type SecondReelDeps = {
  render: (post: DailyPost, seed: number, photo: string | null, biz: PostBiz) => Promise<Buffer>;
  upload: ReelDeps["upload"];
  remove: ReelDeps["remove"];
};
const SECOND_REEL_DEPS: SecondReelDeps = { render: renderReelPost, upload: putPublicMedia, remove: removePublicMedia };

/**
 * The month plan's second Reel of the day (a different tip, the coach's photo on the opening and
 * closing screens, another music track). No photo fallback: a failed one is retried by the next run.
 */
export async function runSecondReel(now = new Date(), biz: PostBiz, deps: SecondReelDeps = SECOND_REEL_DEPS): Promise<{ reel: string; instagram: ChannelResult | "not-scheduled"; facebook: ChannelResult | "not-scheduled" }> {
  const today = todayIST(now);
  const post = monthPlanOn() ? secondReelPost(today, biz) : null;
  if (!post) return { reel: "not-scheduled", instagram: "not-scheduled", facebook: "not-scheduled" };
  const ig = instagramConfigured();
  const fb = facebookConfigured();
  const igId = ig ? await claimPost("instagram-reel2", today, post.theme) : null;
  const fbId = fb ? await claimPost("facebook-reel2", today, post.theme) : null;
  const skip = (on: boolean): ChannelResult => (on ? "already-posted" : "off");
  if (!igId && !fbId) return { reel: ig || fb ? "already-posted" : "off", instagram: skip(ig), facebook: skip(fb) };

  let videoUrl: string | null = null;
  let reel = "rendered";
  if (!mediaStorageConfigured() && deps === SECOND_REEL_DEPS) reel = "skipped: Supabase Storage is not configured";
  else {
    try {
      // A different seed from the evening Reel, so the two Reels of a day get different tracks.
      const seed = daysBetween("2026-01-01", today) + 1;
      videoUrl = await deps.upload(`reels/${today}-2.mp4`, await deps.render(post, seed, reelPhoto(today), biz), "video/mp4");
      await deps.remove(`reels/${addDays(today, -30)}-2.mp4`).catch(() => {});
    } catch (err) {
      reel = `failed: ${(err as Error).message.slice(0, 200)}`;
      console.error("[month-plan] reel render/upload failed:", (err as Error).message);
    }
  }
  const one = async (id: string | null, on: boolean, send: (url: string) => ReturnType<typeof publishInstagramReel>): Promise<ChannelResult> => {
    if (!on) return "off";
    if (!id) return "already-posted";
    const res: Awaited<ReturnType<typeof publishInstagramReel>> = videoUrl ? await send(videoUrl) : { ok: false, error: `No video (${reel})`, retry: true };
    await recordPost(id, res);
    return res.ok ? "published" : `failed: ${res.error.slice(0, 160)}`;
  };
  const [instagram, facebook] = await Promise.all([
    one(igId, ig, (u) => publishInstagramReel(u, post.instagram)),
    one(fbId, fb, (u) => publishFacebookReel(u, post.facebook)),
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
