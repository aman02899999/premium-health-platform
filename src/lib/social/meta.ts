import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { pool } from "@/health/db";
import type { SendResult } from "@/lib/growth/providers";

// Meta APIs: WhatsApp Cloud API (free-form replies inside the 24-hour window) and the Instagram
// API with Instagram Login (publishing, DMs, private replies to comments). Nothing runs until the
// keys are set in Vercel:
//
//   WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID   already used for the reminder templates
//   INSTAGRAM_ACCESS_TOKEN                     long-lived Instagram token (the site refreshes it)
//   META_APP_SECRET / INSTAGRAM_APP_SECRET     check that webhooks really come from Meta
//   META_VERIFY_TOKEN                          any phrase; the same one goes in the Meta webhook form
//   SOCIAL_AUTO_REPLY=off                      log messages but never answer automatically

export const instagramConfigured = () => Boolean(process.env.INSTAGRAM_ACCESS_TOKEN);
export const whatsappReplyConfigured = () => Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
export const autoReplyOn = () => process.env.SOCIAL_AUTO_REPLY !== "off";

// Overridable for local end-to-end tests against mock servers.
const WA_API = () => (process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v21.0").replace(/\/$/, "");
const IG_API = () => (process.env.INSTAGRAM_API_URL || "https://graph.instagram.com/v21.0").replace(/\/$/, "");
const IG_OAUTH = () => (process.env.INSTAGRAM_OAUTH_URL || "https://graph.instagram.com").replace(/\/$/, "");

/** X-Hub-Signature-256 is an HMAC of the raw body with the app secret. No secret set = refuse. */
export function verifyMetaSignature(raw: string, header: string | null): boolean {
  const secrets = [process.env.META_APP_SECRET, process.env.INSTAGRAM_APP_SECRET].filter((s): s is string => !!s);
  if (!header?.startsWith("sha256=") || !secrets.length) return false;
  const got = Buffer.from(header.slice(7), "hex");
  return secrets.some((s) => {
    const want = createHmac("sha256", s).update(raw).digest();
    return got.length === want.length && timingSafeEqual(got, want);
  });
}

type GraphJson = { id?: string; error?: { message?: string; code?: number }; messages?: { id: string }[] } & Record<string, unknown>;

async function graph(url: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; json: GraphJson }> {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
    return { ok: res.ok, status: res.status, json: (await res.json().catch(() => ({}))) as GraphJson };
  } catch (err) {
    return { ok: false, status: 0, json: { error: { message: (err as Error).message } } };
  }
}
const fail = (r: { status: number; json: GraphJson }): SendResult => ({
  ok: false,
  error: (r.json.error?.message || `HTTP ${r.status}`).slice(0, 300),
  retry: r.status === 0 || r.status >= 500 || r.status === 429,
});

/** A free-form WhatsApp text: allowed only within 24 hours of the person's last message. */
export async function sendWhatsAppText(to: string, body: string): Promise<SendResult> {
  if (!whatsappReplyConfigured()) return { ok: false, error: "WhatsApp API not configured", retry: false };
  const r = await graph(`${WA_API()}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: body.slice(0, 4000), preview_url: true } }),
  });
  return r.ok && r.json.messages?.[0]?.id ? { ok: true, id: r.json.messages[0].id } : fail(r);
}

/** Reply buttons, a list or a link button, inside the 24-hour window (see wa-flow.ts). */
export async function sendWhatsAppInteractive(to: string, interactive: Record<string, unknown>): Promise<SendResult> {
  if (!whatsappReplyConfigured()) return { ok: false, error: "WhatsApp API not configured", retry: false };
  const r = await graph(`${WA_API()}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, type: "interactive", interactive }),
  });
  return r.ok && r.json.messages?.[0]?.id ? { ok: true, id: r.json.messages[0].id } : fail(r);
}

