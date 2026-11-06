// One YouTube Short from a script: its scenes (with the word-by-word caption reveal), its title,
// description and tags. Pure, so the timing and every word can be tested without ffmpeg or YouTube.
import type { PostBiz } from "@/lib/growth/daily-posts";
import { SITE_URL } from "@/lib/site";
import { SHORTS, type Format, type Short, type Verdict } from "./shorts-bank";
import { EXTRAS, type Extra } from "./shorts-extra";

export const MEDICAL_LINE = "Ye general jaankari hai, medical advice nahi.";
export const DOCTOR_LINE = "Koi health problem hai toh apne doctor ki salah maano.";
/** The site as people type it, for the closing screen: royalfitnesclub.in */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\/(www\.)?/, "");
/** Seconds two scenes overlap in the transition. Short and snappy. */
export const FADE = 0.3;
/** The longest Short we make. YouTube counts vertical videos up to 3 minutes as Shorts. */
export const MAX_SECONDS = 90;

export const KICKER: Record<Format, string> = {
  viral: "VIRAL CLAIM · SACH YA JHOOTH?",
  trend: "TRENDING · EXPLAINED",
  myth: "MYTH BUSTED",
  form: "FORM FIX",
  swap: "DESI SWAP",
  workout: "GHAR PE WORKOUT",
  mistakes: "3 GALTIYAN",
  fact: "QUICK FACT",
};

export type Tone = "red" | "green" | "gold" | "plain";
export type Scene =
  | { kind: "hook"; kicker: string; text: string }
  | { kind: "card"; label: string; tone: Tone; text: string; sub?: string }
  | { kind: "swap"; from: string; to: string }
  | { kind: "number"; n: number; of: number; text: string }
  | { kind: "move"; n: number; of: number; name: string; seconds: number }
  | { kind: "plan"; title: string; items: string[]; foot: string }
  | { kind: "big"; label: string; text: string; sub: string; foot?: string }
  | { kind: "verdict"; verdict: Verdict; text: string }
  | { kind: "subscribe"; text: string }
  | { kind: "gym"; lines: string[] }
  | { kind: "ask"; text: string }
  | { kind: "end"; text: string; note: string | null };

/** A scene plus how it plays: `chunks` caption pieces that pop in one by one, then a hold. */
export type Timed = { scene: Scene; chunks: string[]; steps: number[] };

const words = (s: string) => s.split(/\s+/).filter(Boolean);
/** Seconds to read a line twice at a relaxed pace, clamped so nothing crawls. */
export const readTime = (s: string, min = 2.6, max = 6) => Math.round(Math.min(max, Math.max(min, 1.3 + words(s).length / 2.8)) * 10) / 10;

/** Splits a caption into pop-in pieces of one to three words (short words ride with the next). */
export function chunks(text: string): string[] {
  const out: string[] = [];
  let cur: string[] = [];
  for (const w of words(text)) {
    cur.push(w);
    const letters = cur.join(" ").length;
    if (cur.length >= 3 || (letters >= 7 && !/^(a|an|the|of|to|in|on|is|it|and|or|for|at|your|you|my|no|not|be|hai|ho|ka|ki|ke|ko|se|me|mein|aur|ya|toh|bhi|na|pe|par|jo|ek)$/i.test(w))) {
      out.push(cur.join(" "));
      cur = [];
    }
  }
  if (cur.length) out.push(cur.join(" "));
  return out;
}

/** The text a scene reveals word by word (the other text on it is shown from the start). */
export function captionOf(scene: Scene): string {
  switch (scene.kind) {
    case "swap":
      return scene.to;
    case "move":
      return scene.name;
    case "plan":
      return scene.items.join(" ");
    case "gym":
      return scene.lines.join(" ");
    case "end":
      return scene.text;
    default:
      return scene.text;
  }
}

const POP = 0.18;

