import { bestVideoFor } from "./topics";

export type SiteVideo = { youtubeId: string; scriptId: string; title: string; description: string; thumb: string; uploadDate: string; text: string };

/**
 * The video for a page. A page that names its video (`pin`, a script id from long-videos.ts) gets
 * that video once it is live and nothing before then, because a wrong video is worse than none.
 * Other pages fall back to word matching on their title and tags.
 */
export function pickSiteVideo(list: SiteVideo[], pageText: string, pin?: string | null): SiteVideo | null {
  if (pin) return list.find((v) => v.scriptId === pin) ?? null;
  const hit = bestVideoFor(pageText, list.map((v) => ({ id: v.youtubeId, text: v.text, date: v.uploadDate })));
  return hit ? list.find((v) => v.youtubeId === hit.id) ?? null : null;
}