/** A PDF from a public URL, inside the 24-hour window that the person's own message opened. */
export async function sendWhatsAppDocument(to: string, link: string, filename: string, caption: string): Promise<SendResult> {
  if (!whatsappReplyConfigured()) return { ok: false, error: "WhatsApp API not configured", retry: false };
  const r = await graph(`${WA_API()}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "document", document: { link, filename, caption: caption.slice(0, 1000) } }),
  });
  return r.ok && r.json.messages?.[0]?.id ? { ok: true, id: r.json.messages[0].id } : fail(r);
}

/**
 * A file a customer sent on WhatsApp. Meta gives a short-lived URL for the media id that itself
 * needs the token, so the admin route streams it through. Null when it's gone (Meta keeps media
 * for about 30 days) or too big to proxy.
 */
export async function whatsappMedia(mediaId: string): Promise<{ data: ArrayBuffer; type: string } | null> {
  if (!whatsappReplyConfigured() || !/^\d{5,40}$/.test(mediaId)) return null;
  const auth = { authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` };
  const meta = await graph(`${WA_API()}/${mediaId}`, { headers: auth });
  const url = typeof meta.json.url === "string" ? meta.json.url : "";
  if (!meta.ok || !url.startsWith("https://")) return null;
  try {
    const res = await fetch(url, { headers: auth, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    const data = await res.arrayBuffer();
    if (data.byteLength > 16 * 1024 * 1024) return null;
    return { data, type: res.headers.get("content-type") || (typeof meta.json.mime_type === "string" ? meta.json.mime_type : "application/octet-stream") };
  } catch {
    return null;
  }
}

// ---------- Instagram token ----------
// The token pasted in Vercel is the seed. The site refreshes it weekly and keeps the fresh one in
// public.integration_tokens, keyed by a hash of the seed: paste a new token and the old row is ignored.

const tokenKey = () => `instagram:${createHash("sha256").update(process.env.INSTAGRAM_ACCESS_TOKEN ?? "").digest("hex").slice(0, 12)}`;

async function storedToken(): Promise<{ value: string; updatedAt: Date } | null> {
  const { rows } = await pool.query<{ value: string; updated_at: Date }>(`select value, updated_at from public.integration_tokens where name = $1`, [tokenKey()]);
  return rows[0] ? { value: rows[0].value, updatedAt: rows[0].updated_at } : null;
}

export async function instagramToken(): Promise<string | null> {
  if (!instagramConfigured()) return null;
  return (await storedToken().catch(() => null))?.value ?? process.env.INSTAGRAM_ACCESS_TOKEN!;
}

/** Refreshes the long-lived token when it is more than 7 days old (it would expire after 60). */
export async function refreshInstagramToken(now = new Date()): Promise<"fresh" | "refreshed" | "failed" | "off"> {
  if (!instagramConfigured()) return "off";
  const stored = await storedToken();
  if (stored && now.getTime() - stored.updatedAt.getTime() < 7 * 86_400_000) return "fresh";
  const current = stored?.value ?? process.env.INSTAGRAM_ACCESS_TOKEN!;
  const r = await graph(`${IG_OAUTH()}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(current)}`);
  const token = typeof r.json.access_token === "string" ? r.json.access_token : null;
  if (!r.ok || !token) {
    console.error("[instagram] token refresh failed:", r.json.error?.message ?? r.status);
    return "failed";
  }
  const expiresIn = typeof r.json.expires_in === "number" ? r.json.expires_in : 60 * 86_400;
  await pool.query(
    `insert into public.integration_tokens (name, value, expires_at, updated_at) values ($1, $2, now() + make_interval(secs => $3), now())
     on conflict (name) do update set value = excluded.value, expires_at = excluded.expires_at, updated_at = now()`,
    [tokenKey(), token, expiresIn],
  );
  return "refreshed";
}

async function igUserId(token: string): Promise<string | null> {
  const r = await graph(`${IG_API()}/me?fields=user_id,username`, { headers: { authorization: `Bearer ${token}` } });
  const id = r.json.user_id ?? r.json.id;
  return typeof id === "string" ? id : typeof id === "number" ? String(id) : null;
}

/** Publishes one photo with its caption. The image must be a public JPEG URL. */
export async function publishInstagramPhoto(imageUrl: string, caption: string): Promise<SendResult & { permalink?: string }> {
  return publishInstagramMedia({ image_url: imageUrl, caption: caption.slice(0, 2200) });
}

/**
 * Publishes a Reel (also shown in the feed). Instagram downloads the MP4 from the public URL and
 * transcodes it, which takes up to a couple of minutes.
 */
export async function publishInstagramReel(videoUrl: string, caption: string): Promise<SendResult & { permalink?: string }> {
  return publishInstagramMedia({ media_type: "REELS", video_url: videoUrl, caption: caption.slice(0, 2200), share_to_feed: "true" }, { tries: 30, everyMs: 4000 });
}

/** Publishes a 9:16 image as a Story (Stories take no caption). */
export async function publishInstagramStory(imageUrl: string): Promise<SendResult & { permalink?: string }> {
  return publishInstagramMedia({ image_url: imageUrl, media_type: "STORIES" });
}

async function publishInstagramMedia(media: Record<string, string>, wait = { tries: 6, everyMs: 2000 }): Promise<SendResult & { permalink?: string }> {
  const token = await instagramToken();
  if (!token) return { ok: false, error: "Instagram not configured", retry: false };
  const auth = { authorization: `Bearer ${token}`, "content-type": "application/json" };
  const user = await igUserId(token);
  if (!user) return { ok: false, error: "Instagram token rejected (check INSTAGRAM_ACCESS_TOKEN)", retry: false };

  const created = await graph(`${IG_API()}/${user}/media`, { method: "POST", headers: auth, body: JSON.stringify(media) });
  if (!created.ok || !created.json.id) return fail(created);
  // Instagram downloads and processes the media first: photos within seconds, videos in minutes.
  const what = media.media_type === "REELS" ? "video" : "image";
  for (let i = 0; ; i++) {
    const s = await graph(`${IG_API()}/${created.json.id}?fields=status_code`, { headers: { authorization: `Bearer ${token}` } });
    if (s.json.status_code === "FINISHED" || !s.json.status_code) break;
    if (s.json.status_code === "ERROR" || s.json.status_code === "EXPIRED") return { ok: false, error: `Instagram could not process the ${what} (${s.json.status_code})`, retry: false };
    // Photos are published after the last check either way; a video that isn't ready can't be.
    if (i >= wait.tries - 1) {
      if (what === "video") return { ok: false, error: "Instagram was still processing the video", retry: true };
      break;
    }
    await new Promise((r) => setTimeout(r, wait.everyMs));
  }
  const published = await graph(`${IG_API()}/${user}/media_publish`, { method: "POST", headers: auth, body: JSON.stringify({ creation_id: created.json.id }) });
  if (!published.ok || !published.json.id) return fail(published);
  const link = await graph(`${IG_API()}/${published.json.id}?fields=permalink`, { headers: { authorization: `Bearer ${token}` } });
  return { ok: true, id: published.json.id, permalink: typeof link.json.permalink === "string" ? link.json.permalink : undefined };
}

/** A DM, or a private reply to a comment (recipient { comment_id }). */
export async function sendInstagramMessage(recipient: { id: string } | { comment_id: string }, text: string): Promise<SendResult> {
  const token = await instagramToken();
  if (!token) return { ok: false, error: "Instagram not configured", retry: false };
  const user = await igUserId(token);
  if (!user) return { ok: false, error: "Instagram token rejected (check INSTAGRAM_ACCESS_TOKEN)", retry: false };
  const r = await graph(`${IG_API()}/${user}/messages`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ recipient, message: { text: text.slice(0, 1000) } }),
  });
  const id = (r.json.message_id as string | undefined) ?? r.json.id;
  return r.ok && id ? { ok: true, id } : fail(r);
}

