import "server-only";
import { isDbConfigured, pool } from "@/health/db";
import { siteVideos, type SiteVideo } from "@/lib/youtube/site-videos";
import { instagramFrom, shortsFrom, type FeedRow, type InstaItem, type ShortItem } from "./site-feed-core";

// What the home pages' "videos" section shows: the channel's long videos and Shorts, and recent
// Instagram posts and Reels. Everything comes from social_posts (written when each upload
// finished), so the page never calls the YouTube or Instagram APIs and keeps working when the
// Meta tokens are broken. Any failure gives empty lists, and the section falls back to links.

export type SiteFeed = { long: SiteVideo[]; shorts: ShortItem[]; instagram: InstaItem[] };

let memo: { at: number; feed: Promise<SiteFeed> } | null = null;
const TTL = 60 * 60 * 1000;

async function loadRows(): Promise<FeedRow[]> {
  if (!isDbConfigured) return [];
  try {
    const { rows } = await pool.query<FeedRow>(
      `select channel, theme, external_id, permalink, created_at from public.social_posts
        where status = 'published' and (channel ~ '^youtube-[0-9]+$' or channel ~ '^instagram(-am|-pm|-reel2)?$')
        order by created_at desc limit 120`,
    );
    return rows;
  } catch (err) {
    console.error("[site-feed] load failed:", (err as Error).message);
    return [];
  }
}

async function load(): Promise<SiteFeed> {
  const [long, rows] = await Promise.all([siteVideos().catch(() => [] as SiteVideo[]), loadRows()]);
  return {
    long: [...long].sort((a, b) => b.uploadDate.localeCompare(a.uploadDate)).slice(0, 6),
    shorts: shortsFrom(rows, 8),
    instagram: instagramFrom(rows, 6),
  };
}

/** The section's videos and posts, read at most once an hour per server. */
export function siteFeed(now = Date.now()): Promise<SiteFeed> {
  if (!memo || now - memo.at > TTL) memo = { at: now, feed: load() };
  return memo.feed;
}
