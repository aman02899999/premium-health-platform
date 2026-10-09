/**
 * Diet Pro: the weekly programme that ties the diet chart to training — which days are
 * workout days, the pre- and post-workout meals from that day's chart, steps, cardio,
 * heart-rate zones, a progress projection, a grocery list and a habit tracker.
 * Pure functions, unit-tested.
 */
import type { Targets } from "./engine";
import type { TrainingDay } from "./guidance";
import { clock, mealMinutes, toMinutes } from "./household";
import type { PlannedDay, PlannedMeal } from "./meals";
import type { ClientProfile, Goal } from "./types";

/** Training days spread across the 7-day chart so no muscle group trains on back-to-back days without rest. */
export const TRAINING_SLOTS: Record<number, number[]> = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5] };

/** Daily step target. Paluch et al., Lancet Public Health 2022: mortality benefit levels off at ~8,000–10,000 steps under 60 y, 6,000–8,000 over 60. */
export function stepTarget(goal: Goal, age: number): number {
  const base: Record<Goal, number> = { "fat-loss": 10000, recomp: 9000, maintain: 8000, "lean-gain": 7000, gain: 7000 };
  return age >= 60 ? Math.min(base[goal], 8000) : base[goal];
}

const CARDIO: Record<Goal, { train: string; rest: string }> = {
  "fat-loss": { train: "Finisher in the workout (15–20 min)", rest: "30–40 min brisk walk or cycling, Zone 2" },
  recomp: { train: "10 min easy cool-down walk", rest: "25–30 min brisk walk, Zone 2" },
  maintain: { train: "10 min easy cool-down", rest: "30 min brisk walk, cycling or a sport" },
  "lean-gain": { train: "5–10 min warm-up only", rest: "20 min easy walk (heart health; keep it light)" },
  gain: { train: "5–10 min warm-up only", rest: "20 min easy walk (heart health; keep it light)" },
};

/** Why the training is set up this way for the client's goal. */
export function principles(goal: Goal): string[] {
  const common = "Warm up 5–10 min. Add a rep or a little weight when every set reaches the top of the rep range with good form (progressive overload).";
  const byGoal: Record<Goal, string[]> = {
    "fat-loss": [
      "Keep lifting with real effort: strength training during a calorie deficit protects muscle, so the weight you lose is mostly fat.",
      "Steps and the rest-day walks burn the extra energy; the deficit in your diet chart does the rest. Don't add extra cardio on your own — eat the full chart.",
    ],
    recomp: [
      "Small deficit + hard training + high protein: you lose fat and build muscle together, so the scale moves slowly while the waist drops.",
      "Judge progress by waist, photos and strength every 2 weeks, not the daily weight.",
    ],
    maintain: ["Train to get fitter and stronger while your weight stays steady. Mix strength days with cardio you enjoy."],
    "lean-gain": [
      "Your small calorie surplus only becomes muscle when you train hard: aim to beat last week's reps or weight.",
      "Keep cardio light so the surplus goes to recovery and growth. Eat every meal on rest days too.",
    ],
    gain: [
      "Your calorie surplus only becomes muscle when you train hard: aim to beat last week's reps or weight.",
      "Keep cardio light so the surplus goes to recovery and growth. Eat every meal on rest days too.",
    ],
  };
  return [...byGoal[goal], common, "Sleep 7–9 hours: muscle is repaired and appetite is controlled while you sleep."];
}

export type MealRef = { label: string; time: string; dish: string; kcal: number; p: number; c: number };
export type ScheduleDay = {
  day: number;
  session: TrainingDay | null;
  /** "Upper Body" or "Rest / active recovery". */
  title: string;
  cardio: string;
  steps: number;
  /** Meal from this day's chart eaten 60–240 min before training. */
  pre: MealRef | null;
  /** First meal from this day's chart within 3 hours after training starts. */
  post: MealRef | null;
  kcal: number;
  protein: number;
};

const ref = (m: PlannedMeal, wake: string | undefined, meals: number): MealRef => ({
  label: m.label,
  time: clock(mealMinutes(m.label, wake, meals)),
  dish: m.template,
  kcal: Math.round(m.total.kcal),
  p: Math.round(m.total.p),
  c: Math.round(m.total.c),
});