// ---------- Facebook Page ----------
//   FACEBOOK_PAGE_ID, FACEBOOK_PAGE_TOKEN   a System User token (doesn't expire) or a Page access token

export const facebookConfigured = () => Boolean(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_TOKEN);
const FB_API = () => (process.env.FACEBOOK_API_URL || "https://graph.facebook.com/v21.0").replace(/\/$/, "");

// Business Settings hands out a System User token, which Meta treats as a person: posting with it
// fails with "(#200) publish_actions … deprecated". Ask for the Page's own token with it (works with
// a Page token too, which returns itself) and keep it for an hour.
let pageToken: { value: string; source: string; until: number } | null = null;

async function facebookPageToken(): Promise<string> {
  const configured = process.env.FACEBOOK_PAGE_TOKEN!;
  if (pageToken && pageToken.source === configured && pageToken.until > Date.now()) return pageToken.value;
  const r = await graph(`${FB_API()}/${process.env.FACEBOOK_PAGE_ID}?fields=access_token`, { headers: { authorization: `Bearer ${configured}` } });
  const value = typeof r.json.access_token === "string" && r.json.access_token ? r.json.access_token : configured;
  if (!r.ok) console.error("[facebook] couldn't get the Page token:", r.json.error?.message ?? r.status);
  pageToken = { value, source: configured, until: Date.now() + (r.ok ? 60 * 60 * 1000 : 0) };
  return value;
}

