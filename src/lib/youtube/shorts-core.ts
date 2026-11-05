// One YouTube Short from a script: its scenes (with the word-by-word caption reveal), its title,
// description and tags. Pure, so the timing and every word can be tested without ffmpeg or YouTube.
import type { PostBiz } from "@/lib/growth/daily-posts";
import { SHORTS, type Format, type Short } from "./shorts-bank";

export const MEDICAL_LINE = "General information, not medical advice.";
export const DOCTOR_LINE = "If you have a health condition, follow your doctor's advice.";
/** Seconds two scenes overlap in the transition. Short and snappy. */
export const FADE = 0.3;
/** The longest Short we make. YouTube allows 3 minutes, but under a minute gets watched to the end. */
export const MAX_SECONDS = 58;

export const KICKER: Record<Format, string> = {
  myth: "MYTH BUSTED",
  form: "FORM FIX",
  swap: "DESI SWAP",
  workout: "HOME WORKOUT",
  mistakes: "3 MISTAKES",
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
  | { kind: "end"; text: string; note: string | null };

/** A scene plus how it plays: `chunks` caption pieces that pop in one by one, then a hold. */
export type Timed = { scene: Scene; chunks: string[]; steps: number[] };

const words = (s: string) => s.split(/\s+/).filter(Boolean);
/** Seconds to read a line twice at a relaxed pace, clamped so nothing crawls. */
export const readTime = (s: string, min = 2.2, max = 5) => Math.round(Math.min(max, Math.max(min, 1.1 + words(s).length / 3.6)) * 10) / 10;

/** Splits a caption into pop-in pieces of one to three words (short words ride with the next). */
export function chunks(text: string): string[] {
  const out: string[] = [];
  let cur: string[] = [];
  for (const w of words(text)) {
    cur.push(w);
    const letters = cur.join(" ").length;
    if (cur.length >= 3 || (letters >= 7 && !/^(a|an|the|of|to|in|on|is|it|and|or|for|at|your|you|my|no|not|be)$/i.test(w))) {
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
    case "end":
      return scene.text;
    default:
      return scene.text;
  }
}

const POP = 0.18;

/** How long each reveal step shows: quick pops, then the rest of the read time as a hold. */
export function timing(scene: Scene, seconds: number): Timed {
  const parts = scene.kind === "plan" ? scene.items : chunks(captionOf(scene));
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
    case "myth":
      return [
        [{ kind: "card", label: "MYTH", tone: "red", text: s.myth }, readTime(s.myth)],
        [{ kind: "card", label: "FACT", tone: "green", text: s.fact }, readTime(s.fact, 2.6)],
        [{ kind: "card", label: "WHY IT MATTERS", tone: "gold", text: s.why }, readTime(s.why, 2.6)],
      ];
    case "form":
      return [
        [{ kind: "card", label: `${s.move.toUpperCase()} · DON'T`, tone: "red", text: s.wrong }, readTime(s.wrong)],
        [{ kind: "card", label: `${s.move.toUpperCase()} · DO`, tone: "green", text: s.right }, readTime(s.right, 2.6)],
        [{ kind: "card", label: "COACH'S CUE", tone: "gold", text: s.cue, sub: "Say it in your head on every rep." }, readTime(s.cue, 2.6)],
      ];
    case "swap":
      return [
        [{ kind: "swap", from: s.from, to: s.to }, readTime(`${s.from} ${s.to}`, 4.2, 5.5)],
        [{ kind: "card", label: "WHY IT WORKS", tone: "gold", text: s.why }, readTime(s.why, 3.4)],
      ];
    case "workout": {
      const plan: Scene = { kind: "plan", title: s.rounds > 1 ? `${s.rounds} ROUNDS` : "1 ROUND", items: s.moves.map(([m, sec]) => `${m} · ${sec}s`), foot: "Save it. Do it tonight." };
      const moves = s.moves.filter(([m]) => m !== "Rest");
      return [
        [plan, readTime(plan.items.join(" "), 3.4, 5.5)],
        ...moves.map(([name, sec], i): [Scene, number] => [{ kind: "move", n: i + 1, of: moves.length, name, seconds: sec }, readTime(name, 2, 2.8)]),
        [{ kind: "card", label: "COACH'S NOTE", tone: "gold", text: s.note }, readTime(s.note, 2.4)],
      ];
    }
    case "mistakes":
      return [
        ...s.items.map((t, i): [Scene, number] => [{ kind: "number", n: i + 1, of: 3, text: t }, readTime(t)]),
        [{ kind: "card", label: "THE FIX", tone: "green", text: s.fix }, readTime(s.fix, 2.8)],
      ];
    case "fact":
      return [
        [{ kind: "big", label: "DID YOU KNOW?", text: s.fact, sub: s.topic.toUpperCase() }, readTime(s.fact, 2.8, 3.5)],
        [{ kind: "card", label: "WHAT IT MEANS", tone: "gold", text: `${s.fact} ${s.detail}`, sub: `Source: ${s.source.name}` }, readTime(`${s.fact} ${s.detail}`, 3.6, 6)],
      ];
  }
}

/** The whole Short, scene by scene with its reveal timing. */
export function shortScenes(s: Short): Timed[] {
  const scenes: [Scene, number][] = [
    [{ kind: "hook", kicker: KICKER[s.format], text: s.hook }, readTime(s.hook, 2.2, 3)],
    ...body(s),
    [{ kind: "end", text: "Follow for a new tip every day", note: s.medical ? `${MEDICAL_LINE} ${DOCTOR_LINE}` : MEDICAL_LINE }, 3.5],
  ];
  return scenes.map(([scene, sec]) => timing(scene, sec));
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
    case "myth":
      return [`❌ Myth: ${s.myth}`, `✅ Fact: ${s.fact}`, s.why];
    case "form":
      return [`${s.move}`, `❌ Don't: ${s.wrong}`, `✅ Do: ${s.right}`, `Cue: ${s.cue}`];
    case "swap":
      return [`Swap: ${s.from} ➜ ${s.to}`, s.why];
    case "workout":
      return [`${s.rounds} round${s.rounds > 1 ? "s" : ""}:`, ...s.moves.map(([m, sec]) => `• ${m}: ${sec} seconds`), s.note];
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
    ...(s.format === "fact" ? [`Source: ${s.source.name}, ${s.source.url}`, ""] : []),
    `${MEDICAL_LINE}${s.medical ? ` ${DOCTOR_LINE}` : ""}`,
    "",
    `Train with ${biz.coach} at ${biz.name}, Sector 93 Noida.`,
    `Book a free trial: ${link}`,
    `Call or WhatsApp: ${biz.phone}`,
    ...(biz.address ? [biz.address] : []),
    "",
    ["#shorts", "#fitness", ...s.tags.slice(0, 3).map(hashtag)].join(" "),
  ];
  return lines.join("\n").replace(/[<>]/g, "").slice(0, 4900);
}

const BASE_TAGS = ["fitness", "fitness tips", "gym", "Royal Fitness Club", "Noida gym", "Sector 93 Noida", "Coach Aman Sharma", "home workout", "shorts"];

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
