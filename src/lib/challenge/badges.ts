// Profile badges, worked out from finished attempts. Pure, no I/O.
import { LEVELS, QUESTIONS_PER_ATTEMPT, levelName, passed, tierFor, type LevelId, type Tier } from "./levels";

export type Badge = { id: string; label: string; tier?: Tier };

const RANK: Record<Tier, number> = { gold: 3, silver: 2, bronze: 1 };
const TIER_LABEL: Record<Tier, string> = { gold: "Gold", silver: "Silver", bronze: "Bronze" };

function nextMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
}

export function badgesFor(attempts: { level: LevelId; correct: number; month: string }[]): Badge[] {
  const out: Badge[] = [];
  for (const l of LEVELS) {
    let best: Tier | null = null;
    for (const a of attempts.filter((x) => x.level === l.id)) {
      const t = tierFor(a.correct);
      if (t && (!best || RANK[t] > RANK[best])) best = t;
    }
    if (best) out.push({ id: `${l.id}-${best}`, label: `${levelName(l.id)} ${TIER_LABEL[best]}`, tier: best });
  }
  if (attempts.some((a) => a.correct === QUESTIONS_PER_ATTEMPT)) out.push({ id: "perfect", label: "Perfect score" });
  const months = [...new Set(attempts.filter((a) => passed(a.correct)).map((a) => a.month))].sort();
  let run = 0;
  let longest = 0;
  for (let i = 0; i < months.length; i++) {
    run = i > 0 && nextMonth(months[i - 1]) === months[i] ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  if (longest >= 3) out.push({ id: "streak-3", label: "3 months in a row" });
  return out;
}
