// The day's Reel as a list of scenes: the same content as the day's post, cut into one idea per
// screen so it reads at Reel speed. Pure, so the timing and the words can be tested.
import type { DailyPost } from "@/lib/growth/daily-posts";

export type Scene =
  | { kind: "hook"; kicker: string; text: string; seconds: number }
  | { kind: "point"; n: number; of: number; text: string; seconds: number }
  | { kind: "takeaway"; text: string; note: string | null; seconds: number }
  | { kind: "product"; title: string; cover: string | null; seconds: number }
  | { kind: "bullets"; items: string[]; seconds: number }
  | { kind: "price"; text: string; note: string | null; seconds: number }
  | { kind: "body"; text: string; seconds: number }
  | { kind: "cta"; text: string; seconds: number };

export const MEDICAL_LINE = "General information, not medical advice.";
/** Seconds the cross-fade between two scenes overlaps them. */
export const FADE = 0.4;

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
/** Long enough to read twice at a relaxed pace (about 3.5 words a second), never a crawl. */
export const readTime = (s: string, min = 2.6, max = 5.5) => Math.round(Math.min(max, Math.max(min, 1.4 + words(s) / 3.5)) * 10) / 10;

/** Splits a long paragraph into at most two screens at a sentence break. */
function screens(text: string): string[] {
  if (words(text) <= 26) return [text];
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g)?.map((s) => s.trim()) ?? [text];
  let best = 1;
  let gap = Infinity;
  for (let i = 1; i < sentences.length; i++) {
    const d = Math.abs(words(sentences.slice(0, i).join(" ")) - words(text) / 2);
    if (d < gap) [best, gap] = [i, d];
  }
  const halves = [sentences.slice(0, best).join(" "), sentences.slice(best).join(" ")];
  // A screen with one short sentence on it looks empty: keep it whole instead.
  return sentences.length > 1 && halves.every((h) => words(h) >= 10) ? halves : [text];
}

export function reelScenes(post: DailyPost): Scene[] {
  const note = post.medical ? MEDICAL_LINE : null;
  const kicker = post.category === "Shop" ? "COACH'S PICK" : post.category === "Offer" ? "FROM COACH AMAN" : post.category.toUpperCase();
  const scenes: Scene[] = [{ kind: "hook", kicker, text: post.title, seconds: readTime(post.title, 2.8, 4) }];
  if (post.category === "Shop") {
    scenes.push({ kind: "product", title: post.theme, cover: post.cover, seconds: 3 });
    scenes.push({ kind: "bullets", items: post.points, seconds: readTime(post.points.join(" "), 4, 6.5) });
    scenes.push({ kind: "price", text: post.takeaway, note: post.medical ? "Supports, never replaces, your doctor's advice." : null, seconds: 3 });
  } else if (post.category === "Offer") {
    for (const text of screens(post.points[0] ?? "")) if (text) scenes.push({ kind: "body", text, seconds: readTime(text, 3, 6.5) });
  } else {
    post.points.forEach((text, i) => scenes.push({ kind: "point", n: i + 1, of: post.points.length, text, seconds: readTime(text) }));
    if (post.takeaway) scenes.push({ kind: "takeaway", text: post.takeaway, note, seconds: readTime(post.takeaway, 3, 5) });
  }
  scenes.push({ kind: "cta", text: post.cta, seconds: 3.5 });
  return scenes;
}

/** Total running time once the cross-fades overlap the scenes. */
export const reelSeconds = (scenes: Scene[]) => Math.round((scenes.reduce((t, s) => t + s.seconds, 0) - FADE * (scenes.length - 1)) * 10) / 10;

/** The Reel's caption: the day's Instagram caption, which already ends with the link-in-bio line. */
export const reelCaption = (post: DailyPost, channel: "instagram" | "facebook") => (channel === "instagram" ? post.instagram : post.facebook);
