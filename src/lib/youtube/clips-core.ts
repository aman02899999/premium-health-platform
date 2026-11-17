// "Drop your phone clip": the owner films a short vertical clip (a form fix, a member's lift with
// their OK, a 30-second reaction to a fitness myth in their own words), uploads it in Admin with a
// hook and up to four caption lines, and the site adds the captions, an original music bed, the
// gym's end card, and posts it as a YouTube Short (and an Instagram/Facebook Reel once those
// tokens work). Only the owner's own recordings: never another creator's video. Pure, so the
// checks, timing and ffmpeg graph are tested without ffmpeg.
import { SITE_URL } from "@/lib/site";

const SITE_HOST = SITE_URL.replace(/^https?:\/\/(www\.)?/, "");

export const MAX_CLIP_MB = 50; // Supabase Storage's default per-file limit
export const MAX_CLIP_SECONDS = 60;
export const MAX_CAPTIONS = 4;
export const END_CARD_SECONDS = 3;
/** Music index base for clips: past the bank (0–~300), the Reels (~400s) and the queue (6000+). */
export const CLIP_INDEX_BASE = 8000;

export type ClipInput = { hook: string; captions: string[]; consent: boolean; medical: boolean };

const BANNED = /\b(cure[sd]?|guarantee[d]?|100%|\d+\s*(mg|mcg|iu)\b|dose|dosage|steroid|miracle|overnight)\b/i;
const clean = (s: string) => s.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();

export function checkClipInput(raw: unknown): { ok: true; value: ClipInput } | { ok: false; errors: string[] } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: string[] = [];
  const hook = typeof r.hook === "string" ? clean(r.hook) : "";
  if (hook.length < 6 || hook.length > 70) errors.push("Hook: 6–70 characters");
  const captions = (Array.isArray(r.captions) ? r.captions : []).map((c) => (typeof c === "string" ? clean(c) : "")).filter(Boolean);
  if (captions.length > MAX_CAPTIONS) errors.push(`At most ${MAX_CAPTIONS} caption lines`);
  if (captions.some((c) => c.length > 80)) errors.push("Each caption line: at most 80 characters");
  if (r.consent !== true) errors.push("Tick the box: it's your own recording and everyone in it agreed");
  const banned = BANNED.exec([hook, ...captions].join(" "));
  if (banned) errors.push(`Says "${banned[0]}": no cures, guarantees, doses or steroids`);
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { hook, captions: captions.slice(0, MAX_CAPTIONS), consent: true, medical: r.medical === true } };
}

/** When each caption shows: the clip (before the end card) is split evenly, the hook stays up the first 3 s. */
export function captionWindows(seconds: number, count: number): [number, number][] {
  const body = Math.max(1, seconds - END_CARD_SECONDS);
  if (!count) return [];
  const start = Math.min(2.5, body / 4);
  const each = (body - start) / count;
  return Array.from({ length: count }, (_, i) => [round(start + i * each), round(start + (i + 1) * each)]);
}
const round = (n: number) => Math.round(n * 100) / 100;

/**
 * The ffmpeg graph. Inputs: 0 the clip, 1 the hook PNG, 2 the end card PNG, 3.. the caption PNGs,
 * then the music WAV. The phone video is cropped to 1080×1920; the phone's own sound stays, with
 * the music low underneath (or the music alone when the clip is silent).
 */
export function clipFilterGraph(seconds: number, captions: number, hasAudio: boolean): string {
  const t = round(seconds);
  const music = 3 + captions;
  const steps = [`[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,format=yuv420p[v0]`];
  let last = "v0";
  steps.push(`[${last}][1:v]overlay=(W-w)/2:170:enable='between(t,0,3)'[vh]`);
  last = "vh";
  captionWindows(t, captions).forEach(([a, b], i) => {
    steps.push(`[${last}][${3 + i}:v]overlay=(W-w)/2:H-h-330:enable='between(t,${a},${b})'[vc${i}]`);
    last = `vc${i}`;
  });
  steps.push(`[${last}][2:v]overlay=0:0:enable='gte(t,${round(t - END_CARD_SECONDS)})'[vout]`);
  if (hasAudio) {
    steps.push(`[0:a]aresample=48000,volume=1.0[a0]`, `[${music}:a]aresample=48000,atrim=0:${t},volume=0.22[a1]`, `[a0][a1]amix=inputs=2:duration=first:normalize=0,atrim=0:${t}[aout]`);
  } else {
    steps.push(`[${music}:a]aresample=48000,atrim=0:${t},volume=0.8[aout]`);
  }
  return steps.join(";");
}

/** Length and whether there is sound, from ffmpeg's report on the file. */
export function probe(stderr: string): { seconds: number; hasAudio: boolean } | null {
  const m = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr);
  if (!m) return null;
  const seconds = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  return seconds > 0 ? { seconds, hasAudio: /Stream #\d+:\d+(?:\[[^\]]*\])?(?:\([^)]*\))?: Audio:/.test(stderr) } : null;
}

export const END_CARD_LINES = ["Royal Fitness Club, Sector 93 Noida", "Coach Aman Sharma", `Free trial: ${SITE_HOST}`];

export function clipTitle(hook: string): string {
  const tail = " #shorts";
  return hook.length + tail.length <= 100 ? `${hook}${tail}` : `${hook.slice(0, 100 - tail.length - 1)}…${tail}`;
}

export function clipDescription(c: ClipInput, siteUrl: string, phone: string, id: string): string {
  const link = `${siteUrl.replace(/\/$/, "")}/?utm_source=youtube&utm_medium=shorts&utm_campaign=clip-${id.slice(0, 8)}`;
  return [
    c.hook,
    "",
    ...c.captions.map((l) => `• ${l}`),
    ...(c.captions.length ? [""] : []),
    c.medical ? "Ye general jaankari hai, medical advice nahi. Koi health problem hai toh apne doctor ki salah maano." : "Ye general jaankari hai, medical advice nahi.",
    "",
    "Royal Fitness Club, Sector 93 Noida mein Coach Aman Sharma ke saath train karo.",
    `Free trial book karo: ${link}`,
    `Call ya WhatsApp: ${phone}`,
    "",
    "#shorts #fitness #noidagym",
  ]
    .join("\n")
    .slice(0, 4900);
}

export const CLIP_TAGS = ["fitness", "gym", "fitness tips in hindi", "hinglish", "Royal Fitness Club", "Noida gym", "Sector 93 Noida", "Coach Aman Sharma", "shorts", "gym reel"];

/** The Instagram / Facebook caption for the same clip. */
export function clipReelCaption(c: ClipInput, phone: string): string {
  return [c.hook, "", ...c.captions, ...(c.captions.length ? [""] : []), `Free trial: ${SITE_HOST}/ig`, `Call / WhatsApp: ${phone}`, "", "#fitness #noidagym #sector93 #gymreels #hinglish"].join("\n").slice(0, 2100);
}

/** A storage path nobody can guess, for the raw clip. */
export const clipPath = (id: string, ext: string) => `clips/${id}/raw.${/^(mp4|mov|m4v|webm)$/i.test(ext) ? ext.toLowerCase() : "mp4"}`;
export const finalPath = (id: string) => `clips/${id}/final.mp4`;