/** Seven days: diet day N paired with its workout (or rest) and the meals around training. */
export function weeklySchedule(p: ClientProfile, T: Targets, train: TrainingDay[], days: PlannedDay[]): ScheduleDay[] {
  const slots = TRAINING_SLOTS[train.length] ?? [];
  const start = toMinutes(p.trainTime, "18:00");
  const steps = stepTarget(T.goal, p.age);
  const cardio = CARDIO[T.goal];
  const restDays = [0, 1, 2, 3, 4, 5, 6].filter((i) => !slots.includes(i));
  return days.slice(0, 7).map((d, i) => {
    const k = slots.indexOf(i);
    const session = k >= 0 ? train[k] : null;
    // The last rest day of the week is a full rest day when the client trains 5 or 6 days.
    const fullRest = !session && train.length >= 5 && i === restDays[restDays.length - 1];
    let pre: MealRef | null = null;
    let post: MealRef | null = null;
    if (session) {
      const timed = d.meals.map((m) => ({ m, at: mealMinutes(m.label, p.wakeTime, p.mealsPerDay) }));
      const before = timed.filter((x) => start - x.at >= 60 && start - x.at <= 240).sort((a, b) => b.at - a.at)[0];
      const after = timed.filter((x) => x.at - start >= 0 && x.at - start <= 180).sort((a, b) => a.at - b.at)[0];
      if (before) pre = ref(before.m, p.wakeTime, p.mealsPerDay);
      if (after) post = ref(after.m, p.wakeTime, p.mealsPerDay);
    }
    return {
      day: d.day,
      session,
      title: session ? session.title.replace(/^Day \d+ — /, "") : fullRest ? "Full rest" : train.length ? "Rest / active recovery" : "Walk + mobility",
      cardio: session ? cardio.train : fullRest ? "Easy walk + 10 min stretching" : cardio.rest,
      steps,
      pre,
      post,
      kcal: Math.round(d.total.kcal),
      protein: Math.round(d.total.p),
    };
  });
}

/** Heart-rate zones from the Tanaka (2001) estimate of maximum heart rate, 208 − 0.7 × age. */
export function heartZones(age: number) {
  const max = Math.round(208 - 0.7 * age);
  const z = (lo: number, hi: number) => `${Math.round(max * lo)}–${Math.round(max * hi)} bpm`;
  return {
    max,
    zones: [
      { name: "Zone 2 · fat-burning base", range: z(0.6, 0.7), feel: "Can talk in full sentences. Walks, easy cycling." },
      { name: "Zone 3 · aerobic", range: z(0.7, 0.8), feel: "Can speak short phrases. Brisk incline walk, steady cardio." },
      { name: "Zone 4 · intervals", range: z(0.8, 0.9), feel: "Only a few words. Short sprints with full recovery." },
    ],
  };
}

/** Expected weight each week at the prescribed calories, stopping at the target weight. Straight-line estimate. */
export function projection(p: ClientProfile, T: Targets, weeks = 12): { week: number; kg: number }[] {
  if (T.weeklyKg === 0) return [];
  const out: { week: number; kg: number }[] = [];
  for (let w = 0; w <= weeks; w++) {
    let kg = p.weightKg + T.weeklyKg * w;
    if (p.targetWeightKg && (T.weeklyKg < 0 ? kg < p.targetWeightKg : kg > p.targetWeightKg)) kg = p.targetWeightKg;
    out.push({ week: w, kg: Math.round(kg * 10) / 10 });
  }
  return out;
}

const ROLE_ORDER = ["carb", "legume", "protein", "dairy", "veg", "fruit", "fat"] as const;
const ROLE_LABEL: Record<(typeof ROLE_ORDER)[number], string> = {
  carb: "Grains & cereals",
  legume: "Dals & pulses",
  protein: "Protein foods",
  dairy: "Dairy",
  veg: "Vegetables",
  fruit: "Fruit",
  fat: "Oils, nuts & seeds",
};

/** "1.25 kg", "450 g", "1.5 L": rounded up to a buyable amount. */
export function buyAmount(total: number, unit: "g" | "ml"): string {
  const step = total >= 1000 ? 250 : total >= 200 ? 50 : 10;
  const n = Math.ceil(total / step) * step;
  if (n >= 1000) return `${(n / 1000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} ${unit === "ml" ? "L" : "kg"}`;
  return `${n} ${unit}`;
}

/** Everything the 7-day chart uses, totalled for one week and grouped by aisle. Whey comes from the client's own tub. */
export function groceryList(days: PlannedDay[]): { group: string; items: { name: string; amount: string }[] }[] {
  const sum = new Map<string, { name: string; role: (typeof ROLE_ORDER)[number]; unit: "g" | "ml"; total: number }>();
  for (const d of days) for (const m of d.meals) for (const it of m.items) {
    if (it.food.id === "whey") continue;
    const cur = sum.get(it.food.id) ?? { name: it.food.name, role: it.food.role, unit: it.food.unit, total: 0 };
    cur.total += it.grams;
    sum.set(it.food.id, cur);
  }
  return ROLE_ORDER.map((role) => ({
    group: ROLE_LABEL[role],
    items: [...sum.values()]
      .filter((x) => x.role === role && x.total > 0)
      .sort((a, b) => b.total - a.total)
      .map((x) => ({ name: x.name.replace(/\s*\((raw|dry|cooked)[^)]*\)/i, ""), amount: buyAmount(x.total, x.unit) })),
  })).filter((g) => g.items.length);
}

/** Daily ticks for the 4-week habit tracker. */
export function habits(p: ClientProfile, T: Targets): string[] {
  return [
    `Water ${T.waterRestL}–${T.waterTrainL} L`,
    `${stepTarget(T.goal, p.age).toLocaleString("en-IN")} steps`,
    `Protein ${T.protein} g (every meal)`,
    "Meals as per chart",
    p.trainingDays >= 2 ? "Workout / walk done" : "30-min walk done",
    "Sleep 7+ hours",
    "No sugary drinks / junk",
  ];
}
