// Tiny formatting helpers shared by the server feed and the client section (kept apart from
// site-feed-core so the Shorts bank is never bundled into the browser).

import type { InstaItem } from "./site-feed-core";

/** Instagram's official embed page for a post: it plays Reels in place, no API token needed. */
export const instagramEmbedUrl = (it: Pick<InstaItem, "code" | "kind">) => `https://www.instagram.com/${it.kind}/${it.code}/embed/`;

/** Title case for the all-caps card themes ("CORE THAT'S NOT CRUNCHES" → "Core that's not crunches"). */
export function tidyTitle(t: string): string {
  const letters = t.replace(/[^A-Za-z]/g, "");
  if (letters.length > 3 && letters === letters.toUpperCase()) return t[0] + t.slice(1).toLowerCase();
  return t;
}