/** How long each reveal step shows: quick pops, then the rest of the read time as a hold. */
export function timing(scene: Scene, seconds: number): Timed {
  const parts = scene.kind === "plan" ? scene.items : scene.kind === "gym" ? scene.lines : chunks(captionOf(scene));
  // The hook starts with its first words already on screen: no blank first frame on the feed.
  const pops = Math.max(0, parts.length - 1);
  const pop = Math.min(POP, (seconds * 0.5) / Math.max(1, pops));
  const steps = Array.from({ length: parts.length }, (_, i) => (i < parts.length - 1 ? pop : 0));
  steps[steps.length - 1] = Math.round((seconds - pop * pops) * 100) / 100;
  return { scene, chunks: parts, steps: steps.map((s) => Math.round(s * 100) / 100) };
}

const sceneSeconds = (t: Timed) => t.steps.reduce((a, b) => a + b, 0);
export const shortSeconds = (timed: Timed[]) => Math.round((timed.reduce((a, t) => a + sceneSeconds(t), 0) - FADE * (timed.length - 1)) * 10) / 10;

function body(s: Short): [Scene, number][] {
  switch (s.format) {
    case "viral":
      return [
        [{ kind: "card", label: "VIRAL CLAIM", tone: "plain", text: s.claim, sub: "Reels aur WhatsApp pe ye bahut chal raha hai." }, readTime(s.claim)],
        [{ kind: "verdict", verdict: s.verdict, text: s.truth }, readTime(s.truth, 3.4)],
        [{ kind: "card", label: "ASLI BAAT", tone: "gold", text: s.why }, readTime(s.why, 2.8)],
      ];
    case "trend":
      return [
        [{ kind: "card", label: `${s.trend.toUpperCase()} · KYA HAI?`, tone: "plain", text: s.what }, readTime(s.what)],
        [{ kind: "card", label: "ACCHI BAAT", tone: "green", text: s.good }, readTime(s.good, 2.8)],
        [{ kind: "card", label: "DHYAAN RAKHO", tone: "red", text: s.careful }, readTime(s.careful, 3)],
      ];
    case "myth":
      return [
        [{ kind: "card", label: "MYTH", tone: "red", text: s.myth }, readTime(s.myth)],
        [{ kind: "card", label: "SACH", tone: "green", text: s.fact }, readTime(s.fact, 2.6)],
        [{ kind: "card", label: "KYUN ZAROORI HAI", tone: "gold", text: s.why }, readTime(s.why, 2.6)],
      ];
    case "form":
      return [
        [{ kind: "card", label: `${s.move.toUpperCase()} · GALAT`, tone: "red", text: s.wrong }, readTime(s.wrong)],
        [{ kind: "card", label: `${s.move.toUpperCase()} · SAHI`, tone: "green", text: s.right }, readTime(s.right, 2.6)],
        [{ kind: "card", label: "COACH'S CUE", tone: "gold", text: s.cue, sub: "Har rep pe mann mein bolo." }, readTime(s.cue, 2.6)],
      ];
    case "swap":
      return [
        [{ kind: "swap", from: s.from, to: s.to }, readTime(`${s.from} ${s.to}`, 4.2, 5.5)],
        [{ kind: "card", label: "KYUN KAAM KARTA HAI", tone: "gold", text: s.why }, readTime(s.why, 3.4)],
      ];
    case "workout": {
      const plan: Scene = { kind: "plan", title: s.rounds > 1 ? `${s.rounds} ROUNDS` : "1 ROUND", items: s.moves.map(([m, sec]) => `${m} · ${sec}s`), foot: "Save karo. Aaj raat karo." };
      const moves = s.moves.filter(([m]) => m !== "Rest");
      return [
        [plan, readTime(plan.items.join(" "), 3.4, 5.5)],
        ...moves.map(([name, sec], i): [Scene, number] => [{ kind: "move", n: i + 1, of: moves.length, name, seconds: sec }, readTime(name, 2, 2.8)]),
        [{ kind: "card", label: "COACH KI BAAT", tone: "gold", text: s.note }, readTime(s.note, 2.4)],
      ];
    }
    case "mistakes":
      return [
        ...s.items.map((t, i): [Scene, number] => [{ kind: "number", n: i + 1, of: 3, text: t }, readTime(t)]),
        [{ kind: "card", label: "FIX KYA HAI", tone: "green", text: s.fix }, readTime(s.fix, 2.8)],
      ];
    case "fact":
      return [
        [{ kind: "big", label: "KYA AAP JAANTE HO?", text: s.fact, sub: s.topic.toUpperCase() }, readTime(s.fact, 2.8, 3.5)],
        [{ kind: "card", label: "MATLAB KYA HUA", tone: "gold", text: `${s.fact} ${s.detail}`, sub: `Source: ${s.source.name}` }, readTime(`${s.fact} ${s.detail}`, 3.6, 6)],
      ];
  }
}