/** A Messenger reply, or a private reply to a Page comment (recipient { comment_id }). */
export async function sendFacebookMessage(recipient: { id: string } | { comment_id: string }, text: string): Promise<SendResult> {
  if (!facebookConfigured()) return { ok: false, error: "Facebook Page not configured", retry: false };
  const r = await graph(`${FB_API()}/${process.env.FACEBOOK_PAGE_ID}/messages`, {
    method: "POST",
    headers: { authorization: `Bearer ${await facebookPageToken()}`, "content-type": "application/json" },
    body: JSON.stringify({ recipient, messaging_type: "RESPONSE", message: { text: text.slice(0, 2000) } }),
  });
  const id = (r.json.message_id as string | undefined) ?? r.json.id;
  return r.ok && id ? { ok: true, id } : fail(r);
}

/** Posts a photo with its caption on the Page. */
export async function publishFacebookPhoto(imageUrl: string, caption: string): Promise<SendResult & { permalink?: string }> {
  if (!facebookConfigured()) return { ok: false, error: "Facebook Page not configured", retry: false };
  const r = await graph(`${FB_API()}/${process.env.FACEBOOK_PAGE_ID}/photos`, {
    method: "POST",
    headers: { authorization: `Bearer ${await facebookPageToken()}`, "content-type": "application/json" },
    body: JSON.stringify({ url: imageUrl, message: caption.slice(0, 5000), published: true }),
  });
  const postId = (r.json.post_id as string | undefined) ?? r.json.id;
  return r.ok && postId ? { ok: true, id: postId, permalink: `https://www.facebook.com/${postId}` } : fail(r);
}

/**
 * Publishes a Reel on the Page: start an upload, let Facebook fetch the MP4 from its public URL,
 * then publish it with the caption. Facebook finishes processing on its side after this returns.
 */
export async function publishFacebookReel(videoUrl: string, caption: string): Promise<SendResult & { permalink?: string }> {
  if (!facebookConfigured()) return { ok: false, error: "Facebook Page not configured", retry: false };
  const token = await facebookPageToken();
  const endpoint = `${FB_API()}/${process.env.FACEBOOK_PAGE_ID}/video_reels`;
  const json = { authorization: `Bearer ${token}`, "content-type": "application/json" };
  const start = await graph(endpoint, { method: "POST", headers: json, body: JSON.stringify({ upload_phase: "start" }) });
  const videoId = typeof start.json.video_id === "string" ? start.json.video_id : null;
  const uploadUrl = typeof start.json.upload_url === "string" ? start.json.upload_url : null;
  if (!start.ok || !videoId || !uploadUrl) return fail(start);
  const upload = await graph(uploadUrl, { method: "POST", headers: { authorization: `OAuth ${token}`, file_url: videoUrl } });
  if (!upload.ok || upload.json.success === false) return fail(upload);
  const finish = await graph(endpoint, {
    method: "POST",
    headers: json,
    body: JSON.stringify({ upload_phase: "finish", video_id: videoId, video_state: "PUBLISHED", description: caption.slice(0, 5000) }),
  });
  if (!finish.ok || finish.json.success === false) return fail(finish);
  return { ok: true, id: videoId, permalink: `https://www.facebook.com/reel/${videoId}` };
}
