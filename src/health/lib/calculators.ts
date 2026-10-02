/**
 * Pure formulas behind the standalone calculators. No UI, no I/O — every function is unit-tested.
 * Each block names its source; change a constant only with a citation.
 */
import { BMI_ASIAN, mifflinStJeor } from "./med-accuracy";

const DAY = 86_400_000;

/** Calendar-date arithmetic in UTC so results never shift with the viewer's timezone. */
export function parseDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 ? d : null;
}
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
export const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY);
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
export function todayUtc(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

// ───────────────────────── Units ─────────────────────────

export const cmFromFeetInches = (ft: number, inch: number) => (ft * 12 + inch) * 2.54;
export const kgFromLb = (lb: number) => lb * 0.45359237;
export function feetInchesFromCm(cm: number): { ft: number; inch: number } {
  const total = cm / 2.54;
  let ft = Math.floor(total / 12);
  let inch = Math.round(total - ft * 12);
  if (inch === 12) { ft += 1; inch = 0; }
  return { ft, inch };
}

// ───────────────────────── BMI ─────────────────────────
// WHO Asia-Pacific (2000) / Misra et al. 2009 consensus for Asian Indians; WHO 1995 international.

export type BmiBand = { label: string; tone: "ok" | "warn" | "alert" };

export function bmi(weightKg: number, heightCm: number): number {
  return weightKg > 0 && heightCm > 0 ? weightKg / (heightCm / 100) ** 2 : NaN;
}

export function bmiAsian(b: number): BmiBand {
  if (b < 18.5) return { label: "Underweight", tone: "warn" };
  if (b <= BMI_ASIAN.healthyMax) return { label: "Healthy", tone: "ok" };
  if (b <= BMI_ASIAN.overweightMax) return { label: "Overweight", tone: "warn" };
  if (b < 30) return { label: "Obese (class I)", tone: "alert" };
  return { label: "Obese (class II+)", tone: "alert" };
}

export function bmiWho(b: number): BmiBand {
  if (b < 18.5) return { label: "Underweight", tone: "warn" };
  if (b < 25) return { label: "Normal", tone: "ok" };
  if (b < 30) return { label: "Overweight", tone: "warn" };
  if (b < 35) return { label: "Obese class I", tone: "alert" };
  if (b < 40) return { label: "Obese class II", tone: "alert" };
  return { label: "Obese class III", tone: "alert" };
}

/** Weight range for a BMI band at this height (kg). */
export const weightForBmi = (b: number, heightCm: number) => b * (heightCm / 100) ** 2;

export function healthyRange(heightCm: number, scale: "asian" | "who" = "asian") {
  const max = scale === "asian" ? BMI_ASIAN.healthyMax : 24.9;
  return { min: weightForBmi(18.5, heightCm), max: weightForBmi(max, heightCm) };
}

/** kg to lose (+) or gain (−) to reach the nearest edge of the Asian healthy range; 0 if inside. */
export function kgToHealthy(weightKg: number, heightCm: number): number {
  const r = healthyRange(heightCm);
  if (weightKg > r.max) return weightKg - r.max;
  if (weightKg < r.min) return weightKg - r.min;
  return 0;
}

// ─────────────────── Pregnancy due date ───────────────────
// Naegele's rule (LMP + 280 days) adjusted for cycle length; conception + 266 days;
// IVF: day-5 transfer + 261, day-3 transfer + 263 (ACOG Committee Opinion 700).

export type DueDateMethod = "lmp" | "conception" | "ivf3" | "ivf5";

export function dueDate(method: DueDateMethod, date: Date, cycleDays = 28): Date {
  switch (method) {
    case "lmp": return addDays(date, 280 + (cycleDays - 28));
    case "conception": return addDays(date, 266);
    case "ivf3": return addDays(date, 263);
    case "ivf5": return addDays(date, 261);
  }
}

/** Gestational age on `on`, counted from the due date (so all methods agree). */
export function gestationalAge(due: Date, on: Date): { days: number; weeks: number; rem: number; trimester: 1 | 2 | 3; daysToGo: number } {
  const days = 280 - daysBetween(on, due);
  const weeks = Math.floor(days / 7);
  return { days, weeks, rem: days - weeks * 7, trimester: days < 14 * 7 ? 1 : days < 28 * 7 ? 2 : 3, daysToGo: daysBetween(on, due) };
}

/** Standard antenatal milestones (FOGSI / MoHFW antenatal care schedule; windows in completed weeks). */
export const PREGNANCY_MILESTONES: { from: number; to: number; title: string; note: string }[] = [
  { from: 6, to: 9, title: "Dating / viability scan", note: "Confirms the pregnancy is in the uterus, the heartbeat and the most accurate due date." },
  { from: 11, to: 13.86, title: "NT scan + first-trimester screening", note: "Nuchal translucency with double marker blood test, between 11w0d and 13w6d." },
  { from: 18, to: 22, title: "Anomaly (level II) scan", note: "Detailed check of the baby's organs. In India, sex determination is illegal under the PCPNDT Act." },
  { from: 24, to: 28, title: "Glucose test (OGTT)", note: "75 g glucose test for gestational diabetes; Indian guidelines also test at the first visit." },
  { from: 28, to: 32, title: "Growth scan + anaemia check", note: "Baby's growth, fluid and placenta; repeat haemoglobin." },
  { from: 36, to: 40, title: "Birth planning", note: "Weekly visits, baby's position and your birth plan." },
];

export function milestoneDates(due: Date) {
  const lmp = addDays(due, -280);
  return PREGNANCY_MILESTONES.map((m) => ({ ...m, start: addDays(lmp, Math.round(m.from * 7)), end: addDays(lmp, Math.round(m.to * 7)) }));
}

// ─────────────────── Period & ovulation ───────────────────
// Ovulation ≈ next period − luteal phase (default 14 days); fertile window = 5 days before
// ovulation to 1 day after (Wilcox et al., NEJM 1995).

export type Cycle = { periodStart: Date; periodEnd: Date; fertileStart: Date; fertileEnd: Date; ovulation: Date; nextPeriod: Date };

export function predictCycles(lastPeriod: Date, cycleDays = 28, periodDays = 5, lutealDays = 14, count = 3): Cycle[] {
  return Array.from({ length: count }, (_, i) => {
    const start = addDays(lastPeriod, i * cycleDays);
    const next = addDays(start, cycleDays);
    const ovulation = addDays(next, -lutealDays);
    return { periodStart: start, periodEnd: addDays(start, periodDays - 1), ovulation, fertileStart: addDays(ovulation, -5), fertileEnd: addDays(ovulation, 1), nextPeriod: next };
  });
}

/** Cycles shorter than 21 or longer than 35 days are worth discussing with a doctor (ACOG). */
export const cycleIsTypical = (cycleDays: number) => cycleDays >= 21 && cycleDays <= 35;

// ─────────────────── Body fat (US Navy) ───────────────────
// Hodgdon & Beckett 1984, metric form. Categories: American Council on Exercise.

export function bodyFatNavy(sex: "male" | "female", heightCm: number, neckCm: number, waistCm: number, hipCm = 0): number {
  if (sex === "male") {
    if (waistCm <= neckCm) return NaN;
    return 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
  }
  if (waistCm + hipCm <= neckCm) return NaN;
  return 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.221 * Math.log10(heightCm)) - 450;
}