/** The gym's facts for the "train with us" screen (the same as the site's own business details). */
export const GYM_LINES = ["Royal Fitness Club, Sector 93 Noida", "Coach Aman Sharma · since 2019", "Mon–Sat · 5:30–11 AM & 4–10 PM", `Free trial: ${SITE_HOST}`];

/** The one-line takeaway the recap opens with. */
function keyLine(s: Short): string {
  switch (s.format) {
    case "viral":
      return `${s.verdict}: ${s.truth}`;
    case "trend":
      return s.careful;
    case "myth":
    case "fact":
      return s.fact;
    case "form":
      return s.right;
    case "swap":
      return `${s.from} ➜ ${s.to}`;
    case "workout":
      return `${s.rounds} round${s.rounds > 1 ? "s" : ""}: ${s.moves.filter(([m]) => m !== "Rest").map(([m]) => m.replace(/\s*\(.*\)|, each.*$/g, "")).join(", ")}`;
    case "mistakes":
      return s.fix;
  }
}

export const extraFor = (s: Short): Extra => {
  const e = EXTRAS[s.id];
  if (!e) throw new Error(`No tips written for ${s.id}`);
  return e;
};

/** Every Short runs at least this long (the owner's rule), so the holds stretch to reach it. */
export const MIN_SECONDS = 64;
const MAX_STRETCH = 1.8;

/** The whole Short, scene by scene with its reveal timing. */
export function shortScenes(s: Short): Timed[] {
  const x = extraFor(s);
  const scenes: [Scene, number][] = [
    [{ kind: "hook", kicker: KICKER[s.format], text: s.hook }, readTime(s.hook, 2.4, 3.2)],
    ...body(s),
    ...x.tips.map((t, i): [Scene, number] => [{ kind: "card", label: `COACH KA TIP ${i + 1}/2`, tone: i ? "gold" : "green", text: t }, readTime(t, 3.4)]),
    [{ kind: "plan", title: "QUICK RECAP", items: [keyLine(s), ...x.tips], foot: "Save kar lo, bhoolna mat." }, readTime([keyLine(s), ...x.tips].join(" "), 5, 7)],
    [{ kind: "gym", lines: GYM_LINES }, 6],
    [{ kind: "ask", text: x.ask }, readTime(x.ask, 4, 5.5)],
    [{ kind: "subscribe", text: "Video kaam ki lagi? LIKE karo aur SUBSCRIBE karo" }, 4],
    [{ kind: "end", text: "Free trial book karo website pe", note: s.medical ? `${MEDICAL_LINE} ${DOCTOR_LINE}` : MEDICAL_LINE }, 4.5],
  ];
  let timed = scenes.map(([scene, sec]) => timing(scene, sec));
  // Too short? Lengthen every hold evenly (never the hook, which has to grab in the first seconds).
  const total = shortSeconds(timed);
  if (total < MIN_SECONDS) {
    const holds = timed.slice(1).reduce((a, t) => a + t.steps.at(-1)!, 0);
    const k = Math.min(MAX_STRETCH, 1 + (MIN_SECONDS - total) / holds);
    timed = timed.map((t, i) => (i === 0 ? t : { ...t, steps: [...t.steps.slice(0, -1), Math.round(t.steps.at(-1)! * k * 100) / 100] }));
  }
  return timed;
}

// ---------- Title, description, tags ----------

const clean = (s: string) => s.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();

/** Title: the hook, then #Shorts, inside YouTube's 100 characters. */
export function shortTitle(s: Short): string {
  const tail = " #shorts";
  const hook = clean(s.hook);
  return (hook.length + tail.length <= 100 ? hook : `${hook.slice(0, 100 - tail.length - 1).trimEnd()}…`) + tail;
}

