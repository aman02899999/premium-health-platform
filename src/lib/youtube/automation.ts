import "server-only";
import { pool } from "@/health/db";
import type { PostBiz } from "@/lib/growth/daily-posts";
import { todayIST } from "@/lib/growth/dates";
import { accessToken, channelTitle, setThumbnail, uploadVideo, youtubeConfigured, youtubePrivacy, youtubeShortsOn, type Fetch, type UploadResult, type VideoMeta } from "./client";
import { SHORTS, type Short } from "./shorts-bank";
import { nextShort, shortDescription, shortTags, shortTitle } from "./shorts-core";
import { renderShort } from "./shorts";
import { SITE_URL } from "@/lib/site";
import { dueLongVideo, longVideoDescription, longVideoFile, longVideoTags, longVideoThumb } from "./long-videos";

// Three Shorts a day (vercel.json: /api/cron/youtube?slot=1, 2, 3, and slot=all late at night to
// retry). Each slot is its own social_posts row (channel youtube-1/2/3, one per day), so a slot
// never uploads twice however often the cron runs. Each upload takes the next script nobody has
// used yet, so a failed day never skips a script and none is ever posted twice.

export const YT_SLOTS = [1, 2, 3] as const;
export type YtSlot = (typeof YT_SLOTS)[number];
const REFRESH_KEY = "youtube:refresh";
const CHANNEL_KEY = "youtube:channel";

export type ShortResult = "off" | "not-connected" | "already-posted" | "bank-empty" | `published${string}` | `failed: ${string}`;

async function token(name: string): Promise<string | null> {
  const { rows } = await pool.query<{ value: string }>(`select value from public.integration_tokens where name = $1`, [name]);
  return rows[0]?.value ?? null;
}

async function saveToken(name: string, value: string) {
  await pool.query(
    `insert into public.integration_tokens (name, value, updated_at) values ($1, $2, now())
     on conflict (name) do update set value = excluded.value, updated_at = now()`,
    [name, value.slice(0, 1000)],
  );
}

/** Called by the sign-in callback: keeps the refresh token and the channel's name. */
export async function saveYoutubeConnection(refresh: string, access: string, f: Fetch = fetch): Promise<string | null> {
  await saveToken(REFRESH_KEY, refresh);
  const title = await channelTitle(access, f).catch(() => null);
  if (title) await saveToken(CHANNEL_KEY, title);
  return title;
}

export type YoutubeStatus = { configured: boolean; on: boolean; connected: boolean; channel: string | null; left: number };

/** What Admin shows: set up, switched on, which channel, how many scripts are left. */
export async function youtubeStatus(): Promise<YoutubeStatus> {
  const [refresh, channel, used] = await Promise.all([token(REFRESH_KEY).catch(() => null), token(CHANNEL_KEY).catch(() => null), usedScripts().catch(() => [] as string[])]);
  return { configured: youtubeConfigured(), on: youtubeShortsOn(), connected: !!refresh, channel, left: SHORTS.length - new Set(used).size };
}

/** Scripts already on YouTube or being uploaded right now. */
async function usedScripts(): Promise<string[]> {
  const { rows } = await pool.query<{ theme: string }>(`select theme from public.social_posts where channel like 'youtube-%' and channel <> 'youtube-long' and status in ('published', 'pending')`);
  return rows.map((r) => r.theme);
}

/** Claims today's slot (or a failed one to retry) for this script; null when the slot is already done. */
async function claim(slot: YtSlot, date: string, short: Short): Promise<string | null> {
  const { rows } = await pool.query<{ id: string }>(
    `insert into public.social_posts (channel, post_date, theme) values ($1, $2, $3)
     on conflict (channel, post_date) do update set status = 'pending', error = null, theme = excluded.theme, created_at = now()
       where public.social_posts.status = 'failed'
          or (public.social_posts.status = 'pending' and public.social_posts.created_at < now() - interval '20 minutes')
     returning id`,
    [`youtube-${slot}`, date, short.id],
  );
  return rows[0]?.id ?? null;
}

async function record(id: string, r: UploadResult) {
  await pool.query(`update public.social_posts set status = $2, external_id = $3, permalink = $4, error = $5 where id = $1`, [
    id,
    r.ok ? "published" : "failed",
    r.ok ? r.id : null,
    r.ok ? r.url : null,
    // A video YouTube kept private (API project not audited yet) is published but flagged.
    r.ok ? (r.privacy !== youtubePrivacy() ? `uploaded as ${r.privacy}`.slice(0, 300) : null) : r.error.slice(0, 300),
  ]);
}

export type ShortDeps = {
  render: (short: Short, index: number, biz: PostBiz) => Promise<Buffer>;
  upload: (token: string, video: Buffer, meta: VideoMeta) => Promise<UploadResult>;
  access: (refresh: string) => ReturnType<typeof accessToken>;
};
const DEPS: ShortDeps = { render: renderShort, upload: (t, v, m) => uploadVideo(t, v, m), access: (r) => accessToken(r) };

