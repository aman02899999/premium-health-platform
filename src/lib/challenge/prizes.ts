// Prize ladder and monthly allocation. Pure, no I/O.
// Worth uses the gym's STANDARD prices (src/lib/content/defaults.ts: Monthly ₹2,000, Quarterly
// ₹5,000) and the diet plan's regular price shown in src/lib/offers.ts (₹1,999). Caps are the
// owner's "smaller cap to start" (28 Nov 2026); Beginner pass caps are the builder's call.
import { tierFor, type LevelId, type Tier } from "./levels";

export type PrizeId = "gym-3m" | "gym-1m" | "gym-15d" | "diet-1m" | "pass-7d" | "pass-3d";

export const PRIZES: Record<PrizeId, { name: string; worth: number | null; cap: number; gym: boolean; extra?: string }> = {
  "gym-3m": { name: "3 months free gym membership", worth: 5000, cap: 1, gym: true },
  "gym-1m": { name: "1 month free gym membership", worth: 2000, cap: 3, gym: true },
  "gym-15d": { name: "15 days free gym", worth: null, cap: 5, gym: true, extra: "plus a free diet consultation" },
  "diet-1m": { name: "1-month online diet plan", worth: 1999, cap: 15, gym: false },
  "pass-7d": { name: "7-day free gym pass", worth: null, cap: 10, gym: true },
  "pass-3d": { name: "3-day free gym pass", worth: null, cap: 20, gym: true, extra: "plus a free diet consultation" },
};

/** Most valuable first: allocation hands these out in this order. */
export const PRIZE_ORDER: PrizeId[] = ["gym-3m", "gym-1m", "gym-15d", "diet-1m", "pass-7d", "pass-3d"];

const LADDER: Record<LevelId, Record<Tier, PrizeId | null>> = {
  advance: { gold: "gym-3m", silver: "gym-1m", bronze: "diet-1m" },
  intermediate: { gold: "gym-1m", silver: "gym-15d", bronze: "diet-1m" },
  beginner: { gold: "pass-7d", silver: "pass-3d", bronze: null },
};

export const prizeFor = (level: LevelId, tier: Tier): PrizeId | null => LADDER[level][tier];

export type Candidate = { userId: string; attemptId: string; level: LevelId; correct: number; totalMs: number; local: boolean };
export type Award = { userId: string; attemptId: string; prize: PrizeId; level: LevelId; correct: number };

/** Every prize this attempt qualifies for (its own tier and every lower tier of the same level). People outside NCR get the diet plan instead of gym time. */
function qualifies(c: Candidate): PrizeId[] {
  const tier = tierFor(c.correct);
  if (!tier) return [];
  const tiers: Tier[] = tier === "gold" ? ["gold", "silver", "bronze"] : tier === "silver" ? ["silver", "bronze"] : ["bronze"];
  const out = new Set<PrizeId>();
  for (const t of tiers) {
    const p = LADDER[c.level][t];
    if (!p) continue;
    out.add(PRIZES[p].gym && !c.local ? "diet-1m" : p);
  }
  return [...out];
}

/**
 * Hands out the month's prizes: most valuable prize first, best score first, fastest total time
 * on a tie. Someone who misses a prize because it ran out falls through to the next prize they
 * qualify for. One prize per person.
 */
export function allocatePrizes(candidates: Candidate[], caps: Record<PrizeId, number> = Object.fromEntries(PRIZE_ORDER.map((p) => [p, PRIZES[p].cap])) as Record<PrizeId, number>): Award[] {
  const awarded = new Set<string>();
  const out: Award[] = [];
  for (const prize of PRIZE_ORDER) {
    const pool = candidates
      .filter((c) => !awarded.has(c.userId) && qualifies(c).includes(prize))
      .sort((a, b) => b.correct - a.correct || a.totalMs - b.totalMs || a.attemptId.localeCompare(b.attemptId));
    for (const c of pool) {
      if (out.filter((a) => a.prize === prize).length >= caps[prize]) break;
      if (awarded.has(c.userId)) continue;
      awarded.add(c.userId);
      out.push({ userId: c.userId, attemptId: c.attemptId, prize, level: c.level, correct: c.correct });
    }
  }
  return out;
}

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
