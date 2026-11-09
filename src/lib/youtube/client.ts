// YouTube Data API v3: sign-in (OAuth), token refresh and the resumable video upload. The owner
// makes the Google Cloud OAuth client and puts YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in
// Vercel; the channel is then connected from Admin with one click, and the refresh token Google
// sends back is kept in public.integration_tokens (never in chat, never in the code).
// `fetch` is passed in, so every call is tested without the network.

export type Fetch = typeof fetch;

export const YT_SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"];
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";
const CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true";

export const youtubeConfigured = () => Boolean(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET);
/** The off switch: YOUTUBE_SHORTS=off in Vercel stops every upload without a deploy. */
export const youtubeShortsOn = () => youtubeConfigured() && process.env.YOUTUBE_SHORTS !== "off";
/** "public" (the default), "unlisted" or "private". Google keeps uploads private anyway until the API project passes its audit. */
export function youtubePrivacy(): "public" | "unlisted" | "private" {
  const p = process.env.YOUTUBE_PRIVACY;
  return p === "unlisted" || p === "private" ? p : "public";
}

export const redirectUri = (siteUrl: string) => `${siteUrl.replace(/\/$/, "")}/api/admin/youtube/callback`;

export function authUrl(siteUrl: string, state: string): string {
  const q = new URLSearchParams({
    client_id: process.env.YOUTUBE_CLIENT_ID ?? "",
    redirect_uri: redirectUri(siteUrl),
    response_type: "code",
    scope: YT_SCOPES.join(" "),
    access_type: "offline",
    // Always ask, so Google always sends a refresh token (it only does on consent).
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${q}`;
}

type TokenReply = { access_token?: string; refresh_token?: string; expires_in?: number; error?: string; error_description?: string };

async function tokenCall(body: Record<string, string>, f: Fetch): Promise<TokenReply & { status: number }> {
  const res = await f(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.YOUTUBE_CLIENT_ID ?? "", client_secret: process.env.YOUTUBE_CLIENT_SECRET ?? "", ...body }),
  });
  const json = (await res.json().catch(() => ({}))) as TokenReply;
  return { ...json, status: res.status };
}

/** Swaps the one-time code from Google's consent screen for tokens. */
export async function exchangeCode(code: string, siteUrl: string, f: Fetch = fetch): Promise<{ ok: true; refresh: string; access: string } | { ok: false; error: string }> {
  const r = await tokenCall({ grant_type: "authorization_code", code, redirect_uri: redirectUri(siteUrl) }, f);
  if (r.access_token && r.refresh_token) return { ok: true, refresh: r.refresh_token, access: r.access_token };
  return { ok: false, error: r.error_description || r.error || (r.access_token ? "Google sent no refresh token" : `HTTP ${r.status}`) };
}

/** A fresh one-hour access token from the stored refresh token. `revoked` means connect again. */
export async function accessToken(refresh: string, f: Fetch = fetch): Promise<{ ok: true; token: string } | { ok: false; error: string; revoked: boolean }> {
  const r = await tokenCall({ grant_type: "refresh_token", refresh_token: refresh }, f);
  if (r.access_token) return { ok: true, token: r.access_token };
  return { ok: false, error: r.error_description || r.error || `HTTP ${r.status}`, revoked: r.error === "invalid_grant" };
}

/** The connected channel's name, shown in Admin so the owner can see the right channel is linked. */
export async function channelTitle(token: string, f: Fetch = fetch): Promise<string | null> {
  const res = await f(CHANNELS_URL, { headers: { authorization: `Bearer ${token}` } });
  const json = (await res.json().catch(() => ({}))) as { items?: { snippet?: { title?: string } }[] };
  return json.items?.[0]?.snippet?.title ?? null;
}

export type VideoMeta = { title: string; description: string; tags: string[]; privacy: "public" | "unlisted" | "private" };
export type UploadResult = { ok: true; id: string; privacy: string; url: string } | { ok: false; error: string; quota: boolean };

function apiError(json: unknown, status: number): { error: string; quota: boolean } {
  const e = (json as { error?: { message?: string; errors?: { reason?: string }[] } })?.error;
  const reason = e?.errors?.[0]?.reason ?? "";
  return { error: `${reason ? `${reason}: ` : ""}${e?.message ?? `HTTP ${status}`}`.slice(0, 280), quota: /quota|uploadLimit|rateLimit/i.test(reason) };
}

/** Uploads one video in two steps (start a resumable session, then send the bytes). */
export async function uploadVideo(token: string, video: Buffer, meta: VideoMeta, f: Fetch = fetch): Promise<UploadResult> {
  const body = {
    snippet: { title: meta.title, description: meta.description, tags: meta.tags, categoryId: "17", defaultLanguage: "en" },
    status: { privacyStatus: meta.privacy, selfDeclaredMadeForKids: false, embeddable: true, license: "youtube", containsSyntheticMedia: false },
  };
  const start = await f(UPLOAD_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json; charset=UTF-8",
      "x-upload-content-length": String(video.length),
      "x-upload-content-type": "video/mp4",
    },
    body: JSON.stringify(body),
  });
  const session = start.headers.get("location");
  if (!start.ok || !session) return { ok: false, ...apiError(await start.json().catch(() => null), start.status) };
  const put = await f(session, { method: "PUT", headers: { "content-type": "video/mp4", "content-length": String(video.length) }, body: new Uint8Array(video) });
  const json = (await put.json().catch(() => null)) as { id?: string; status?: { privacyStatus?: string } } | null;
  if (!put.ok || !json?.id) return { ok: false, ...apiError(json, put.status) };
  return { ok: true, id: json.id, privacy: json.status?.privacyStatus ?? meta.privacy, url: `https://youtube.com/shorts/${json.id}` };
}

const THUMB_URL = "https://www.googleapis.com/upload/youtube/v3/thumbnails/set";

/** Sets a custom thumbnail. YouTube only allows this on a phone-verified channel, so a failure is reported, never fatal. */
export async function setThumbnail(token: string, videoId: string, jpeg: Buffer, f: Fetch = fetch): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await f(`${THUMB_URL}?videoId=${encodeURIComponent(videoId)}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "image/jpeg", "content-length": String(jpeg.length) },
    body: new Uint8Array(jpeg),
  });
  if (res.ok) return { ok: true };
  return { ok: false, error: apiError(await res.json().catch(() => null), res.status).error };
}
