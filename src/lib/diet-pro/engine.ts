/**
 * Diet Pro: body analysis and daily targets. Pure functions, unit-tested.
 * Every formula names its source; change a constant only with a citation.
 */
import type { ActivityId, Band, ClientProfile, Goal, Sex, Style } from "./types";

const r1 = (n: number) => Math.round(n * 10) / 10;

// ───────────────────────── Anthropometry ─────────────────────────

/** BMI bands. Asian: WHO expert consultation 2004 / Misra et al. 2009 (Indian consensus). WHO: 1995/2000. */
export function bmiBand(bmi: number, scale: "asian" | "who"): Band {
  if (bmi < 18.5) return { label: "Underweight", tone: "warn" };
  if (scale === "asian") {
    if (bmi < 23) return { label: "Healthy", tone: "ok" };
    if (bmi < 25) return { label: "Overweight", tone: "warn" };
    return { label: bmi < 30 ? "Obese (class I)" : "Obese (class II+)", tone: "alert" };
  }
  if (bmi < 25) return { label: "Healthy", tone: "ok" };
  if (bmi < 30) return { label: "Overweight", tone: "warn" };
  return { label: bmi < 35 ? "Obese (class I)" : bmi < 40 ? "Obese (class II)" : "Obese (class III)", tone: "alert" };
}

/** US Navy circumference method (Hodgdon & Beckett 1984), metric form. NaN when inputs are missing or impossible. */
export function navyBodyFat(sex: Sex, heightCm: number, neck?: number, waist?: number, hip?: number): number {
  if (!neck || !waist || !heightCm) return NaN;
  if (sex === "male") {
    if (waist <= neck) return NaN;
    return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(heightCm)) - 450;
  }
  if (!hip || waist + hip <= neck) return NaN;
  return 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.221 * Math.log10(heightCm)) - 450;
}

/** Deurenberg et al. 1991, Br J Nutr: body fat from BMI, age and sex (adults). ±4–5 % error. */
export const deurenbergBodyFat = (bmi: number, age: number, sex: Sex) => 1.2 * bmi + 0.23 * age - 10.8 * (sex === "male" ? 1 : 0) - 5.4;

/** American Council on Exercise body-fat categories. */
export function bodyFatBand(sex: Sex, pct: number): Band {
  const [ess, ath, fit, avg] = sex === "male" ? [6, 14, 18, 25] : [14, 21, 25, 32];
  if (pct < (sex === "male" ? 2 : 10)) return { label: "Below essential fat", tone: "alert" };
  if (pct < ess) return { label: "Essential fat", tone: "warn" };
  if (pct < ath) return { label: "Athletic", tone: "ok" };
  if (pct < fit) return { label: "Fitness", tone: "ok" };
  if (pct < avg) return { label: "Average", tone: "warn" };
  return { label: "Obese range", tone: "alert" };
}

/** Waist-to-height ratio bands: NICE NG246 (2022) / Ashwell. */
export function whtrBand(r: number): Band {
  if (r < 0.4) return { label: "Low — check for underweight", tone: "warn" };
  if (r < 0.5) return { label: "Healthy", tone: "ok" };
  if (r < 0.6) return { label: "Increased risk", tone: "warn" };
  return { label: "High risk", tone: "alert" };
}

/** Waist-to-hip ratio: WHO expert consultation 2008 (substantially increased risk at ≥0.90 men, ≥0.85 women). */
export const whrBand = (sex: Sex, r: number): Band =>
  r >= (sex === "male" ? 0.9 : 0.85) ? { label: "Substantially increased risk", tone: "alert" } : { label: "Lower risk", tone: "ok" };

/** Waist circumference for Asian Indians (IDF South-Asian cut-off; ICMR): ≥90 cm men, ≥80 cm women. */
export const waistBand = (sex: Sex, cm: number): Band =>
  cm >= (sex === "male" ? 90 : 80) ? { label: "Abdominal obesity (Asian cut-off)", tone: "alert" } : { label: "Below Asian cut-off", tone: "ok" };

