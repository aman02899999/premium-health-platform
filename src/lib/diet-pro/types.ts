// Shared types for the admin-only Diet Pro planner.

export type Sex = "male" | "female";
export type DietPref = "vegan" | "veg" | "jain" | "egg" | "nonveg";
export type Goal = "fat-loss" | "recomp" | "maintain" | "lean-gain" | "gain";
export type Style = "balanced" | "high-protein" | "low-carb" | "keto" | "diabetic" | "pcos" | "heart" | "high-fibre" | "vrat" | "sattvic";
export type Cuisine = "any" | "north" | "south" | "west" | "east";
export type Allergen = "dairy" | "gluten" | "nuts" | "peanut" | "soy" | "egg" | "fish" | "shellfish" | "sesame";
export type ActivityId = "sedentary" | "light" | "moderate" | "active" | "athlete";
export type FoodRole = "carb" | "legume" | "protein" | "dairy" | "fat" | "veg" | "fruit";

export type FoodItem = {
  id: string;
  name: string;
  /** Per 100 g (or 100 ml, treated as 100 g). */
  kcal: number;
  p: number;
  c: number;
  f: number;
  fib: number;
  /** Minerals, mg per 100 g. */
  ca: number;
  fe: number;
  na: number;
  k: number;
  diet: "vegan" | "veg" | "egg" | "nonveg";
  allergen: Allergen | null;
  /** Allowed in a Jain diet (no root vegetables, eggs or meat). */
  jain: boolean;
  role: FoodRole;
  unit: "g" | "ml";
  state: string;
  hint: string | null;
  source: { db: "IFCT" | "USDA" | "LABEL"; ref: string; desc: string };
};

export type Measurements = {
  neck?: number;
  chest?: number;
  waist?: number;
  hip?: number;
  arm?: number;
  forearm?: number;
  thigh?: number;
  calf?: number;
  wrist?: number;
};

export type WheyLabel = { scoopG: number; kcal: number; p: number; c: number; f: number; edited: boolean };

export type Conditions = {
  pcos: boolean;
  hypothyroid: boolean;
  diabetes: boolean;
  hypertension: boolean;
  ckd: boolean;
  pregnant: boolean;
  lactating: boolean;
};

export type ClientProfile = {
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number;
  m: Measurements;
  /** From DEXA, BIA or callipers; overrides the circumference estimate. */
  measuredBodyFat?: number;
  activity: ActivityId;
  trainingDays: number;
  level: "beginner" | "intermediate" | "advanced";
  setting: "gym" | "home";
  goal: Goal;
  /** Planned change, % of body weight per week (always positive). */
  ratePct: number;
  style: Style;
  diet: DietPref;
  mealsPerDay: 3 | 4 | 5 | 6;
  /** Regional preference; other dishes still appear when nothing regional fits. */
  cuisine?: Cuisine;
  /** Leave out costly or imported foods (salmon, quinoa, chia, olive oil…). */
  budget?: boolean;
  /** "HH:MM", used to time the meals on the chart. */
  wakeTime?: string;
  /** "HH:MM" the session usually starts; links pre- and post-workout meals to the diet chart. */
  trainTime?: string;
  allergies: Allergen[];
  conditions: Conditions;
  useWhey: boolean;
  whey: WheyLabel;
  bmiScale: "asian" | "who";
  bmrFormula: "mifflin" | "katch";
  overrides: { calories?: number; proteinGPerKg?: number; fatPct?: number };
};

export type Macro = { kcal: number; p: number; c: number; f: number };
export type Band = { label: string; tone: "ok" | "warn" | "alert" };