/** One slot's Short: pick the next script, render it, upload it. Safe to run again. */
export async function runShort(slot: YtSlot, now: Date, biz: PostBiz, deps: ShortDeps = DEPS): Promise<ShortResult> {
  if (!youtubeShortsOn()) return "off";
  const refresh = await token(REFRESH_KEY);
  if (!refresh) return "not-connected";
  const today = todayIST(now);
  // A failed row of this slot is retried with whatever script is next (its old one is free again).
  const { rows: mine } = await pool.query<{ status: string }>(`select status from public.social_posts where channel = $1 and post_date = $2`, [`youtube-${slot}`, today]);
  if (mine[0]?.status === "published") return "already-posted";
  const short = nextShort(await usedScripts());
  if (!short) return "bank-empty";
  const id = await claim(slot, today, short);
  if (!id) return "already-posted";

  const at = await deps.access(refresh);
  if (!at.ok) {
    const error = at.revoked ? "YouTube sign-in expired or was removed: connect the channel again in Admin → Growth → Social" : `YouTube sign-in: ${at.error}`;
    await record(id, { ok: false, error, quota: false });
    return `failed: ${error}`;
  }
  let result: UploadResult;
  try {
    const index = SHORTS.findIndex((s) => s.id === short.id);
    const video = await deps.render(short, index, biz);
    result = await deps.upload(at.token, video, { title: shortTitle(short), description: shortDescription(short, biz), tags: shortTags(short), privacy: youtubePrivacy() });
  } catch (err) {
    result = { ok: false, error: `Render/upload: ${(err as Error).message}`, quota: false };
  }
  await record(id, result);
  if (!result.ok) {
    console.error(`[youtube] slot ${slot} failed:`, result.error);
    return `failed: ${result.error.slice(0, 160)}`;
  }
  return `published ${result.url}${result.privacy !== youtubePrivacy() ? ` (YouTube kept it ${result.privacy})` : ""}`;
}

// Long videos (16:9, 4–5 minutes) are ready-made MP4s in public/youtube/long/, listed in
// long-videos.ts. Each goes up once, on or after its date, in its own row (channel youtube-long,
// at most one a day), so a failed upload is retried by the next cron run and none goes up twice.

const LONG = "youtube-long";

export type LongDeps = {
  download: (url: string) => Promise<Buffer>;
  upload: (token: string, video: Buffer, meta: VideoMeta) => Promise<UploadResult>;
  thumbnail: (token: string, videoId: string, jpeg: Buffer) => Promise<{ ok: true } | { ok: false; error: string }>;
  access: (refresh: string) => ReturnType<typeof accessToken>;
};

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${url}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
const LONG_DEPS: LongDeps = { download, upload: (t, v, m) => uploadVideo(t, v, m), thumbnail: (t, id, j) => setThumbnail(t, id, j), access: (r) => accessToken(r) };

export type LongResult = "off" | "not-connected" | "already-posted" | "none-due" | `published${string}` | `failed: ${string}`;

/** Uploads the long video that is due today, if any. Safe to run again. */
export async function runLongVideo(now: Date, deps: LongDeps = LONG_DEPS): Promise<LongResult> {
  if (!youtubeShortsOn()) return "off";
  const refresh = await token(REFRESH_KEY);
  if (!refresh) return "not-connected";
  const today = todayIST(now);
  const { rows: mine } = await pool.query<{ status: string }>(`select status from public.social_posts where channel = $1 and post_date = $2`, [LONG, today]);
  if (mine[0]?.status === "published") return "already-posted";
  const { rows: used } = await pool.query<{ theme: string }>(`select theme from public.social_posts where channel = $1 and status in ('published', 'pending')`, [LONG]);
  const video = dueLongVideo(today, used.map((r) => r.theme));
  if (!video) return "none-due";
  const { rows: claimed } = await pool.query<{ id: string }>(
    `insert into public.social_posts (channel, post_date, theme) values ($1, $2, $3)
     on conflict (channel, post_date) do update set status = 'pending', error = null, theme = excluded.theme, created_at = now()
       where public.social_posts.status = 'failed'
          or (public.social_posts.status = 'pending' and public.social_posts.created_at < now() - interval '20 minutes')
     returning id`,
    [LONG, today, video.id],
  );
  const id = claimed[0]?.id;
  if (!id) return "already-posted";

  const at = await deps.access(refresh);
  if (!at.ok) {
    const error = at.revoked ? "YouTube sign-in expired or was removed: connect the channel again in Admin → Growth → Social" : `YouTube sign-in: ${at.error}`;
    await record(id, { ok: false, error, quota: false });
    return `failed: ${error}`;
  }
  let result: UploadResult;
  try {
    const mp4 = await deps.download(`${SITE_URL}${longVideoFile(video)}`);
    result = await deps.upload(at.token, mp4, { title: video.title, description: longVideoDescription(video), tags: longVideoTags(video), privacy: youtubePrivacy() });
    if (result.ok) result = { ...result, url: `https://www.youtube.com/watch?v=${result.id}` };
  } catch (err) {
    result = { ok: false, error: `Download/upload: ${(err as Error).message}`, quota: false };
  }
  await record(id, result);
  if (!result.ok) {
    console.error("[youtube] long video failed:", result.error);
    return `failed: ${result.error.slice(0, 160)}`;
  }
  // The thumbnail is a nice-to-have: an unverified channel can't set one, and the video is already up.
  let thumb = "";
  try {
    const t = await deps.thumbnail(at.token, result.id, await deps.download(`${SITE_URL}${longVideoThumb(video)}`));
    if (!t.ok) thumb = ` (thumbnail not set: ${t.error.slice(0, 80)})`;
  } catch (err) {
    thumb = ` (thumbnail not set: ${(err as Error).message.slice(0, 80)})`;
  }
  return `published ${result.url}${result.privacy !== youtubePrivacy() ? ` (YouTube kept it ${result.privacy})` : ""}${thumb}`;
}
