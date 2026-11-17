// Keeps tags on every video on the channel (owner rule, 17 Nov 2026: "every YouTube video gets
// relevant tags"). Uploads already send tags; this job is the safety net. Once a day it lists every
// upload on the channel, works out the tags each one should have, and adds any that are missing.
//
// Tags come from our own scripts when we know the video (social_posts.external_id -> theme ->
// Short or long video), and from the title plus the channel's own tags when we don't (for example a
// video the owner uploaded by hand). Tags already on a video are kept; ours are added after them.
//
// Quota: listing costs 1 unit per 50 videos; each update costs 50. MAX_UPDATES keeps a run well
// inside the 10,000 a day, leaving room for the day's uploads (about 1,600 each).
// videos.update needs the youtube.force-ssl permission. A channel connected before 17 Nov 2026 only
// granted upload + read, so the job reports "reconnect" until the owner presses Connect YouTube again.
// `fetch` is passed in, so every call is tested without the network.
import type { Fetch } from "./client";

const API = "https://www.googleapis.com/youtube/v3";
export const MAX_UPDATES = 40;
/** YouTube allows 500 characters of tags (a tag with a space counts its quotes); keep a margin. */
export const TAG_BUDGET = 450;

export const CHANNEL_TAGS = ["fitness", "fitness tips in hindi", "hinglish fitness", "Royal Fitness Club", "Noida gym", "Sector 93 Noida", "Coach Aman Sharma"];

const STOP = new Set(["the", "and", "for", "with", "you", "your", "kya", "hai", "ke", "ki", "ka", "ko", "se", "me", "mein", "aur", "ye", "yeh", "vs", "how", "what", "why", "this", "that", "sach", "shorts"]);

const tagCost = (t: string) => t.length + (t.includes(" ") ? 2 : 0) + 1;

/** One tag YouTube accepts: no angle brackets or commas, single spaces, at most 100 characters. */
export function cleanTag(t: string): string {
  return t.replace(/[<>,"#|]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}

/** Merges tag lists in order, case-insensitively unique, within the character budget. */
export function mergeTags(...lists: string[][]): string[] {
  const out: string[] = [];
  let len = 0;
  for (const raw of lists.flat()) {
    const t = cleanTag(raw);
    if (!t || out.some((o) => o.toLowerCase() === t.toLowerCase())) continue;
    if (len + tagCost(t) > TAG_BUDGET) break;
    out.push(t);
    len += tagCost(t);
  }
  return out;
}

/** Tags for a video we didn't script: a few words from its title, then the channel's tags. */
export function tagsFromTitle(title: string, isShort: boolean): string[] {
  const words = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w));
  const phrase = words.slice(0, 4).join(" ");
  return mergeTags(phrase ? [phrase] : [], words.slice(0, 5), CHANNEL_TAGS, isShort ? ["shorts"] : []);
}

/** True when the video is missing any of the tags it should have. */
export function needsTags(current: string[] | undefined, wanted: string[]): boolean {
  const have = new Set((current ?? []).map((t) => t.toLowerCase()));
  return wanted.some((t) => !have.has(t.toLowerCase()));
}

export type VideoSnippet = { title: string; description?: string; categoryId?: string; tags?: string[]; defaultLanguage?: string; defaultAudioLanguage?: string };
export type ChannelVideo = { id: string; snippet: VideoSnippet; seconds: number };

type ApiError = { error?: { message?: string; errors?: { reason?: string }[] } };
const reasonOf = (j: unknown, status: number) => {
  const e = (j as ApiError)?.error;
  return `${e?.errors?.[0]?.reason ?? `HTTP ${status}`}${e?.message ? `: ${e.message}` : ""}`.slice(0, 200);
};

async function getJson(url: string, token: string, f: Fetch): Promise<{ ok: true; json: Record<string, unknown> } | { ok: false; error: string }> {
  const res = await f(url, { headers: { authorization: `Bearer ${token}` } });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return res.ok ? { ok: true, json } : { ok: false, error: reasonOf(json, res.status) };
}

/** ISO 8601 duration (PT1M5S) to seconds. */
export function isoSeconds(d: string | undefined): number {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(d ?? "");
  if (!m) return 0;
  return Number(m[1] ?? 0) * 86400 + Number(m[2] ?? 0) * 3600 + Number(m[3] ?? 0) * 60 + Number(m[4] ?? 0);
}

/** Every upload on the connected channel, with its current snippet. */
export async function listChannelVideos(token: string, f: Fetch = fetch): Promise<{ ok: true; videos: ChannelVideo[] } | { ok: false; error: string }> {
  const ch = await getJson(`${API}/channels?part=contentDetails&mine=true`, token, f);
  if (!ch.ok) return ch;
  const uploads = (ch.json.items as { contentDetails?: { relatedPlaylists?: { uploads?: string } } }[] | undefined)?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) return { ok: false, error: "no uploads playlist" };
  const ids: string[] = [];
  let page = "";
  for (let i = 0; i < 40; i++) {
    const r = await getJson(`${API}/playlistItems?part=contentDetails&maxResults=50&playlistId=${encodeURIComponent(uploads)}${page ? `&pageToken=${page}` : ""}`, token, f);
    if (!r.ok) return r;
    for (const it of (r.json.items as { contentDetails?: { videoId?: string } }[] | undefined) ?? []) if (it.contentDetails?.videoId) ids.push(it.contentDetails.videoId);
    page = (r.json.nextPageToken as string | undefined) ?? "";
    if (!page) break;
  }
  const videos: ChannelVideo[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const r = await getJson(`${API}/videos?part=snippet,contentDetails&id=${ids.slice(i, i + 50).join(",")}`, token, f);
    if (!r.ok) return r;
    for (const v of (r.json.items as { id: string; snippet: VideoSnippet; contentDetails?: { duration?: string } }[] | undefined) ?? [])
      videos.push({ id: v.id, snippet: v.snippet, seconds: isoSeconds(v.contentDetails?.duration) });
  }
  return { ok: true, videos };
}

