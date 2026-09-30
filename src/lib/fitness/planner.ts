import { EXERCISES, levelAtMost, type Equipment, type Exercise, type Level, type Muscle } from "./exercises";

export type PlanGoal = "muscle" | "fat-loss" | "strength" | "general";
export type Setting = "gym" | "home";

export type PlanInput = { goal: PlanGoal; days: number; level: Level; setting: Setting };
export type PlanItem = { slug: string; name: string; sets: number; reps: string; rest: number };
export type PlanDay = { title: string; focus: string; items: PlanItem[]; finisher?: string };

export const GOALS: { id: PlanGoal; label: string }[] = [
  { id: "muscle", label: "Build muscle" },
  { id: "fat-loss", label: "Lose fat" },
  { id: "strength", label: "Get stronger" },
  { id: "general", label: "General fitness" },
];

const HOME_EQUIPMENT: Equipment[] = ["bodyweight", "dumbbell", "kettlebell"];

// Session templates: each slot is a muscle, optionally ":iso" to prefer an isolation move
// (e.g. rear delts on pull day instead of another press).
type Slot = Muscle | `${Muscle}:iso`;
const TEMPLATES: Record<string, { title: string; focus: string; slots: Slot[] }> = {
  fullA: { title: "Full Body A", focus: "Squat · Push · Pull", slots: ["quads", "chest", "back", "hamstrings", "shoulders", "core"] },
  fullB: { title: "Full Body B", focus: "Hinge · Press · Row", slots: ["hamstrings", "shoulders", "back", "quads", "chest", "core"] },
  fullC: { title: "Full Body C", focus: "Legs · Upper · Arms", slots: ["glutes", "chest", "back", "quads", "biceps", "triceps"] },
  upper: { title: "Upper Body", focus: "Chest · Back · Shoulders · Arms", slots: ["chest", "back", "shoulders", "chest", "back", "biceps", "triceps"] },
  lower: { title: "Lower Body", focus: "Quads · Hamstrings · Glutes · Core", slots: ["quads", "hamstrings", "glutes", "quads", "calves", "core"] },
  push: { title: "Push", focus: "Chest · Shoulders · Triceps", slots: ["chest", "shoulders", "chest", "shoulders:iso", "triceps", "triceps"] },
  pull: { title: "Pull", focus: "Back · Rear delts · Biceps", slots: ["back", "back", "back", "shoulders:iso", "biceps", "biceps"] },
  legs: { title: "Legs", focus: "Quads · Hamstrings · Glutes · Calves", slots: ["quads", "hamstrings", "quads", "glutes", "hamstrings", "calves", "core"] },
};

const SPLITS: Record<number, string[]> = {
  2: ["fullA", "fullB"],
  3: ["fullA", "fullB", "fullC"],
  4: ["upper", "lower", "upper", "lower"],
  5: ["push", "pull", "legs", "upper", "lower"],
  6: ["push", "pull", "legs", "push", "pull", "legs"],
};

const DOSE: Record<PlanGoal, { compound: [number, string, number]; isolation: [number, string, number] }> = {
  muscle: { compound: [4, "8–10", 90], isolation: [3, "10–15", 60] },
  "fat-loss": { compound: [3, "10–12", 60], isolation: [3, "12–15", 45] },
  strength: { compound: [5, "4–6", 150], isolation: [3, "8–10", 75] },
  general: { compound: [3, "8–12", 75], isolation: [2, "12–15", 60] },
};

const FINISHERS: Record<PlanGoal, string | undefined> = {
  muscle: undefined,
  "fat-loss": "Finisher: 15–20 min incline walk or 8 × 30 s bike sprints",
  strength: undefined,
  general: "Finisher: 10 min easy cardio + stretching",
};

export function generatePlan(input: PlanInput): PlanDay[] {
  const days = Math.min(6, Math.max(2, Math.round(input.days)));
  const pool = EXERCISES.filter(
    (e) => e.kind !== "cardio" && levelAtMost(e, input.level) && (input.setting === "gym" || HOME_EQUIPMENT.includes(e.equipment)),
  );
  const perDay = input.level === "beginner" ? 5 : 6;

  return SPLITS[days].map((key, dayIndex) => {
    const tpl = TEMPLATES[key];
    const used = new Set<string>();
    const items: PlanItem[] = [];
    for (const [slotIndex, slot] of tpl.slots.entries()) {
      if (items.length >= perDay) break;
      const [muscle, mode] = slot.split(":") as [Muscle, string | undefined];
      const wantIso = mode === "iso";
      const candidates = pool
        .filter((e) => e.primary === muscle && !used.has(e.slug))
        // Compounds first (isolation first for ":iso" slots); rotate choice by day so repeated sessions differ.
        .sort((a, b) => Number((a.kind === "compound") === wantIso) - Number((b.kind === "compound") === wantIso));
      if (!candidates.length) continue;
      const pick: Exercise = candidates[(dayIndex + slotIndex) % Math.min(candidates.length, slotIndex < 2 ? 2 : candidates.length)];
      used.add(pick.slug);
      const [sets, reps, rest] = DOSE[input.goal][pick.kind === "compound" ? "compound" : "isolation"];
      items.push({ slug: pick.slug, name: pick.name, sets, reps: pick.slug === "plank" ? "30–45 s" : reps, rest });
    }
    return { title: `Day ${dayIndex + 1} — ${tpl.title}`, focus: tpl.focus, items, finisher: FINISHERS[input.goal] };
  });
}

export function planToText(plan: PlanDay[], gym: string) {
  return [
    `My ${plan.length}-day workout plan (${gym})`,
    ...plan.map((d) => [`\n${d.title}`, ...d.items.map((i) => `• ${i.name}: ${i.sets} × ${i.reps} (rest ${i.rest}s)`), d.finisher ? `• ${d.finisher}` : ""].filter(Boolean).join("\n")),
  ].join("\n");
}