export function analyse(p: ClientProfile) {
  const h = p.heightCm / 100;
  const bmi = p.weightKg / (h * h);
  const healthyMaxBmi = p.bmiScale === "asian" ? 22.9 : 24.9;
  const navy = navyBodyFat(p.sex, p.heightCm, p.m.neck, p.m.waist, p.m.hip);
  const measured = p.measuredBodyFat && p.measuredBodyFat > 2 && p.measuredBodyFat < 70 ? p.measuredBodyFat : NaN;
  let bodyFat: number;
  let bfMethod: "measured" | "navy" | "deurenberg";
  if (Number.isFinite(measured)) [bodyFat, bfMethod] = [measured, "measured"];
  else if (Number.isFinite(navy) && navy > 2 && navy < 70) [bodyFat, bfMethod] = [navy, "navy"];
  else [bodyFat, bfMethod] = [deurenbergBodyFat(bmi, p.age, p.sex), "deurenberg"];
  bodyFat = Math.min(70, Math.max(2, bodyFat));
  const fatKg = (p.weightKg * bodyFat) / 100;
  const leanKg = p.weightKg - fatKg;
  // FFMI (Kouri et al. 1995); normalised to 1.8 m.
  const ffmi = leanKg / (h * h);
  const waist = p.m.waist;
  const hip = p.m.hip;
  return {
    bmi: r1(bmi),
    bmiBand: bmiBand(bmi, p.bmiScale),
    healthyRange: { min: r1(18.5 * h * h), max: r1(healthyMaxBmi * h * h) },
    bodyFat: r1(bodyFat),
    bfMethod,
    bfBand: bodyFatBand(p.sex, bodyFat),
    navyBodyFat: Number.isFinite(navy) ? r1(navy) : null,
    fatKg: r1(fatKg),
    leanKg: r1(leanKg),
    ffmi: r1(ffmi),
    ffmiNorm: r1(ffmi + 6.1 * (1.8 - h)),
    whtr: waist ? Math.round((waist / p.heightCm) * 100) / 100 : null,
    whtrBand: waist ? whtrBand(waist / p.heightCm) : null,
    whr: waist && hip ? Math.round((waist / hip) * 100) / 100 : null,
    whrBand: waist && hip ? whrBand(p.sex, waist / hip) : null,
    waistBand: waist ? waistBand(p.sex, waist) : null,
  };
}

// ───────────────────────── Energy ─────────────────────────

/** Conventional activity factors applied to BMR (sedentary 1.2 … very active 1.9). */
export const ACTIVITY: { id: ActivityId; label: string; factor: number }[] = [
  { id: "sedentary", label: "Sedentary — desk job, little exercise", factor: 1.2 },
  { id: "light", label: "Light — 1–3 sessions/week", factor: 1.375 },
  { id: "moderate", label: "Moderate — 3–5 sessions/week", factor: 1.55 },
  { id: "active", label: "Very active — 6–7 sessions/week", factor: 1.725 },
  { id: "athlete", label: "Athlete / physical job + training", factor: 1.9 },
];

/** Mifflin-St Jeor 1990. */
export const mifflin = (sex: Sex, kg: number, cm: number, age: number) => 10 * kg + 6.25 * cm - 5 * age + (sex === "male" ? 5 : -161);
/** Katch-McArdle: needs lean mass. */
export const katch = (leanKg: number) => 370 + 21.6 * leanKg;

/** ~7,700 kcal per kg of body-weight change (Wishnofsky 1958; a static approximation — real loss slows over time, Hall 2008). */
export const KCAL_PER_KG = 7700;

const GOAL_SIGN: Record<Goal, -1 | 0 | 1> = { "fat-loss": -1, recomp: -1, maintain: 0, "lean-gain": 1, gain: 1 };
export const DEFAULT_RATE: Record<Goal, number> = { "fat-loss": 0.5, recomp: 0.25, maintain: 0, "lean-gain": 0.25, gain: 0.5 };

/** Safe minimum without medical supervision (NIH/NHLBI): 1,200 kcal women, 1,500 kcal men. */
export const kcalFloor = (sex: Sex) => (sex === "male" ? 1500 : 1200);

// ───────────────────────── Macros ─────────────────────────

// Protein, g/kg reference weight/day. ISSN position stand (Jäger 2017): 1.4–2.0 g/kg for exercising adults;
// higher end (up to ~2.3–3.1 g/kg lean mass) during a deficit (Helms 2014).
const PROTEIN: Record<Goal, number> = { "fat-loss": 2.0, recomp: 2.0, maintain: 1.6, "lean-gain": 1.8, gain: 1.6 };
// Fat share of energy. ICMR-NIN 2020 / WHO: 20–30 % for a balanced diet.
const FAT_PCT: Record<Style, number> = { balanced: 0.25, "high-protein": 0.25, "low-carb": 0.4, keto: 0.7, diabetic: 0.3, pcos: 0.3, heart: 0.27, "high-fibre": 0.25, vrat: 0.3, sattvic: 0.25 };

export type Warning = { tone: "warn" | "alert"; text: string };