/** Sets the tags, sending back the rest of the snippet unchanged (videos.update replaces the whole snippet). */
export async function updateTags(token: string, v: ChannelVideo, tags: string[], f: Fetch = fetch): Promise<{ ok: true } | { ok: false; error: string; permission: boolean; quota: boolean }> {
  const s = v.snippet;
  const snippet: VideoSnippet = { title: s.title, description: s.description ?? "", categoryId: s.categoryId || "17", tags };
  if (s.defaultLanguage) snippet.defaultLanguage = s.defaultLanguage;
  if (s.defaultAudioLanguage) snippet.defaultAudioLanguage = s.defaultAudioLanguage;
  const res = await f(`${API}/videos?part=snippet`, {
    method: "PUT",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ id: v.id, snippet }),
  });
  if (res.ok) return { ok: true };
  const json = await res.json().catch(() => null);
  const error = reasonOf(json, res.status);
  return { ok: false, error, permission: res.status === 403 && /insufficient|forbidden|scope/i.test(error), quota: /quota/i.test(error) };
}

export type TagsReport = {
  total: number;
  missing: number;
  updated: number;
  failed: number;
  left: number;
  stopped?: "reconnect" | "quota";
  untagged: string[];
  errors: string[];
};

/**
 * The whole job: list, decide, update. `wantedFor` returns our scripted tags for a video id, or null
 * when we didn't script it. `dry` only reports what it would change.
 */
export async function backfillTags(
  token: string,
  wantedFor: (id: string) => string[] | null,
  opts: { dry?: boolean; max?: number } = {},
  f: Fetch = fetch,
): Promise<{ ok: true; report: TagsReport } | { ok: false; error: string }> {
  const listed = await listChannelVideos(token, f);
  if (!listed.ok) return listed;
  const todo = listed.videos
    .map((v) => ({ v, tags: mergeTags(v.snippet.tags ?? [], wantedFor(v.id) ?? tagsFromTitle(v.snippet.title, v.seconds > 0 && v.seconds <= 180)) }))
    .filter(({ v, tags }) => needsTags(v.snippet.tags, tags));
  const report: TagsReport = {
    total: listed.videos.length,
    missing: todo.length,
    updated: 0,
    failed: 0,
    left: 0,
    untagged: listed.videos.filter((v) => !v.snippet.tags?.length).map((v) => v.id),
    errors: [],
  };
  const max = opts.max ?? MAX_UPDATES;
  for (const [i, { v, tags }] of todo.entries()) {
    if (opts.dry || i >= max || report.stopped) {
      report.left++;
      continue;
    }
    const r = await updateTags(token, v, tags, f);
    if (r.ok) report.updated++;
    else {
      report.failed++;
      report.left++;
      report.errors.push(`${v.id}: ${r.error}`);
      if (r.permission) report.stopped = "reconnect";
      else if (r.quota) report.stopped = "quota";
    }
  }
  return { ok: true, report };
}
