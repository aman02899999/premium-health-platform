// Royal Knowledge Challenge: the rules every part of the quiz shares. Pure, no I/O.

export type LevelId = "beginner" | "intermediate" | "advance";
export type Tier = "gold" | "silver" | "bronze";

export const QUESTIONS_PER_ATTEMPT = 20;
/** Seconds per question; the server allows a little extra for a slow network. */
export const SECONDS_PER_QUESTION = 30;
export const GRACE_SECONDS = 3;

export const LEVELS: { id: LevelId; name: string; hindi: string; blurb: string; unlockAfter: LevelId | null }[] = [
  { id: "beginner", name: "Beginner", hindi: "Shuruaat", blurb: "Gym basics, desi diet, safety. Sabke liye.", unlockAfter: null },
  { id: "intermediate", name: "Intermediate", hindi: "Beech ka", blurb: "Training splits, protein, recovery. Beginner pass karne ke baad.", unlockAfter: "beginner" },
  { id: "advance", name: "Advance", hindi: "Expert", blurb: "Programming, nutrition science, injuries. Intermediate pass karne ke baad.", unlockAfter: "intermediate" },
];

export const isLevel = (v: unknown): v is LevelId => v === "beginner" || v === "intermediate" || v === "advance";
export const levelName = (id: LevelId) => LEVELS.find((l) => l.id === id)!.name;

/** Whole percent of the attempt's questions answered right. */
export const scorePct = (correct: number, total = QUESTIONS_PER_ATTEMPT) => Math.round((correct / total) * 100);

/** 90%+ gold, 80%+ silver, 70%+ bronze (pass), else null. Compared exactly, not after rounding. */
export function tierFor(correct: number, total = QUESTIONS_PER_ATTEMPT): Tier | null {
  if (correct * 100 >= 90 * total) return "gold";
  if (correct * 100 >= 80 * total) return "silver";
  if (correct * 100 >= 70 * total) return "bronze";
  return null;
}

export const passed = (correct: number, total = QUESTIONS_PER_ATTEMPT) => tierFor(correct, total) !== null;

/** A level opens once the level below has been passed in any month. */
export function canStart(level: LevelId, history: { level: LevelId; correct: number }[]): boolean {
  const need = LEVELS.find((l) => l.id === level)!.unlockAfter;
  return !need || history.some((h) => h.level === need && passed(h.correct));
}

/** "YYYY-MM" in India time: the quiz month. */
export function monthOf(now = new Date()): string {
  return new Date(now.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 7);
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** First name + surname initial, e.g. "Rahul K." Used on the leaderboard and certificates. */
export function publicName(first: string, lastInitial: string): string {
  const f = first.trim().split(/\s+/)[0] ?? "";
  const i = lastInitial.trim().charAt(0).toUpperCase();
  return i ? `${f} ${i}.` : f;
}

/** Without a retry, a level can be taken again this many days after the last attempt started (owner, 28 Nov). */
export const RETRY_DAYS = 30;
/** Most retries one person can earn from referrals in a calendar month. */
export const REFERRAL_RETRY_CAP = 3;

/**
 * Whether a level can be started now: free (never tried, or the last try started 30+ days ago),
 * with a referral retry, or not yet (and when it opens again for free).
 */
export function attemptAccess(lastStartedAt: number | null, retries: number, now: number): { via: "free" | "retry" | null; nextFreeAt: number | null } {
  const nextFreeAt = lastStartedAt === null ? null : lastStartedAt + RETRY_DAYS * 86_400_000;
  if (nextFreeAt === null || now >= nextFreeAt) return { via: "free", nextFreeAt: null };
  return { via: retries > 0 ? "retry" : null, nextFreeAt };
}

/** Rules a referral must pass before it earns the referrer a retry. Pure; the store supplies the facts. */
export function referralVerdict(f: { selfReferral: boolean; friendFinishedBeginner: boolean; sameNetwork: boolean; referrerQualifiedThisMonth: number }): "qualified" | "pending" | "rejected-self" | "rejected-network" | "capped" {
  if (f.selfReferral) return "rejected-self";
  if (!f.friendFinishedBeginner) return "pending";
  if (f.sameNetwork) return "rejected-network";
  if (f.referrerQualifiedThisMonth >= REFERRAL_RETRY_CAP) return "capped";
  return "qualified";
}
