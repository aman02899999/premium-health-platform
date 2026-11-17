// Two shareable "desi" tools: real protein need with an Indian plate, and a desi diet habit score.
// Pure: the calculator UI, the share-card image route and the tests all use these.
//
// Sources (shown on the tool pages too):
// - Protein per kg: same targets as the macro calculator (1.6–2.0 g/kg), inside the 1.4–2.0 g/kg
//   range of the International Society of Sports Nutrition position stand (Jäger et al., 2017).
// - Food protein: Indian Food Composition Tables 2017 (ICMR-National Institute of Nutrition),
//   rounded per home portion.
// - Diet score habits: ICMR-NIN Dietary Guidelines for Indians, 2024.
import type { Goal } from "./calculators";

export type Diet = "veg" | "egg" | "nonveg";

export const PROTEIN_PER_KG: Record<Goal, number> = { lose: 2.0, maintain: 1.6, gain: 1.8 };

/** One home portion and its protein in grams (IFCT 2017, rounded). */
type Food = { id: string; label: string; unit: string; protein: number; max: number; diets: Diet[] };

// Everyday base: what a normal Indian day already gives before any "extra" protein.
const BASE: { food: Food; count: number }[] = [
  { food: { id: "roti", label: "roti", unit: "", protein: 3.5, max: 4, diets: ["veg", "egg", "nonveg"] }, count: 4 },
  { food: { id: "dal", label: "katori dal", unit: "", protein: 7, max: 2, diets: ["veg", "egg", "nonveg"] }, count: 2 },
  { food: { id: "curd", label: "katori curd", unit: "", protein: 6, max: 1, diets: ["veg", "egg", "nonveg"] }, count: 1 },
  { food: { id: "milk", label: "glass milk", unit: "", protein: 8, max: 1, diets: ["veg", "egg", "nonveg"] }, count: 1 },
];

// Extras, in the order we add them for each diet. Counts are capped so the plate stays realistic.
const EXTRAS: Food[] = [
  { id: "chicken", label: "chicken (raw weight)", unit: "100 g", protein: 21, max: 2, diets: ["nonveg"] },
  { id: "egg", label: "eggs", unit: "", protein: 6, max: 4, diets: ["egg", "nonveg"] },
  { id: "paneer", label: "paneer", unit: "100 g", protein: 18, max: 2, diets: ["veg", "egg"] },
  { id: "soya", label: "soya chunks (dry)", unit: "30 g", protein: 15, max: 2, diets: ["veg", "egg", "nonveg"] },
  { id: "chana", label: "katori chana or rajma", unit: "", protein: 7, max: 2, diets: ["veg", "egg", "nonveg"] },
  { id: "peanuts", label: "peanuts", unit: "30 g", protein: 7.5, max: 1, diets: ["veg", "egg", "nonveg"] },
];

export type PlateItem = { id: string; text: string; protein: number };

function itemText(f: Food, count: number): string {
  if (f.unit.endsWith(" g")) return `${Number(f.unit.replace(" g", "")) * count} g ${f.label}`;
  return `${count} ${f.label}`;
}

export function proteinNeed(weightKg: number, goal: Goal, diet: Diet) {
  const perKg = PROTEIN_PER_KG[goal];
  const grams = Math.round(weightKg * perKg);
  const plate: PlateItem[] = BASE.map(({ food, count }) => ({ id: food.id, text: itemText(food, count), protein: food.protein * count }));
  let total = plate.reduce((s, p) => s + p.protein, 0);
  for (const f of EXTRAS.filter((e) => e.diets.includes(diet))) {
    let n = 0;
    while (total < grams && n < f.max) {
      n++;
      total += f.protein;
    }
    if (n) plate.push({ id: f.id, text: itemText(f, n), protein: f.protein * n });
  }
  const covered = Math.round(total);
  return { grams, perKg, plate, covered, short: Math.max(0, grams - covered) };
}

// ---------- Desi diet score ----------

export type DietQuestion = { id: string; q: string; options: [string, string, string]; good: string; fix: string };

/** Each answer scores 2 (best), 1 or 0. Options are listed best first. */
export const DIET_QUESTIONS: DietQuestion[] = [
  { id: "veg", q: "Sabzi or salad at two or more meals a day?", options: ["Almost every day", "Some days", "Rarely"], good: "Sabzi at most meals", fix: "Add a katori of sabzi to lunch and dinner" },
  { id: "protein", q: "Dal, paneer, curd, egg or chicken in every main meal?", options: ["Every meal", "One meal a day", "Rarely"], good: "Protein in every meal", fix: "Put dal, curd or paneer in every main meal" },
  { id: "sugar", q: "Sugary chai, cold drinks or packaged juice?", options: ["Once a day or less", "2–3 a day", "4 or more a day"], good: "Little added sugar", fix: "Cut one sugary chai or cold drink a day" },
  { id: "fried", q: "Samosa, pakora, bhujia, chips or other fried snacks?", options: ["Once a week or less", "2–4 times a week", "Most days"], good: "Fried snacks kept rare", fix: "Swap the fried snack for chana or fruit" },
  { id: "grains", q: "Whole wheat, millets or brown rice instead of maida and white rice?", options: ["Most days", "Sometimes", "Rarely"], good: "Whole grains most days", fix: "Swap maida for atta, bajra or jowar" },
  { id: "water", q: "About 8 glasses of water a day?", options: ["Yes", "Around 5", "Fewer"], good: "Good water intake", fix: "Keep a bottle on your desk and finish it twice" },
  { id: "home", q: "Home-cooked food most days?", options: ["6–7 days a week", "3–5 days", "2 or fewer"], good: "Mostly home food", fix: "Cook at home two more days a week" },
  { id: "dinner", q: "Dinner at least 2 hours before sleep?", options: ["Most nights", "Some nights", "Rarely"], good: "Early dinner", fix: "Finish dinner 2 hours before bed" },
];

export type DietAnswers = (0 | 1 | 2)[]; // index into options: 0 = best

export function dietScore(answers: DietAnswers) {
  const points = answers.reduce<number>((s, a) => s + (2 - a), 0);
  const score = Math.round((points / (DIET_QUESTIONS.length * 2)) * 100);
  const band =
    score >= 80 ? "Desi diet champion" : score >= 60 ? "Solid, a few easy fixes" : score >= 40 ? "Halfway there" : "Lots of easy wins ahead";
  // Best habit: first question answered best. Next fix: the worst-answered question.
  const bestIdx = answers.findIndex((a) => a === 0);
  let worstIdx = -1;
  answers.forEach((a, i) => {
    if (a > 0 && (worstIdx === -1 || a > answers[worstIdx])) worstIdx = i;
  });
  return {
    score,
    band,
    best: bestIdx >= 0 ? DIET_QUESTIONS[bestIdx].good : null,
    fix: worstIdx >= 0 ? DIET_QUESTIONS[worstIdx].fix : null,
  };
}

export function encodeAnswers(a: DietAnswers): string {
  return a.join("");
}

export function decodeAnswers(s: string | null): DietAnswers | null {
  if (!s || s.length !== DIET_QUESTIONS.length || !/^[012]+$/.test(s)) return null;
  return s.split("").map((c) => Number(c) as 0 | 1 | 2);
}
