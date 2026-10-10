// The paid diet chart's intake form: what the client tells us, validated on the server.
// Pure (no I/O) so it can be unit-tested and shared with the order route.
import type { ActivityId, Allergen, ClientProfile, Cuisine, DietPref, Goal } from "@/lib/diet-pro/types";
import { CONDITION_KEYS, FEMALE_ONLY, type ConditionKey } from "@/lib/diet-pro/conditions";
import { DEFAULT_RATE } from "@/lib/diet-pro/engine";
import { isDietPlanId, type DietPlanId } from "./config";

export type DietIntake = {
  age: number;
  sex: "male" | "female";
  heightCm: number;
  weightKg: number;
  goal: Goal;
  diet: DietPref;
  cuisine: Cuisine;
  activity: ActivityId;
  mealsPerDay: 3 | 4 | 5 | 6;
  wakeTime: string;
  /** Optional tape measurements in cm: with neck + waist (+ hip for women) the plan uses the US Navy body-fat method. */
  neckCm?: number;
  waistCm?: number;
  hipCm?: number;
  targetWeightKg?: number;
  /** Workout days a week (0–6) and usual time "HH:MM"; drive the training plan and pre/post-workout meals. */
  trainingDays?: number;
  trainTime?: string;
  setting?: "gym" | "home";
  medicines?: string;
  conditions: ConditionKey[];
  allergies: Allergen[];
  notes: string;
};

export type DietBuyer = { name: string; phone: string; email: string | null; marketing?: boolean };

const GOALS: Goal[] = ["fat-loss", "recomp", "maintain", "lean-gain", "gain"];
const DIETS: DietPref[] = ["veg", "egg", "nonveg", "vegan", "jain"];
const CUISINES: Cuisine[] = ["any", "north", "south", "west", "east"];
const ACTIVITY: ActivityId[] = ["sedentary", "light", "moderate", "active", "athlete"];
const ALLERGENS: Allergen[] = ["dairy", "gluten", "nuts", "peanut", "soy", "egg", "fish", "shellfish", "sesame"];

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN);
const pick = <T extends string>(v: unknown, list: readonly T[]): T | null => (list.includes(v as T) ? (v as T) : null);
const pickMany = <T extends string>(v: unknown, list: readonly T[]): T[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is T => list.includes(x as T)))] : []);

/** Returns a message for the visitor, or the clean buyer + intake. */
export function parseDietOrder(b: Record<string, unknown>): { buyer: DietBuyer; intake: DietIntake; plan: DietPlanId } | string {
  const name = text(b.name, 80);
  const digits = text(b.phone, 20).replace(/\D/g, "");
  const phone = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  const email = text(b.email, 120);
  if (name.length < 2) return "Please enter your full name.";
  if (!/^[6-9]\d{9}$/.test(phone)) return "Please enter a valid 10-digit Indian mobile number.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address, or leave it blank.";

  const age = num(b.age);
  const heightCm = num(b.heightCm);
  const weightKg = num(b.weightKg);
  if (!Number.isInteger(age) || age < 16 || age > 80) return "This service is for ages 16 to 80. Please enter your age in years.";
  if (!(heightCm >= 130 && heightCm <= 220)) return "Please enter your height in centimetres (130–220).";
  if (!(weightKg >= 30 && weightKg <= 200)) return "Please enter your weight in kg (30–200).";
  const sex = pick(b.sex, ["male", "female"] as const);
  const goal = pick(b.goal, GOALS);
  const diet = pick(b.diet, DIETS);
  const activity = pick(b.activity, ACTIVITY);
  if (!sex || !goal || !diet || !activity) return "Please answer every question in the form.";
  const meals = num(b.mealsPerDay);
  const wakeTime = text(b.wakeTime, 5);
  const conditions = pickMany(b.conditions, CONDITION_KEYS);
  if (sex === "male" && conditions.some((c) => FEMALE_ONLY.has(c))) return "Please check the health conditions you selected.";
  if (b.consent !== true) return "Please confirm the consent box so we can use these details to prepare your chart.";
  // Optional numbers: kept only when present and plausible, never guessed.
  const opt = (v: unknown, lo: number, hi: number, step = 0.5) => {
    const n = num(v);
    return Number.isFinite(n) && n >= lo && n <= hi ? Math.round(n / step) * step : undefined;
  };
  const trainTime = text(b.trainTime, 5);
  const days = num(b.trainingDays);
  return {
    plan: isDietPlanId(b.plan) ? b.plan : "starter",
    buyer: { name, phone, email: email || null, marketing: b.marketing === true && !!email },
    intake: {
      age,
      sex,
      heightCm: Math.round(heightCm),
      weightKg: Math.round(weightKg * 10) / 10,
      goal,
      diet,
      cuisine: pick(b.cuisine, CUISINES) ?? "any",
      activity,
      mealsPerDay: ([3, 4, 5, 6] as const).find((n) => n === meals) ?? 5,
      wakeTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(wakeTime) ? wakeTime : "06:30",
      neckCm: opt(b.neckCm, 20, 70),
      waistCm: opt(b.waistCm, 40, 200),
      hipCm: opt(b.hipCm, 50, 200),
      targetWeightKg: opt(b.targetWeightKg, 30, 200),
      trainingDays: Number.isInteger(days) && days >= 0 && days <= 6 ? days : undefined,
      trainTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(trainTime) ? trainTime : undefined,
      setting: b.setting === "home" ? "home" : b.setting === "gym" ? "gym" : undefined,
      medicines: text(b.medicines, 200) || undefined,
      conditions,
      allergies: pickMany(b.allergies, ALLERGENS),
      notes: text(b.notes, 500),
    },
  };
}

/** Starts a Diet Calculator profile from the intake; the coach still reviews every field. */
export function intakeToProfile(name: string, i: DietIntake, base: ClientProfile): ClientProfile {
  const has = (c: DietIntake["conditions"][number]) => i.conditions.includes(c);
  return {
    ...base,
    name,
    age: i.age,
    sex: i.sex,
    heightCm: i.heightCm,
    weightKg: i.weightKg,
    m: { neck: i.neckCm, waist: i.waistCm, hip: i.hipCm },
    targetWeightKg: i.targetWeightKg,
    measuredBodyFat: undefined,
    activity: i.activity,
    // Training days: what the client said, otherwise a sensible guess from their activity level.
    trainingDays: i.trainingDays ?? { sedentary: 0, light: 2, moderate: 3, active: 5, athlete: 6 }[i.activity],
    trainTime: i.trainTime,
    setting: i.setting ?? base.setting,
    goal: i.goal,
    ratePct: DEFAULT_RATE[i.goal],
    diet: i.diet,
    cuisine: i.cuisine,
    mealsPerDay: i.mealsPerDay,
    wakeTime: i.wakeTime,
    allergies: i.allergies,
    style: has("diabetes") ? "diabetic" : has("pcos") ? "pcos" : has("hypertension") || has("cholesterol") || has("heart") ? "heart" : base.style,
    conditions: { ...base.conditions, ...Object.fromEntries(CONDITION_KEYS.map((k) => [k, has(k)])) },
  };
}
