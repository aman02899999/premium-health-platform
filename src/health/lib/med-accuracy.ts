/**
 * Central source of truth for verified medical formulas, cut-offs and ranges.
 * Every constant cites its guideline so calculators and content stay 100% consistent.
 */

export const BMI_ASIAN = {
  source: "WHO Asia-Pacific / Misra et al. — Asian-Indian cut-offs",
  underweight: 18.5,
  healthyMax: 22.9,
  overweightMax: 24.9,
  obeseIMax: 29.9,
} as const;

export function bmiCategory(bmi: number): { label: string; tone: "ok" | "warn" | "alert" } {
  if (!Number.isFinite(bmi)) return { label: "Enter valid height and weight", tone: "warn" };
  if (bmi < BMI_ASIAN.underweight) return { label: "Underweight (<18.5)", tone: "warn" };
  if (bmi <= BMI_ASIAN.healthyMax) return { label: "Healthy — Asian range (18.5–22.9)", tone: "ok" };
  if (bmi <= BMI_ASIAN.overweightMax) return { label: "Overweight — Asian range (23–24.9)", tone: "warn" };
  if (bmi <= BMI_ASIAN.obeseIMax) return { label: "Obese class I (25–29.9)", tone: "alert" };
  return { label: "Obese class II (≥30)", tone: "alert" };
}

/** Mifflin-St Jeor (1990) — validated as most accurate RMR predictor for adults. */
export function mifflinStJeor(weightKg: number, heightCm: number, ageYears: number, sex: "male" | "female"): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + (sex === "male" ? 5 : -161);
}

export const TDEE_FACTORS = [
  { value: 1.2, label: "Sedentary — desk job, little exercise" },
  { value: 1.375, label: "Light — walk/exercise 1–3 days/week" },
  { value: 1.55, label: "Moderate — exercise 3–5 days/week" },
  { value: 1.725, label: "Active — hard exercise 6–7 days/week" },
  { value: 1.9, label: "Very active — physical job + daily training" },
] as const;

/** ICMR-NIN 2020 RDA protein 0.83 g/kg; therapeutic ranges per ISSN/ADA guidance. */
export const PROTEIN_TARGETS = [
  { value: 0.83, label: "ICMR RDA baseline (0.83)" },
  { value: 1.0, label: "Lightly active (1.0)" },
  { value: 1.2, label: "Weight loss, preserve muscle (1.2)" },
  { value: 1.4, label: "Active / training (1.4)" },
  { value: 1.6, label: "Muscle gain (1.6)" },
] as const;

/**
 * Indian Diabetes Risk Score (IDRS) — Mohan et al., Madras Diabetes Research Foundation.
 * Age: <35=0, 35–49=20, ≥50=30 · Waist: M<90/F<80=0, M90–99/F80–89=10, M≥100/F≥90=20 ·
 * Activity: vigorous=0, moderate=10, mild=20, none=30 · Family: none=0, one parent=10, both=20.
 * Total: <30 low, 30–50 medium, ≥60 high.
 */
export type IdrdInput = { ageBand: 0 | 20 | 30; waistBand: 0 | 10 | 20; activityBand: 0 | 10 | 20 | 30; familyBand: 0 | 10 | 20 };
export function idrsScore(i: IdrdInput): { score: number; level: "Low" | "Medium" | "High"; advice: string } {
  const score = i.ageBand + i.waistBand + i.activityBand + i.familyBand;
  if (score < 30) return { score, level: "Low", advice: "Maintain healthy habits and retest every 1–2 years after age 30." };
  if (score <= 50) return { score, level: "Medium", advice: "Get HbA1c + fasting glucose tested and adopt the prediabetes diet + 150 min/week activity plan." };
  return { score, level: "High", advice: "Get tested promptly (HbA1c, fasting + 2-hr glucose) and discuss a prevention plan with your doctor." };
}

export const WHR_CUTOFF = { value: 0.5, source: "Systematic reviews: keep waist < half of height (all ethnicities)" };

export const WATER_GUIDANCE = {
  mlPerKg: 35,
  source: "Clinical baseline 30–35 ml/kg/day (EFSA adequate intake ≈ 2.5 L men / 2.0 L women from all sources)",
};

/** Verified diagnostic cut-offs used across content. */
export const DIAGNOSTIC_CUTOFFS = {
  hba1c: { normal: "<5.7%", prediabetes: "5.7–6.4%", diabetes: "≥6.5% (ADA/EASD, confirm on repeat)", source: "ADA Standards of Care" },
  fasting: { normal: "<100 mg/dL", prediabetes: "100–125 mg/dL", diabetes: "≥126 mg/dL (confirm)", source: "ADA Standards of Care" },
  bpClinic: { normal: "<120/80", hypertension: "≥140/90 mmHg (clinic, repeated)", home: "≥135/85 mmHg (home average)", source: "WHO HEARTS / ESC" },
  tsh: { range: "0.4–4.5 mIU/L (lab-specific, morning sample)", source: "ATA guidelines" },
  ldl: { optimal: "<100 mg/dL; <70 for very-high risk", source: "AHA/ACC + Lipid Association of India" },
  vitaminD: { deficient: "<20 ng/mL", insufficient: "20–30 ng/mL", sufficient: "30–100 ng/mL", source: "Endocrine Society" },
  b12: { deficient: "<200 pg/mL", borderline: "200–300 pg/mL", desirable: ">300 pg/mL", source: "Clinical consensus" },
} as const;

export function clamp(n: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