export function targets(p: ClientProfile) {
  const a = analyse(p);
  const warnings: Warning[] = [];
  const bmrM = mifflin(p.sex, p.weightKg, p.heightCm, p.age);
  const bmrK = katch(a.leanKg);
  const useKatch = p.bmrFormula === "katch";
  const bmr = useKatch ? bmrK : bmrM;
  const factor = ACTIVITY.find((x) => x.id === p.activity)?.factor ?? 1.2;
  const tdee = bmr * factor;

  // Safety gates that change the goal.
  let goal = p.goal;
  let rate = Math.max(0, p.ratePct);
  if (p.conditions.pregnant && GOAL_SIGN[goal] < 0) {
    goal = "maintain";
    warnings.push({ tone: "alert", text: "Pregnancy: no calorie deficit. Energy and weight gain must follow the obstetrician's plan; this sheet is set to maintenance." });
  }
  if (a.bmiBand.label === "Underweight" && GOAL_SIGN[goal] < 0) {
    goal = "maintain";
    warnings.push({ tone: "alert", text: "BMI is under 18.5 — a fat-loss deficit is not appropriate. Set to maintenance; consider a gain goal." });
  }
  if (p.conditions.lactating && GOAL_SIGN[goal] < 0 && rate > 0.5) {
    rate = 0.5;
    warnings.push({ tone: "warn", text: "Breastfeeding: weight loss capped at 0.5 % of body weight per week to protect milk supply." });
  }
  if (GOAL_SIGN[goal] === 0) rate = 0;

  const weeklyKg = (GOAL_SIGN[goal] * rate * p.weightKg) / 100;
  let delta = (weeklyKg * KCAL_PER_KG) / 7;
  // Cap the deficit at 25 % of TDEE.
  if (delta < -0.25 * tdee) {
    delta = -0.25 * tdee;
    warnings.push({ tone: "warn", text: "Requested rate needs a deficit above 25 % of maintenance; capped at 25 %." });
  }
  let kcal = tdee + delta;
  const floor = kcalFloor(p.sex);
  if (kcal < floor) {
    kcal = floor;
    warnings.push({ tone: "warn", text: `Calories raised to the ${floor} kcal safety floor (NIH). Go lower only under medical supervision.` });
  }
  if (p.overrides.calories && p.overrides.calories > 0) {
    kcal = p.overrides.calories;
    if (kcal < floor) warnings.push({ tone: "alert", text: `Manual calories are below the ${floor} kcal unsupervised floor.` });
  }
  kcal = Math.round(kcal / 10) * 10;

  // Protein: reference weight = actual weight, or the weight at BMI 25 when above it (avoids overshooting in obesity).
  const h = p.heightCm / 100;
  const refKg = Math.min(p.weightKg, 25 * h * h);
  let gPerKg = PROTEIN[goal];
  if (p.trainingDays === 0) gPerKg = Math.min(gPerKg, goal === "fat-loss" ? 1.4 : 1.2);
  if (p.style === "high-protein") gPerKg = Math.min(2.4, gPerKg + 0.2);
  if (p.overrides.proteinGPerKg && p.overrides.proteinGPerKg > 0) gPerKg = p.overrides.proteinGPerKg;
  if (p.conditions.ckd) {
    gPerKg = Math.min(gPerKg, 0.8);
    warnings.push({ tone: "alert", text: "Kidney disease: protein capped at 0.8 g/kg. The nephrologist or renal dietitian must set the final protein, potassium and phosphorus limits." });
  }
  let protein = Math.round(gPerKg * refKg);

  let fat: number;
  let carb: number;
  const fatPct = p.overrides.fatPct && p.overrides.fatPct > 0 ? p.overrides.fatPct / 100 : FAT_PCT[p.style];
  if (p.style === "keto") {
    carb = 50; // ketogenic: under 50 g carbohydrate/day
    fat = Math.round((kcal - protein * 4 - carb * 4) / 9);
  } else {
    fat = Math.round((kcal * Math.max(0.2, fatPct)) / 9);
    carb = Math.round((kcal - protein * 4 - fat * 9) / 4);
    const carbCapPct = p.style === "low-carb" ? 0.25 : p.style === "diabetic" ? 0.45 : 1;
    const cap = Math.round((kcal * carbCapPct) / 4);
    if (carb > cap) {
      fat += Math.round(((carb - cap) * 4) / 9);
      carb = cap;
    }
  }
  if (carb < 0 || fat < 0) {
    // Protein alone exceeds the energy budget: trim protein to leave a 20 % fat minimum.
    fat = Math.round((kcal * 0.2) / 9);
    carb = p.style === "keto" ? 50 : Math.max(0, carb);
    protein = Math.round((kcal - fat * 9 - carb * 4) / 4);
    warnings.push({ tone: "warn", text: "Protein target trimmed to fit the calorie budget." });
  }

  // Fibre: 14 g per 1,000 kcal (Dietary Guidelines for Americans 2020–2025); high-fibre style aims higher.
  const fibre = Math.round((kcal / 1000) * (p.style === "high-fibre" ? 18 : 14));
  // Water: EFSA 2010 adequate total intake 2.5 L men / 2.0 L women, ~80 % from drinks; +0.5 L per training hour.
  const drinkL = (p.sex === "male" ? 2.5 : 2.0) * 0.8;
  if (p.conditions.diabetes) warnings.push({ tone: "warn", text: "Diabetes on insulin or sulfonylureas: a calorie or carbohydrate reduction can cause low sugar. Medication must be reviewed by the doctor first; monitor glucose." });
  if (p.style === "heart") warnings.push({ tone: "warn", text: "Heart-healthy (DASH-style): plenty of vegetables, fruit, pulses and low-fat dairy; sodium ideally under 1,500 mg/day; mustard, groundnut or olive oil instead of ghee." });
  if (p.style === "vrat" && p.diet === "vegan") warnings.push({ tone: "alert", text: "Vrat foods are dairy-based (paneer, curd, milk). A vegan vrat cannot reach protein targets, so this plan uses regular vegan meals. Use a vegetarian diet for fasting days." });
  else if (p.style === "vrat") warnings.push({ tone: "warn", text: "Vrat / fasting plan uses only fasting foods (sabudana, kuttu, rajgira, singhara, potato, paneer, curd, fruit, nuts). Protein is harder to reach — use it for fasting days, not as a long-term diet." });
  if (p.conditions.hypertension) warnings.push({ tone: "warn", text: "Hypertension: keep sodium under 2,000 mg/day (WHO) — about 5 g salt including salt in cooking." });
  if (p.conditions.hypothyroid) warnings.push({ tone: "warn", text: "Hypothyroid: take levothyroxine on an empty stomach; keep soy, calcium and iron 4 hours away from the dose." });
  if (p.conditions.pcos) warnings.push({ tone: "warn", text: "PCOS: 5–10 % weight loss improves cycles and insulin resistance (International PCOS Guideline 2023). Low-GI carbs and regular strength training help." });
  if (p.age < 18) warnings.push({ tone: "alert", text: "These adult formulas are not valid under 18 years." });

  // Weekly change and time to goal follow the calories actually prescribed — after the 25 % cap,
  // the safety floor or a manual override — not the rate that was requested.
  const actualWeeklyKg = Math.round((((kcal - tdee) * 7) / KCAL_PER_KG) * 100) / 100;
  const effectiveWeeklyKg = Math.abs(actualWeeklyKg) < 0.05 ? 0 : actualWeeklyKg;
  const weeksToGoal =
    p.targetWeightKg && effectiveWeeklyKg !== 0 && Math.sign(p.targetWeightKg - p.weightKg) === Math.sign(effectiveWeeklyKg)
      ? Math.ceil(Math.abs(p.targetWeightKg - p.weightKg) / Math.abs(effectiveWeeklyKg))
      : null;

  return {
    analysis: a,
    bmrMifflin: Math.round(bmrM),
    bmrKatch: Math.round(bmrK),
    bmr: Math.round(bmr),
    bmrFormula: useKatch ? "Katch-McArdle" : "Mifflin-St Jeor",
    factor,
    tdee: Math.round(tdee),
    goal,
    rate,
    /** Expected change per week at the prescribed calories (0 within ±50 g, i.e. maintenance). */
    weeklyKg: effectiveWeeklyKg,
    /** What the chosen goal and rate asked for, before safety caps and overrides. */
    requestedWeeklyKg: Math.round(weeklyKg * 100) / 100,
    delta: Math.round(kcal - tdee),
    kcal,
    floor,
    protein,
    proteinPerKg: Math.round((protein / refKg) * 10) / 10,
    refKg: r1(refKg),
    fat,
    carb,
    fibre,
    waterRestL: r1(drinkL),
    waterTrainL: r1(drinkL + 0.5),
    sodiumMaxMg: 2000,
    potassiumMinMg: 3510, // WHO 2012: ≥90 mmol/day
    calciumMg: 1000, // ICMR-NIN 2020 RDA, adults
    ironMg: p.sex === "male" ? 19 : 29, // ICMR-NIN 2020 RDA, adults
    weeksToGoal,
    warnings,
  };
}

export type Targets = ReturnType<typeof targets>;
