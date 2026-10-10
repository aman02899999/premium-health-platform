// Starting values for a new Diet Pro client and the coach credit printed on every plan.
import type { ClientProfile } from "./types";

export const DEFAULT_PROFILE: ClientProfile = {
  name: "",
  age: 30,
  sex: "male",
  heightCm: 172,
  weightKg: 78,
  m: {},
  activity: "moderate",
  trainingDays: 4,
  level: "intermediate",
  setting: "gym",
  goal: "fat-loss",
  ratePct: 0.5,
  style: "balanced",
  diet: "veg",
  mealsPerDay: 5,
  allergies: [],
  conditions: { pcos: false, hypothyroid: false, diabetes: false, hypertension: false, ckd: false, pregnant: false, lactating: false },
  useWhey: false,
  // Example label only — the coach must replace it with the client's tub.
  whey: { scoopG: 30, kcal: 120, p: 24, c: 3, f: 1.5, edited: false },
  bmiScale: "asian",
  bmrFormula: "mifflin",
  overrides: {},
};

/** The head coach's credentials (the name and photo come from the site content). */
export const DEFAULT_COACH = { title: "Certified Nutritionist", experience: "15+ years coaching experience", certification: "", certifiedSince: "2016-02-10" };
