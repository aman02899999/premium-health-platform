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
  const token = await instagramToken();
  if (!token) return { ok: false, error: "Instagram not configured", retry: false };
  const auth = { authorization: `Bearer ${token}`, "content-type": "application/json" };
  const user = await igUserId(token);
  if (!user) return { ok: false, error: "Instagram token rejected (check INSTAGRAM_ACCESS_TOKEN)", retry: false };

  const created = await graph(`${IG_API()}/${user}/media`, { method: "POST", headers: auth, body: JSON.stringify({ image_url: imageUrl, caption: caption.slice(0, 2200) }) });
  if (!created.ok || !created.json.id) return fail(created);
  // Instagram downloads and processes the image first; photos are usually ready within seconds.
  for (let i = 0; i < 6; i++) {
    const s = await graph(`${IG_API()}/${created.json.id}?fields=status_code`, { headers: { authorization: `Bearer ${token}` } });
    if (s.json.status_code === "FINISHED" || !s.json.status_code) break;
    if (s.json.status_code === "ERROR" || s.json.status_code === "EXPIRED") return { ok: false, error: `Instagram could not process the image (${s.json.status_code})`, retry: false };
    await new Promise((r) => setTimeout(r, 2000));
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
