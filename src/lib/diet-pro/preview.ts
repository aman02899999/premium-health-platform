// The free one-day diet preview on /diet-plan-generator: the same engine as the paid plans (targets
// and a solved Indian menu), for one day and without health conditions. Pure.
import { DEFAULT_PROFILE } from "./defaults";
import { DEFAULT_RATE, analyse, targets } from "./engine";
import { household, withName } from "./household";
import { planDays } from "./meals";
import type { ActivityId, ClientProfile, Cuisine, DietPref, Goal } from "./types";

export type PreviewInput = { sex: "male" | "female"; age: number; heightCm: number; weightKg: number; goal: Goal; diet: DietPref; activity: ActivityId; cuisine: Cuisine };
export type PreviewMeal = { label: string; dish: string; kcal: number; protein: number; items: string[] };
export type DietPreview = {
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
  maintenance: number;
  weeklyKg: number;
  waterL: number;
  bmi: number;
  bmiLabel: string;
  meals: PreviewMeal[];
  notes: string[];
};

const GOALS: Goal[] = ["fat-loss", "recomp", "maintain", "lean-gain", "gain"];
const DIETS: DietPref[] = ["veg", "egg", "nonveg", "vegan", "jain"];
const ACTIVITY: ActivityId[] = ["sedentary", "light", "moderate", "active", "athlete"];
const CUISINES: Cuisine[] = ["any", "north", "south", "west", "east"];
const shortName = (name: string) => name.replace(/\s*\([^)]*\)/g, "").split(", ")[0].replace(/^\w/, (ch) => ch.toLowerCase());
const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN);
const pick = <T extends string>(v: unknown, list: readonly T[]): T | null => (list.includes(v as T) ? (v as T) : null);

export function parsePreview(b: Record<string, unknown>): PreviewInput | string {
  const age = num(b.age);
  const heightCm = num(b.heightCm);
  const weightKg = num(b.weightKg);
  if (!Number.isInteger(age) || age < 18 || age > 70) return "The free preview is for adults aged 18 to 70.";
  if (!(heightCm >= 130 && heightCm <= 220)) return "Please enter your height in centimetres (130–220).";
  if (!(weightKg >= 35 && weightKg <= 200)) return "Please enter your weight in kg (35–200).";
  const sex = pick(b.sex, ["male", "female"] as const);
  const goal = pick(b.goal, GOALS);
  const diet = pick(b.diet, DIETS);
  const activity = pick(b.activity, ACTIVITY);
  if (!sex || !goal || !diet || !activity) return "Please answer every question.";
  return { sex, age, heightCm: Math.round(heightCm), weightKg: Math.round(weightKg * 10) / 10, goal, diet, activity, cuisine: pick(b.cuisine, CUISINES) ?? "any" };
}

export function dietPreview(i: PreviewInput): DietPreview {
  const p: ClientProfile = {
    ...DEFAULT_PROFILE,
    age: i.age,
    sex: i.sex,
    heightCm: i.heightCm,
    weightKg: i.weightKg,
    activity: i.activity,
    trainingDays: { sedentary: 0, light: 2, moderate: 3, active: 5, athlete: 6 }[i.activity],
    goal: i.goal,
    ratePct: DEFAULT_RATE[i.goal],
    diet: i.diet,
    cuisine: i.cuisine,
    mealsPerDay: 5,
  };
  const t = targets(p);
  const a = analyse(p);
  const [day] = planDays(t, p, 1);
  return {
    kcal: t.kcal,
    protein: t.protein,
    carb: t.carb,
    fat: t.fat,
    maintenance: t.tdee,
    weeklyKg: t.weeklyKg,
    waterL: t.waterRestL,
    bmi: Math.round(a.bmi * 10) / 10,
    bmiLabel: a.bmiBand.label,
    // Same wording as the printed chart: household measure, food, and the weighed amount.
    meals: (day?.meals ?? []).map((m) => ({
      label: m.label,
      dish: m.template,
      kcal: Math.round(m.total.kcal),
      protein: Math.round(m.total.p),
      items: m.items.map((x) => `${withName(household(x.food.id, x.grams, m.template).qty, shortName(x.food.name))} (${x.label})`),
    })),
    notes: t.warnings.map((w) => w.text),
  };
}
