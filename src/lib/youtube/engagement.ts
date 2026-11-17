// Moves viewers from one video to the next, with no work from the owner (17 Nov 2026). Once a day:
//   1. Topic playlists (topics.ts): made once, and every public video is added to its topics, so
//      YouTube keeps playing the next video on the same subject. Long videos also go into one
//      "Full Videos" playlist.
//   2. One comment from the channel on every public video: the related long video, Instagram
//      @royalfitness93_, the /ig page and the calls number. It is posted once per video, ever.
//   3. Long videos get an "Agla video" link and their playlist link near the top of the description.
//
// What the YouTube API cannot do (checked 17 Nov 2026): pin a comment, set end screens or cards,
// or set a Short's "Related video". Those exist only in YouTube Studio. Links in Shorts comments
// and descriptions are also not clickable (YouTube's anti-spam rule since 2023), so on Shorts the
// comment names the full video, and the playlists do the real work.
//
// Quota: every write (playlist, playlist item, comment, description) costs 50 of the 10,000 units a
// day; reads cost 1. MAX_WRITES keeps a run near 1,500 units, so uploads always have room. The
// backlog of older videos is cleared over a few days. Everything done is remembered in
// public.youtube_actions, so nothing is posted twice, even if the job runs again.
// Comments and edits need the youtube.force-ssl permission (connect YouTube again after 17 Nov 2026).
// `fetch` is passed in, so every call is tested without the network.
import type { Fetch } from "./client";
import type { ChannelVideo, VideoSnippet } from "./tags-backfill";
import { LONG_PLAYLIST, TOPICS, bestVideoFor, videoText, videoTopics, type TopicKey } from "./topics";

const API = "https://www.googleapis.com/youtube/v3";
export const MAX_WRITES = 30;
/** A video longer than this is a long video (YouTube Shorts are at most 3 minutes). */
export const LONG_SECONDS = 180;
export const DESC_MARKER = "▶ Agla video:";
const DESC_LIMIT = 4900;

export type PlaylistKey = TopicKey | typeof LONG_PLAYLIST.key;
export const PLAYLISTS: { key: PlaylistKey; title: string; description: string }[] = [...TOPICS.map(({ key, title, description }) => ({ key, title, description })), LONG_PLAYLIST];

export type Links = { instagram: string; igPage: string; phone: string };

export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const playlistUrl = (id: string) => `https://www.youtube.com/playlist?list=${id}`;

/** The channel's comment. Shorts can't show clickable links, so it names the full video too. */
export function commentText(isShort: boolean, related: { id: string; title: string } | null, links: Links): string {
  const lines = [];
  if (related) lines.push(isShort ? `▶ Poori video channel par: "${related.title}" ${watchUrl(related.id)}` : `${DESC_MARKER} "${related.title}" ${watchUrl(related.id)}`);
  lines.push(`📸 Roz ki tips Instagram par: ${links.instagram}`);
  lines.push(`🏋️ Free trial aur offers: ${links.igPage}`);
  lines.push(`📞 Call / WhatsApp: ${links.phone}`);
  lines.push("Video kaam ki lagi? Comment mein batao aur channel subscribe karo 🙏");
  return lines.join("\n");
}

/** The description with the next-video and playlist links after its first paragraph. Null when it can't or needn't change. */
export function descriptionWithLinks(description: string, related: { id: string; title: string }, playlist: { id: string; title: string } | null): string | null {
  if (description.includes(DESC_MARKER)) return null;
  const block = [`${DESC_MARKER} ${related.title} ${watchUrl(related.id)}`, ...(playlist ? [`📃 Playlist: ${playlist.title} ${playlistUrl(playlist.id)}`] : [])].join("\n");
  const cut = description.indexOf("\n\n");
  const next = cut === -1 ? `${description}\n\n${block}` : `${description.slice(0, cut)}\n\n${block}${description.slice(cut)}`;
  return new TextEncoder().encode(next).length > DESC_LIMIT ? null : next;
}

type ApiError = { error?: { message?: string; errors?: { reason?: string }[] } };
type Res = { ok: true; json: Record<string, unknown> } | { ok: false; error: string; status: number; reason: string };

