import "server-only";
import { isDbConfigured, pool } from "@/health/db";
import { LONG_VIDEOS } from "./long-videos";
import { bestVideoFor, videoText } from "./topics";

// Long videos that are live on YouTube, for the "watch the video" box on health pages and blog
// posts. The YouTube id comes from social_posts (written when the upload finished); the title,
// intro come from the script in long-videos.ts and the thumbnail from YouTube, so the page never calls YouTube.

export type SiteVideo = { youtubeId: string; scriptId: string; title: string; description: string; thumb: string; uploadDate: string; text: string };

/**
 * YouTube's own thumbnail for a video. The thumbnails in public/youtube are not in the Cloud Run
 * image (.dockerignore drops that folder to keep it small), so a local path 404s on the live site.
 */
export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

let memo: { at: number; list: Promise<SiteVideo[]> } | null = null;
const TTL = 60 * 60 * 1000;

async function load(): Promise<SiteVideo[]> {
  if (!isDbConfigured) return [];
  try {
    const { rows } = await pool.query<{ theme: string; external_id: string; created_at: Date }>(
      `select theme, external_id, created_at from public.social_posts
        where channel like 'youtube-long%' and status = 'published' and external_id is not null
          and (error is null or error not like 'uploaded as private%')`,
    );
    return rows.flatMap((r) => {
      const v = LONG_VIDEOS.find((l) => l.id === r.theme);
      if (!v || !/^[\w-]{6,20}$/.test(r.external_id)) return [];
      return [{ youtubeId: r.external_id, scriptId: v.id, title: v.title, description: v.intro.replace(/\s*\n\s*/g, " "), thumb: youtubeThumb(r.external_id), uploadDate: new Date(r.created_at).toISOString(), text: videoText(v.title, v.tags) }];
    });
  } catch (err) {
    // A page must render even when the database is unreachable; it just shows no video.
    console.error("[site-videos] load failed:", (err as Error).message);
    return [];
  }
}

/** Live long videos, read at most once an hour per server. */
export function siteVideos(now = Date.now()): Promise<SiteVideo[]> {
  if (!memo || now - memo.at > TTL) memo = { at: now, list: load() };
  return memo.list;
}

/** The video that fits a page, or null when none does. */
export async function videoForPage(pageText: string): Promise<SiteVideo | null> {
  const list = await siteVideos();
  const hit = bestVideoFor(pageText, list.map((v) => ({ id: v.youtubeId, text: v.text, date: v.uploadDate })));
  return hit ? list.find((v) => v.youtubeId === hit.id) ?? null : null;
}
