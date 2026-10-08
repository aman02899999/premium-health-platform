// The paid diet chart's intake form: what the client tells us, validated on the server.
// Pure (no I/O) so it can be unit-tested and shared with the order route.
import type { ActivityId, Allergen, ClientProfile, Cuisine, DietPref, Goal } from "@/lib/diet-pro/types";

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
  conditions: ("diabetes" | "pcos" | "hypothyroid" | "hypertension" | "pregnant" | "lactating" | "ckd")[];
  allergies: Allergen[];
  notes: string;
};

export type DietBuyer = { name: string; phone: string; email: string | null };

const GOALS: Goal[] = ["fat-loss", "recomp", "maintain", "lean-gain", "gain"];
const DIETS: DietPref[] = ["veg", "egg", "nonveg", "vegan", "jain"];
const CUISINES: Cuisine[] = ["any", "north", "south", "west", "east"];
const ACTIVITY: ActivityId[] = ["sedentary", "light", "moderate", "active", "athlete"];
const CONDITIONS = ["diabetes", "pcos", "hypothyroid", "hypertension", "pregnant", "lactating", "ckd"] as const;
const ALLERGENS: Allergen[] = ["dairy", "gluten", "nuts", "peanut", "soy", "egg", "fish", "shellfish", "sesame"];

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN);
const pick = <T extends string>(v: unknown, list: readonly T[]): T | null => (list.includes(v as T) ? (v as T) : null);
const pickMany = <T extends string>(v: unknown, list: readonly T[]): T[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is T => list.includes(x as T)))] : []);

/** Returns a message for the visitor, or the clean buyer + intake. */
export function parseDietOrder(b: Record<string, unknown>): { buyer: DietBuyer; intake: DietIntake } | string {
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
  const conditions = pickMany(b.conditions, CONDITIONS);
  if (sex === "male" && conditions.some((c) => c === "pregnant" || c === "lactating" || c === "pcos")) return "Please check the health conditions you selected.";
  if (b.consent !== true) return "Please confirm the consent box so we can use these details to prepare your chart.";
  return {
    buyer: { name, phone, email: email || null },
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
    m: {},
    measuredBodyFat: undefined,
    activity: i.activity,
    goal: i.goal,
    diet: i.diet,
    cuisine: i.cuisine,
    mealsPerDay: i.mealsPerDay,
    wakeTime: i.wakeTime,
    allergies: i.allergies,
    style: has("diabetes") ? "diabetic" : has("pcos") ? "pcos" : has("hypertension") ? "heart" : base.style,
    conditions: { pcos: has("pcos"), hypothyroid: has("hypothyroid"), diabetes: has("diabetes"), hypertension: has("hypertension"), ckd: has("ckd"), pregnant: has("pregnant"), lactating: has("lactating") },
  };
}