function summary(s: Short): string[] {
  switch (s.format) {
    case "viral":
      return [`📢 Viral claim: ${s.claim}`, `${s.verdict === "SACH" ? "✅" : s.verdict === "JHOOTH" ? "❌" : "⚖️"} ${s.verdict}: ${s.truth}`, s.why];
    case "trend":
      return [`🔥 ${s.trend}: ${s.what}`, `✅ Acchi baat: ${s.good}`, `⚠️ Dhyaan rakho: ${s.careful}`];
    case "myth":
      return [`❌ Myth: ${s.myth}`, `✅ Sach: ${s.fact}`, s.why];
    case "form":
      return [`${s.move}`, `❌ Galat: ${s.wrong}`, `✅ Sahi: ${s.right}`, `Cue: ${s.cue}`];
    case "swap":
      return [`Swap: ${s.from} ➜ ${s.to}`, s.why];
    case "workout":
      return [`${s.rounds} round${s.rounds > 1 ? "s" : ""}:`, ...s.moves.map(([m, sec]) => `• ${m}: ${sec} second`), s.note];
    case "mistakes":
      return [...s.items.map((t, i) => `${i + 1}. ${t}`), `Fix: ${s.fix}`];
    case "fact":
      return [`${s.fact} ${s.detail}`];
  }
}

const hashtag = (t: string) => `#${t.replace(/[^a-z0-9]/gi, "").toLowerCase()}`;

export function shortDescription(s: Short, biz: PostBiz): string {
  const site = biz.siteUrl.replace(/\/$/, "");
  const link = `${site}/?utm_source=youtube&utm_medium=shorts&utm_campaign=${s.id}`;
  const lines = [
    clean(s.hook),
    "",
    ...summary(s),
    "",
    "Coach ke tips:",
    ...extraFor(s).tips.map((t) => `• ${t}`),
    "",
    `💬 ${extraFor(s).ask}`,
    "",
    ...(s.format === "fact" ? [`Source: ${s.source.name}, ${s.source.url}`, ""] : []),
    `${MEDICAL_LINE}${s.medical ? ` ${DOCTOR_LINE}` : ""}`,
    "",
    "👍 Video kaam ki lagi? Like karo aur channel SUBSCRIBE karo, roz nayi fitness tip ke liye.",
    "",
    `${biz.coach} ke saath ${biz.name}, Sector 93 Noida mein train karo.`,
    `Free trial book karo: ${link}`,
    `Call ya WhatsApp: ${biz.phone}`,
    ...(biz.address ? [biz.address] : []),
    "",
    ["#shorts", "#fitness", ...s.tags.slice(0, 3).map(hashtag)].join(" "),
  ];
  return lines.join("\n").replace(/[<>]/g, "").slice(0, 4900);
}

const BASE_TAGS = ["fitness", "fitness tips", "fitness tips in hindi", "hinglish", "gym", "Royal Fitness Club", "Noida gym", "Sector 93 Noida", "Coach Aman Sharma", "home workout", "shorts"];

/** Tags: the script's own first, then the channel's; YouTube counts at most 500 characters. */
export function shortTags(s: Short): string[] {
  const out: string[] = [];
  let len = 0;
  for (const t of [...s.tags, s.topic, ...BASE_TAGS].map((t) => clean(t).replace(/,/g, ""))) {
    if (!t || out.some((o) => o.toLowerCase() === t.toLowerCase())) continue;
    const cost = t.length + (t.includes(" ") ? 2 : 0) + 1;
    if (len + cost > 450) break;
    out.push(t);
    len += cost;
  }
  return out;
}

/** The next script to upload: the first one not already uploaded or uploading. Null when the bank is used up. */
export function nextShort(used: Iterable<string>, bank: Short[] = SHORTS): Short | null {
  const done = new Set(used);
  return bank.find((s) => !done.has(s.id)) ?? null;
}

export const shortById = (id: string) => SHORTS.find((s) => s.id === id) ?? null;
