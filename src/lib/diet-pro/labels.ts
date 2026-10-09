// Display labels for Diet Pro choices, shared by the planner screen and the PDF builder.
import { ACTIVITY, type Targets } from "./engine";
import type { Allergen, ClientProfile, Cuisine, DietPref, Goal, Style } from "./types";

export const GOALS: { value: Goal; label: string }[] = [
  { value: "fat-loss", label: "Fat loss" },
  { value: "recomp", label: "Recomp" },
  { value: "maintain", label: "Maintain" },
  { value: "lean-gain", label: "Lean gain" },
  { value: "gain", label: "Gain" },
];
export const DIETS: { value: DietPref; label: string }[] = [
  { value: "veg", label: "Veg" },
  { value: "egg", label: "Eggetarian" },
  { value: "nonveg", label: "Non-veg" },
  { value: "vegan", label: "Vegan" },
  { value: "jain", label: "Jain" },
];
export const STYLES: { value: Style; label: string }[] = [
  { value: "balanced", label: "Balanced" },
  { value: "high-protein", label: "High protein" },
  { value: "low-carb", label: "Low carb" },
  { value: "keto", label: "Keto (<50 g carbs)" },
  { value: "diabetic", label: "Diabetes-friendly (low GI)" },
  { value: "pcos", label: "PCOS-friendly (low GI)" },
  { value: "heart", label: "Heart-healthy (low sat. fat)" },
  { value: "high-fibre", label: "High fibre (gut health)" },
  { value: "sattvic", label: "Sattvic (no onion / mushroom)" },
  { value: "vrat", label: "Vrat / fasting day" },
];
export const CUISINES: { value: Cuisine; label: string }[] = [
  { value: "any", label: "All-India mix" },
  { value: "north", label: "North Indian (Punjabi, UP, Delhi)" },
  { value: "south", label: "South Indian (TN, Kerala, Karnataka, AP)" },
  { value: "west", label: "West Indian (Gujarati, Maharashtrian)" },
  { value: "east", label: "East Indian (Bengali, Odia)" },
];
export const ALLERGENS: Allergen[] = ["dairy", "gluten", "nuts", "peanut", "soy", "egg", "fish", "shellfish", "sesame"];
export const label = <T extends string>(list: { value: T; label: string }[], v: T) => list.find((x) => x.value === v)?.label ?? v;

/** The words printed on the PDF profile: the goal the plan actually uses (a safety rule can change it). */
export const planLabels = (p: ClientProfile, T: Targets) => ({
  goal: `${label(GOALS, T.goal)}${T.rate ? ` · ${T.rate} %/week` : ""}${T.goal !== p.goal ? ` (changed from ${label(GOALS, p.goal).toLowerCase()} for safety)` : ""}`,
  diet: label(DIETS, p.diet),
  style: label(STYLES, p.style),
  activity: ACTIVITY.find((a) => a.id === p.activity)?.label ?? p.activity,
});
