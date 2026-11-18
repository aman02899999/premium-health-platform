// Pure helpers for the home-page "videos" section: turn social_posts rows into YouTube Shorts and
// Instagram cards. No database or network here, so it is unit-tested (site-feed-core.test.ts).

import { SHORTS } from "@/lib/youtube/shorts-bank";

export type FeedRow = { channel: string; theme: string; external_id: string | null; permalink: string | null; created_at: Date | string };

export type ShortItem = { youtubeId: string; title: string; date: string };
export type InstaItem = { code: string; kind: "reel" | "p"; title: string; date: string; url: string };

const YT_ID = /^[\w-]{6,20}$/;
const IG_LINK = /^https:\/\/(?:www\.)?instagram\.com\/(reel|p)\/([\w-]{5,40})\/?$/i;

const iso = (d: Date | string) => new Date(d).toISOString();
const newestFirst = <T extends { date: string }>(a: T, b: T) => b.date.localeCompare(a.date);

/** A readable title from a slug the bank doesn't know ("fact-water-total" → "Water total"). */
function fromSlug(slug: string): string {
  const words = slug.replace(/^(myth|fact|viral|answer|trend|clip)-/i, "").replace(/[-_]+/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : "Fitness Short";
}

/** Published Shorts (channels youtube-1/-2/-3), newest first, one card per video. */
export function shortsFrom(rows: FeedRow[], limit = 8): ShortItem[] {
  const seen = new Set<string>();
  const out: ShortItem[] = [];
  for (const r of rows) {
    if (!/^youtube-\d+$/.test(r.channel) || !r.external_id || !YT_ID.test(r.external_id) || seen.has(r.external_id)) continue;
    seen.add(r.external_id);
    const s = SHORTS.find((x) => x.id === r.theme);
    out.push({ youtubeId: r.external_id, title: s?.hook ?? fromSlug(r.theme), date: iso(r.created_at) });
  }
  return out.sort(newestFirst).slice(0, limit);
}

/**
 * Published Instagram feed posts and Reels, newest first. Stories are left out: they vanish after
 * 24 hours, so a link to one would be dead the next day.
 */
export function instagramFrom(rows: FeedRow[], limit = 6): InstaItem[] {
  const seen = new Set<string>();
  const out: InstaItem[] = [];
  for (const r of rows) {
    if (!/^instagram(-am|-pm|-reel2)?$/.test(r.channel) || !r.permalink) continue;
    const m = IG_LINK.exec(r.permalink.trim());
    if (!m || seen.has(m[2])) continue;
    seen.add(m[2]);
    const kind = m[1].toLowerCase() as "reel" | "p";
    out.push({ code: m[2], kind, title: r.theme.trim() || "Royal Fitness Club", date: iso(r.created_at), url: `https://www.instagram.com/${kind}/${m[2]}/` });
  }
  return out.sort(newestFirst).slice(0, limit);
}

export { instagramEmbedUrl, tidyTitle } from "./feed-format";