async function call(f: Fetch, token: string, url: string, method = "GET", body?: unknown): Promise<Res> {
  const res = await f(url, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json; charset=UTF-8" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.ok) return { ok: true, json };
  const e = (json as ApiError).error;
  const reason = e?.errors?.[0]?.reason ?? "";
  return { ok: false, status: res.status, reason, error: `${reason || `HTTP ${res.status}`}${e?.message ? `: ${e.message}` : ""}`.slice(0, 200) };
}

const isPermission = (r: Extract<Res, { ok: false }>) => r.status === 403 && /insufficient|forbidden|scope/i.test(r.error);
const isQuota = (r: Extract<Res, { ok: false }>) => /quota/i.test(r.reason || r.error);

export type Store = { done: Map<string, string>; save: (key: string, ref: string) => Promise<void> };

export type GrowReport = {
  videos: number;
  writes: number;
  playlistsCreated: number;
  added: number;
  comments: number;
  descriptions: number;
  /** Writes still to do after this run (the backlog clears over the next days). */
  left: number;
  stopped?: "reconnect" | "quota";
  errors: string[];
};

type Job = { kind: "playlist"; key: PlaylistKey } | { kind: "add"; key: PlaylistKey; video: string } | { kind: "comment"; video: ChannelVideo } | { kind: "desc"; video: ChannelVideo };

/**
 * One run. `videos` is the channel listing (listChannelVideos). Newest videos are served first, so a
 * new upload gets its playlists and comment the same night while the backlog waits its turn.
 */
export async function growChannel(token: string, videos: ChannelVideo[], store: Store, links: Links, opts: { dry?: boolean; maxWrites?: number } = {}, f: Fetch = fetch): Promise<GrowReport> {
  const max = opts.maxWrites ?? MAX_WRITES;
  const report: GrowReport = { videos: videos.length, writes: 0, playlistsCreated: 0, added: 0, comments: 0, descriptions: 0, left: 0, errors: [] };
  const pub = videos.filter((v) => v.privacy === "public").sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  const isLong = (v: ChannelVideo) => v.seconds > LONG_SECONDS;
  const text = (v: ChannelVideo) => videoText(v.snippet.title, v.snippet.tags);
  const longs = pub.filter(isLong).map((v) => ({ id: v.id, text: text(v), date: v.publishedAt ?? "", title: v.snippet.title }));
  const relatedFor = (v: ChannelVideo) => {
    const others = longs.filter((l) => l.id !== v.id);
    const hit = bestVideoFor(text(v), others, { loose: true }) ?? others[0] ?? null;
    return hit ? { id: hit.id, title: others.find((o) => o.id === hit.id)!.title } : null;
  };
  const playlistsOf = (v: ChannelVideo): PlaylistKey[] => [...videoTopics(text(v)), ...(isLong(v) ? [LONG_PLAYLIST.key] : [])];

  // Playlists the owner (or an earlier run) already made are reused by title, never duplicated.
  const plId = new Map<PlaylistKey, string>();
  for (const p of PLAYLISTS) {
    const known = store.done.get(`playlist:${p.key}`);
    if (known) plId.set(p.key, known);
  }
  if (plId.size < PLAYLISTS.length) {
    const mine = await call(f, token, `${API}/playlists?part=snippet&mine=true&maxResults=50`);
    if (mine.ok) {
      for (const it of (mine.json.items as { id: string; snippet?: { title?: string } }[] | undefined) ?? []) {
        const p = PLAYLISTS.find((x) => x.title === it.snippet?.title);
        if (p && !plId.has(p.key)) {
          plId.set(p.key, it.id);
          if (!opts.dry) await store.save(`playlist:${p.key}`, it.id);
        }
      }
    } else if (isPermission(mine)) return { ...report, stopped: "reconnect", errors: [mine.error] };
  }

  // What still needs doing, newest video first.
  const jobs: Job[] = [];
  const wanted = new Set<PlaylistKey>();
  for (const v of pub) {
    for (const key of playlistsOf(v)) {
      wanted.add(key);
      if (!store.done.has(`pl:${key}:${v.id}`)) jobs.push({ kind: "add", key, video: v.id });
    }
    if (!store.done.has(`comment:${v.id}`)) jobs.push({ kind: "comment", video: v });
    if (isLong(v) && !store.done.has(`desc:${v.id}`) && !(v.snippet.description ?? "").includes(DESC_MARKER)) jobs.push({ kind: "desc", video: v });
  }
  const make: Job[] = PLAYLISTS.filter((p) => wanted.has(p.key) && !plId.has(p.key)).map((p) => ({ kind: "playlist", key: p.key }));
  const queue = [...make, ...jobs];

  // Videos already in a playlist (from before this table existed) are recorded, not added again.
  const listed = new Map<PlaylistKey, Set<string>>();
  async function inPlaylist(key: PlaylistKey, video: string): Promise<boolean> {
    const id = plId.get(key);
    if (!id) return false;
    if (!listed.has(key)) {
      const ids = new Set<string>();
      let page = "";
      for (let i = 0; i < 20; i++) {
        const r = await call(f, token, `${API}/playlistItems?part=contentDetails&maxResults=50&playlistId=${encodeURIComponent(id)}${page ? `&pageToken=${page}` : ""}`);
        if (!r.ok) break;
        for (const it of (r.json.items as { contentDetails?: { videoId?: string } }[] | undefined) ?? []) if (it.contentDetails?.videoId) ids.add(it.contentDetails.videoId);
        page = (r.json.nextPageToken as string | undefined) ?? "";
        if (!page) break;
      }
      listed.set(key, ids);
    }
    return listed.get(key)!.has(video);
  }

  const fail = (what: string, r: Extract<Res, { ok: false }>) => {
    report.errors.push(`${what}: ${r.error}`);
    if (isPermission(r)) report.stopped = "reconnect";
    else if (isQuota(r)) report.stopped = "quota";
  };

  for (const job of queue) {
    if (opts.dry || report.stopped || report.writes >= max) {
      report.left++;
      continue;
    }
    if (job.kind === "playlist") {
      const p = PLAYLISTS.find((x) => x.key === job.key)!;
      report.writes++;
      const r = await call(f, token, `${API}/playlists?part=snippet,status`, "POST", { snippet: { title: p.title, description: p.description, defaultLanguage: "hi" }, status: { privacyStatus: "public" } });
      if (!r.ok) {
        fail(`playlist ${p.key}`, r);
        continue;
      }
      const id = r.json.id as string;
      plId.set(p.key, id);
      listed.set(p.key, new Set());
      await store.save(`playlist:${p.key}`, id);
      report.playlistsCreated++;
    } else if (job.kind === "add") {
      const id = plId.get(job.key);
      if (!id) {
        report.left++;
        continue;
      }
      if (await inPlaylist(job.key, job.video)) {
        await store.save(`pl:${job.key}:${job.video}`, id);
        continue;
      }
      report.writes++;
      const r = await call(f, token, `${API}/playlistItems?part=snippet`, "POST", { snippet: { playlistId: id, resourceId: { kind: "youtube#video", videoId: job.video } } });
      if (!r.ok) {
        fail(`add ${job.video} to ${job.key}`, r);
        continue;
      }
      listed.get(job.key)?.add(job.video);
      await store.save(`pl:${job.key}:${job.video}`, id);
      report.added++;
    } else if (job.kind === "comment") {
      const v = job.video;
      report.writes++;
      const r = await call(f, token, `${API}/commentThreads?part=snippet`, "POST", {
        snippet: { videoId: v.id, topLevelComment: { snippet: { textOriginal: commentText(!isLong(v), relatedFor(v), links) } } },
      });
      if (!r.ok) {
        // Comments turned off on this video: remember it and never try again.
        if (/commentsDisabled/i.test(r.reason)) await store.save(`comment:${v.id}`, "disabled");
        else fail(`comment ${v.id}`, r);
        continue;
      }
      await store.save(`comment:${v.id}`, String(r.json.id ?? "posted"));
      report.comments++;
    } else {
      const v = job.video;
      const related = relatedFor(v);
      const topic = videoTopics(text(v)).find((k) => k !== "myths") ?? LONG_PLAYLIST.key;
      const plKey: PlaylistKey = plId.has(topic) ? topic : LONG_PLAYLIST.key;
      const pl = plId.get(plKey);
      const next = related ? descriptionWithLinks(v.snippet.description ?? "", related, pl ? { id: pl, title: PLAYLISTS.find((p) => p.key === plKey)!.title } : null) : null;
      if (!next) {
        // No other long video yet (try again tomorrow) or the description is too long (leave it).
        if (related) await store.save(`desc:${v.id}`, "skipped");
        continue;
      }
      const s = v.snippet;
      const snippet: VideoSnippet = { title: s.title, description: next, categoryId: s.categoryId || "17", tags: s.tags ?? [] };
      if (s.defaultLanguage) snippet.defaultLanguage = s.defaultLanguage;
      if (s.defaultAudioLanguage) snippet.defaultAudioLanguage = s.defaultAudioLanguage;
      report.writes++;
      const r = await call(f, token, `${API}/videos?part=snippet`, "PUT", { id: v.id, snippet });
      if (!r.ok) {
        fail(`description ${v.id}`, r);
        continue;
      }
      await store.save(`desc:${v.id}`, related!.id);
      report.descriptions++;
    }
  }
  return report;
}
