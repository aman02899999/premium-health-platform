// Evidence-based supplement and lifestyle notes for Diet Pro. Conservative by design:
// nothing here replaces a doctor's advice, and tests come before pills.
import { exerciseBySlug, type Muscle } from "@/lib/fitness/exercises";
import { generatePlan, type PlanDay, type PlanGoal } from "@/lib/fitness/planner";
import type { ClientProfile } from "./types";

export type Note = { title: string; text: string; source: string };

export function supplements(p: ClientProfile): Note[] {
  const out: Note[] = [];
  const c = p.conditions;
  if (p.useWhey)
    out.push({ title: "Whey protein", text: "Counted in the meal plan as food (see the label values used). Use it only to close a protein gap, not on top of the plan.", source: "ISSN position stand: protein and exercise (Jäger et al., 2017)" });
  if (p.trainingDays >= 2 && !c.ckd && !c.pregnant)
    out.push({ title: "Creatine monohydrate", text: "3–5 g daily with any meal, every day. No loading phase needed. Drink normally.", source: "ISSN position stand: creatine (Kreider et al., 2017)" });
  out.push({ title: "Vitamin D", text: "Test serum 25(OH)D first. Supplement only if low, at the dose the doctor prescribes; get 15–20 min of midday sun on arms and legs where practical.", source: "ICMR-NIN Nutrient Requirements for Indians, 2020" });
  if (p.diet === "vegan" || p.diet === "veg" || p.diet === "jain")
    out.push({ title: "Vitamin B12", text: "Vegetarian and vegan diets are often short of B12. Check serum B12; vegans usually need a supplement.", source: "ICMR-NIN 2020" });
  if (p.sex === "female" && !c.pregnant)
    out.push({ title: "Iron", text: "Check haemoglobin and ferritin. Take iron only if deficient; pair iron-rich meals with vitamin C (lemon, guava, amla) and keep tea/coffee an hour away.", source: "ICMR-NIN 2020; Anaemia Mukt Bharat" });
  if (p.diet !== "nonveg")
    out.push({ title: "Omega-3", text: "No fish in the diet: include flaxseed, chia or walnuts daily (in the plan). An algae-oil EPA/DHA supplement is optional.", source: "WHO/FAO fats and fatty acids in human nutrition, 2010" });
  // Condition-specific herbs and supplements (myo-inositol, isabgol, omega-3, iron, calcium…) live in herbs.ts.
  if (p.trainingDays >= 3 && !c.hypertension && !c.pregnant)
    out.push({ title: "Caffeine (optional)", text: "3 mg/kg 45–60 min before training improves performance. Not after 4 pm; skip if it disturbs sleep.", source: "ISSN position stand: caffeine (Guest et al., 2021)" });
  return out;
}

export function lifestyle(p: ClientProfile): Note[] {
  return [
    { title: "Weigh-ins", text: "Weigh 3 mornings a week after the toilet, before food; track the weekly average, not single days. Re-measure waist every 2 weeks.", source: "Coaching practice" },
    { title: "Activity", text: "Aim for 150–300 min/week of moderate activity plus 2 or more strength sessions; 7,000–10,000 steps a day is a practical target.", source: "WHO guidelines on physical activity and sedentary behaviour, 2020" },
    { title: "Sleep", text: "7–9 hours. Short sleep raises hunger and reduces fat lost during a diet.", source: "Nedeltcheva et al., Ann Intern Med 2010" },
    { title: "Salt & sugar", text: "Under 5 g salt a day (all sources) and under 10 % of energy from added sugar — less than 5 % is better.", source: "WHO sodium (2012) and sugars (2015) guidelines" },
    { title: "Cooking", text: "Weigh grains and dals raw, meat as stated in the plan. Measure oil with a teaspoon (1 tsp ≈ 5 g); it is the easiest place for hidden calories.", source: "Plan convention" },
    ...(p.style === "diabetic" || p.conditions.diabetes
      ? [{ title: "Glucose", text: "Keep carbohydrate portions consistent day to day, eat vegetables and protein first in a meal, and walk 10–15 min after meals.", source: "ADA Standards of Care 2025; ICMR guidelines for T2DM 2018" }]
      : []),
  ];
}

const GOAL_MAP: Record<ClientProfile["goal"], PlanGoal> = { "fat-loss": "fat-loss", recomp: "muscle", maintain: "general", "lean-gain": "muscle", gain: "muscle" };

export type TrainingDay = PlanDay & { muscles: Muscle[] };

export function training(p: ClientProfile): TrainingDay[] {
  if (p.trainingDays < 2) return [];
  return generatePlan({ goal: GOAL_MAP[p.goal], days: p.trainingDays, level: p.level, setting: p.setting }).map((d) => {
    const set = new Set<Muscle>();
    for (const it of d.items) {
      const ex = exerciseBySlug(it.slug);
      if (!ex) continue;
      if (ex.primary !== "cardio") set.add(ex.primary);
      for (const s of ex.secondary) if (s !== "cardio") set.add(s);
    }
    return { ...d, muscles: [...set] };
  });
}