export function bodyFatCategory(sex: "male" | "female", pct: number): BmiBand {
  // ACE: men 2–5 essential, 6–13 athletes, 14–17 fitness, 18–24 average, ≥25 obese;
  //      women 10–13, 14–20, 21–24, 25–31, ≥32.
  const [min, ath, fit, avg, obese] = sex === "male" ? [2, 6, 14, 18, 25] : [10, 14, 21, 25, 32];
  if (pct < min) return { label: "Below essential fat — see a doctor", tone: "alert" };
  if (pct < ath) return { label: "Essential fat", tone: "warn" };
  if (pct < fit) return { label: "Athletes", tone: "ok" };
  if (pct < avg) return { label: "Fitness", tone: "ok" };
  if (pct < obese) return { label: "Average", tone: "warn" };
  return { label: "Obese range", tone: "alert" };
}

// ─────────────────── Calories & macros ───────────────────
// Mifflin-St Jeor × activity. ~7,700 kcal per kg of body fat → 0.5 kg/week ≈ 550 kcal/day.
// Protein per ISSN position stand; fat 25% of energy (ICMR-NIN 2020: 20–30%).

export type Goal = "lose-0.5" | "lose-0.25" | "maintain" | "gain-0.25";
export const GOAL_DELTA: Record<Goal, number> = { "lose-0.5": -550, "lose-0.25": -275, maintain: 0, "gain-0.25": 275 };
const PROTEIN_G_PER_KG: Record<Goal, number> = { "lose-0.5": 1.6, "lose-0.25": 1.4, maintain: 1.2, "gain-0.25": 1.6 };

export function caloriePlan(p: { weightKg: number; heightCm: number; age: number; sex: "male" | "female"; activity: number; goal: Goal }) {
  const bmr = mifflinStJeor(p.weightKg, p.heightCm, p.age, p.sex);
  const tdee = bmr * p.activity;
  const floor = p.sex === "male" ? 1500 : 1200;
  const raw = tdee + GOAL_DELTA[p.goal];
  const target = Math.round(Math.max(floor, raw));
  const proteinG = Math.round(p.weightKg * PROTEIN_G_PER_KG[p.goal]);
  const fatG = Math.round((target * 0.25) / 9);
  const carbG = Math.max(0, Math.round((target - proteinG * 4 - fatG * 9) / 4));
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), target, floored: raw < floor, floor, proteinG, fatG, carbG };
}
