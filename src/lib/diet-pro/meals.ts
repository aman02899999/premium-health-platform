/**
 * Diet Pro meal planner. Each meal is a template (one protein, one carb and one fat
 * "lever" food plus fixed vegetables/sides). The lever quantities are solved by bounded
 * weighted least squares so the meal hits its protein/carb/fat share of the day,
 * then rounded to kitchen-friendly amounts. Reported totals are always recomputed
 * from the rounded grams, never copied from the targets.
 */
import { FOOD_DB } from "./foods";
import type { ClientProfile, FoodItem, Macro } from "./types";
import type { Targets } from "./engine";

export type Slot = "breakfast" | "snack" | "lunch" | "dinner" | "bedtime";

type Template = {
  name: string;
  slot: Slot[];
  /** Candidate ids per lever; the first one the client may eat is used. */
  p: string[];
  c?: string[];
  f?: string[];
  fixed?: [string, number][];
  needsWhey?: boolean;
};

const T = (name: string, slot: Slot[], p: string[], c: string[] | undefined, f: string[] | undefined, fixed: [string, number][] = [], needsWhey = false): Template => ({ name, slot, p, c, f, fixed, needsWhey });

export const TEMPLATES: Template[] = [
  // Breakfast
  T("Oats bowl with hung curd & chia", ["breakfast"], ["greekYogurt"], ["oats"], ["chia", "flaxseed"], [["banana", 60]]),
  T("Protein oats (whey)", ["breakfast"], ["whey"], ["oats"], ["peanutButter", "almonds"], [["milkLowFat", 200]], true),
  T("Paneer bhurji with phulka", ["breakfast"], ["paneer"], ["atta"], ["ghee", "mustardOil"], [["onion", 40], ["tomato", 50], ["capsicum", 40]]),
  T("Egg-white omelette with toast", ["breakfast"], ["eggWhite"], ["breadWholeWheat"], ["egg"], [["tomato", 50], ["onion", 30], ["spinach", 30]]),
  T("Moong-rava chilla with hung-curd dip", ["breakfast"], ["greekYogurt", "tofu"], ["suji", "oats"], ["mustardOil", "oliveOil"], [["moongDal", 40], ["tomato", 40], ["onion", 30]]),
  T("Tofu bhurji with phulka", ["breakfast"], ["tofu"], ["atta", "jowar"], ["mustardOil", "oliveOil"], [["tomato", 50], ["onion", 40], ["capsicum", 40]]),
  T("Poha with hung curd", ["breakfast"], ["greekYogurt"], ["poha"], ["peanuts", "almonds"], [["peas", 30], ["onion", 30]]),
  T("Ragi porridge with milk", ["breakfast"], ["greekYogurt"], ["ragi"], ["almonds", "walnuts"], [["milkLowFat", 150]]),
  // Lunch
  T("Paneer sabzi, dal, phulka & salad", ["lunch"], ["paneer"], ["atta"], ["ghee", "mustardOil"], [["moongDal", 30], ["cauliflower", 150], ["cucumber", 100], ["tomato", 50]]),
  T("Soya chunk curry, rice, dal & curd", ["lunch"], ["soyaChunks"], ["riceWhite"], ["mustardOil", "oliveOil"], [["toorDal", 30], ["beans", 150], ["curd", 100]]),
  T("Chicken curry, rice, dal & salad", ["lunch"], ["chickenBreast"], ["riceWhite"], ["mustardOil", "oliveOil"], [["masoorDal", 25], ["spinach", 100], ["cucumber", 100]]),
  T("Fish curry with phulka & lauki", ["lunch"], ["rohu"], ["atta"], ["mustardOil", "oliveOil"], [["toorDal", 25], ["lauki", 150], ["cucumber", 100]]),
  T("Egg curry, rice & cabbage sabzi", ["lunch"], ["eggWhite"], ["riceWhite"], ["egg"], [["moongDal", 25], ["cabbage", 150], ["tomato", 50]]),
  T("Tofu, rajma & brown rice bowl", ["lunch"], ["tofu"], ["riceBrown"], ["mustardOil", "oliveOil"], [["rajma", 30], ["spinach", 100], ["cucumber", 100]]),
  T("Rajma chawal with raita & salad", ["lunch"], ["greekYogurt", "tofu"], ["riceWhite"], ["ghee", "mustardOil"], [["rajma", 40], ["cucumber", 100]]),
  T("Mutton curry with bajra roti", ["lunch"], ["goatLeg"], ["bajra", "atta"], ["mustardOil"], [["onion", 40], ["tomato", 50], ["cucumber", 100]]),
  T("Chole with jowar roti & raita", ["lunch"], ["greekYogurt", "tofu"], ["jowar", "atta"], ["mustardOil", "oliveOil"], [["kalaChana", 40], ["onion", 30], ["tomato", 50]]),
  // Dinner
  T("Paneer tikka, salad & jowar roti", ["dinner"], ["paneer"], ["jowar", "atta"], ["mustardOil", "oliveOil"], [["capsicum", 60], ["onion", 40], ["cucumber", 100], ["tomato", 50]]),
  T("Grilled chicken, veg & quinoa", ["dinner"], ["chickenBreast"], ["quinoa", "riceBrown"], ["oliveOil", "mustardOil"], [["broccoli", 100], ["carrot", 50], ["capsicum", 50]]),
  T("Moong dal, paneer bhurji & phulka", ["dinner"], ["paneer", "tofu"], ["atta", "jowar"], ["ghee", "mustardOil"], [["moongDal", 30], ["lauki", 150], ["cucumber", 100]]),
  T("Fish curry, rice & palak", ["dinner"], ["rohu", "salmon"], ["riceWhite"], ["mustardOil", "oliveOil"], [["spinach", 100], ["tomato", 50]]),
  T("Tofu & veg stir-fry with brown rice", ["dinner"], ["tofu"], ["riceBrown"], ["sesame", "oliveOil"], [["broccoli", 100], ["capsicum", 60], ["mushroom", 60]]),
  T("Egg bhurji, mushroom & phulka", ["dinner"], ["eggWhite"], ["atta"], ["egg"], [["mushroom", 60], ["spinach", 80], ["onion", 30]]),
  T("Prawn curry with rice & beans", ["dinner"], ["prawns", "tuna"], ["riceWhite"], ["mustardOil", "oliveOil"], [["beans", 100], ["tomato", 50]]),
  T("Soya veg pulao with curd", ["dinner"], ["soyaChunks"], ["riceBrown"], ["ghee", "mustardOil"], [["peas", 40], ["carrot", 40], ["beans", 50], ["curd", 100]]),
  // Snacks
  T("Hung curd, fruit & nuts", ["snack"], ["greekYogurt"], ["apple", "guava", "papaya"], ["almonds", "walnuts", "pumpkinSeed"]),
  T("Whey shake with banana & peanut butter", ["snack"], ["whey"], ["banana"], ["peanutButter", "almonds"], [], true),
  T("Soya-chunk chaat with fruit", ["snack"], ["soyaChunks", "paneer"], ["orange", "apple"], undefined, [["tomato", 40], ["onion", 20]]),
  T("Boiled eggs with fruit", ["snack"], ["egg"], ["apple", "orange"], undefined),
  T("Tofu, fruit & pumpkin seeds", ["snack"], ["tofu"], ["guava", "apple"], ["pumpkinSeed", "flaxseed"]),
  T("Sprouts chaat with hung curd", ["snack"], ["greekYogurt", "tofu"], ["apple", "guava"], ["peanuts", "pumpkinSeed"], [["sprouts", 100], ["tomato", 40], ["cucumber", 50]]),
  // Bedtime
  T("Hung curd with walnuts", ["bedtime"], ["greekYogurt", "paneer"], undefined, ["walnuts", "almonds", "chia"]),
  T("Tofu with seeds", ["bedtime"], ["tofu"], undefined, ["pumpkinSeed", "flaxseed"]),
];

/** Meal slots and their share of the day's energy. */
export const MEAL_LAYOUT: Record<3 | 4 | 5 | 6, { slot: Slot; label: string; pct: number }[]> = {
  3: [{ slot: "breakfast", label: "Breakfast", pct: 30 }, { slot: "lunch", label: "Lunch", pct: 40 }, { slot: "dinner", label: "Dinner", pct: 30 }],
  4: [{ slot: "breakfast", label: "Breakfast", pct: 25 }, { slot: "lunch", label: "Lunch", pct: 35 }, { slot: "snack", label: "Evening snack", pct: 15 }, { slot: "dinner", label: "Dinner", pct: 25 }],
  5: [{ slot: "breakfast", label: "Breakfast", pct: 25 }, { slot: "snack", label: "Mid-morning snack", pct: 10 }, { slot: "lunch", label: "Lunch", pct: 30 }, { slot: "snack", label: "Evening snack", pct: 15 }, { slot: "dinner", label: "Dinner", pct: 20 }],
  6: [{ slot: "breakfast", label: "Breakfast", pct: 20 }, { slot: "snack", label: "Mid-morning snack", pct: 10 }, { slot: "lunch", label: "Lunch", pct: 25 }, { slot: "snack", label: "Evening snack", pct: 15 }, { slot: "dinner", label: "Dinner", pct: 20 }, { slot: "bedtime", label: "Bedtime", pct: 10 }],
};

const DIET_RANK = { vegan: 0, veg: 1, egg: 2, nonveg: 3 } as const;
const ALLOWED_RANK: Record<ClientProfile["diet"], number> = { vegan: 0, veg: 1, jain: 1, egg: 2, nonveg: 3 };
// Lower-GI swaps for diabetes / PCOS styles.
const LOW_GI: Record<string, string> = { riceWhite: "riceBrown", poha: "oats", banana: "apple", dates: "guava", breadWholeWheat: "atta" };
const STARCHY = new Set(["potato", "sweetPotato", "peas", "banana", "dates"]);

export function wheyFood(p: ClientProfile): FoodItem {
  const k = 100 / Math.max(1, p.whey.scoopG);
  return {
    id: "whey", name: "Whey protein (client's label)", kcal: p.whey.kcal * k, p: p.whey.p * k, c: p.whey.c * k, f: p.whey.f * k, fib: 0, ca: 0, fe: 0, na: 0, k: 0,
    diet: "veg", allergen: "dairy", jain: true, role: "protein", unit: "g", state: "powder", hint: `1 scoop = ${p.whey.scoopG} g`,
    source: { db: "LABEL", ref: "label", desc: "Product nutrition label entered by the coach" },
  };
}

export function foodTable(p: ClientProfile, extra: FoodItem[] = []): Map<string, FoodItem> {
  const m = new Map(FOOD_DB.map((f) => [f.id, f]));
  m.set("whey", wheyFood(p));
  for (const f of extra) m.set(f.id, f);
  return m;
}

export function allowed(food: FoodItem | undefined, p: ClientProfile): boolean {
  if (!food) return false;
  if (DIET_RANK[food.diet] > ALLOWED_RANK[p.diet]) return false;
  if (p.diet === "jain" && !food.jain) return false;
  if (food.allergen && p.allergies.includes(food.allergen)) return false;
  if (food.id === "whey" && !p.useWhey) return false;
  if (p.style === "keto" && STARCHY.has(food.id)) return false;
  return true;
}

function pick(ids: string[] | undefined, p: ClientProfile, foods: Map<string, FoodItem>): FoodItem | null {
  if (!ids) return null;
  for (const raw of ids) {
    const id = (p.style === "diabetic" || p.style === "pcos") && LOW_GI[raw] ? LOW_GI[raw] : raw;
    const f = foods.get(id);
    if (allowed(f, p)) return f!;
    const orig = foods.get(raw);
    if (id !== raw && allowed(orig, p)) return orig!;
  }
  return null;
}

/** Templates usable for a slot, already resolved to concrete foods. */
export function resolvedTemplates(slot: Slot, p: ClientProfile, foods: Map<string, FoodItem>) {
  const keto = p.style === "keto";
  const out: { name: string; p: FoodItem; c: FoodItem | null; f: FoodItem | null; fixed: [FoodItem, number][] }[] = [];
  for (const t of TEMPLATES) {
    if (!t.slot.includes(slot) || (t.needsWhey && !p.useWhey)) continue;
    const pf = pick(t.p, p, foods);
    if (!pf) continue;
    const cf = keto ? null : pick(t.c, p, foods);
    if (t.c && !cf && !keto) continue;
    const ff = pick(t.f, p, foods);
    if (t.f && !ff) continue;
    const fixed: [FoodItem, number][] = [];
    for (const [id, g] of t.fixed ?? []) {
      const swap = (p.style === "diabetic" || p.style === "pcos") && LOW_GI[id] ? LOW_GI[id] : id;
      const fd = foods.get(swap);
      if (!allowed(fd, p)) continue;
      if (keto && (fd!.role === "legume" || fd!.role === "fruit" || fd!.role === "carb")) continue;
      fixed.push([fd!, g]);
    }
    out.push({ name: t.name, p: pf, c: cf, f: ff, fixed });
  }
  return out;
}

// ───────────────────────── Solver ─────────────────────────

const BOUNDS: Record<string, [number, number]> = {
  whey: [10, 50], soyaChunks: [10, 70], eggWhite: [33, 330], egg: [0, 150], greekYogurt: [40, 350], paneer: [25, 200], tofu: [30, 300],
  breadWholeWheat: [30, 200], peanutButter: [0, 32], moongDal: [20, 90], rajma: [20, 90], kalaChana: [20, 90], sprouts: [50, 250],
  chia: [0, 25], flaxseed: [0, 25], pumpkinSeed: [0, 30], sesame: [0, 20],
};
const ROLE_BOUNDS: Record<FoodItem["role"], [number, number]> = { protein: [25, 250], carb: [15, 250], legume: [20, 90], dairy: [50, 350], fat: [0, 40], veg: [0, 300], fruit: [50, 300] };
const OILS = new Set(["ghee", "mustardOil", "groundnutOil", "oliveOil"]);

export type BoundsFn = (f: FoodItem) => [number, number];

/**
 * Portion limits for one meal. They grow with the meal's energy (a 1,000 kcal lunch can hold more
 * rice than a 400 kcal one) and fat limits widen for low-carb and keto, where fat carries the energy.
 */
export function mealBounds(mealKcal: number, style: ClientProfile["style"]): BoundsFn {
  const scale = Math.max(1, mealKcal / 700);
  const fatScale = style === "keto" ? 2.5 : style === "low-carb" ? 1.6 : 1;
  return (f) => {
    const [lo, hi0] = BOUNDS[f.id] ?? ROLE_BOUNDS[f.role];
    let hi = hi0 * scale;
    if (f.role === "fat") hi = (OILS.has(f.id) ? 25 : hi0) * scale * fatScale;
    if (style === "keto" && (f.id === "paneer" || f.id === "tofu" || f.id === "egg")) hi *= 1.5;
    return [lo, hi];
  };
}
const defaultBounds: BoundsFn = (f) => BOUNDS[f.id] ?? ROLE_BOUNDS[f.role];

/** Solve a small linear system (Gaussian elimination with partial pivoting). */
function solve(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    if (Math.abs(M[piv][col]) < 1e-12) return null;
    [M[col], M[piv]] = [M[piv], M[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const k = M[r][col] / M[col][col];
      for (let c = col; c <= n; c++) M[r][c] -= k * M[col][c];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

const W = [3, 1, 2.5]; // weights for protein, carbs, fat errors: protein accuracy first, then fat (it moves calories most)

/**
 * Bounded weighted least squares for up to three lever foods.
 * x in grams; returns grams per food. Active-set: clamp the worst violator, re-solve the rest.
 */
export function solveLevers(levers: FoodItem[], target: { p: number; c: number; f: number }, bounds: BoundsFn = defaultBounds): number[] {
  const col = (f: FoodItem) => [f.p / 100, f.c / 100, f.f / 100];
  const t = [target.p, target.c, target.f];
  const x = levers.map(() => 0);
  const free = new Set(levers.map((_, i) => i));
  for (let iter = 0; iter < 6 && free.size; iter++) {
    const idx = [...free];
    const fixedContrib = [0, 0, 0];
    levers.forEach((f, i) => {
      if (!free.has(i)) col(f).forEach((v, k) => (fixedContrib[k] += v * x[i]));
    });
    const resid = t.map((v, k) => v - fixedContrib[k]);
    // Normal equations with a tiny ridge so near-collinear foods stay solvable.
    const A = idx.map((i) => idx.map((j) => col(levers[i]).reduce((s, v, k) => s + W[k] * v * col(levers[j])[k], 0) + (i === j ? 1e-6 : 0)));
    const b = idx.map((i) => col(levers[i]).reduce((s, v, k) => s + W[k] * v * resid[k], 0));
    const sol = solve(A, b) ?? idx.map(() => 0);
    let worst = -1;
    let worstBy = 0;
    idx.forEach((i, n) => {
      const [lo, hi] = bounds(levers[i]);
      const v = sol[n];
      x[i] = v;
      const by = v < lo ? lo - v : v > hi ? v - hi : 0;
      if (by > worstBy) [worst, worstBy] = [i, by];
    });
    if (worst < 0) break;
    const [lo, hi] = bounds(levers[worst]);
    x[worst] = Math.min(hi, Math.max(lo, x[worst]));
    free.delete(worst);
  }
  return levers.map((f, i) => {
    const [lo, hi] = bounds(f);
    return Math.min(hi, Math.max(lo, x[i]));
  });
}

/** Kitchen rounding: eggs by the piece, fats to 1 g, everything else to 5 g. */
export function roundGrams(f: FoodItem, g: number): number {
  if (f.id === "egg") return Math.round(g / 50) * 50;
  if (f.id === "eggWhite") return Math.max(33, Math.round(g / 33) * 33);
  if (f.id === "whey") return Math.round(g);
  if (f.role === "fat") return Math.round(g);
  return Math.round(g / 5) * 5;
}

export function display(f: FoodItem, g: number): string {
  if (f.id === "egg") return `${g / 50} whole egg${g === 50 ? "" : "s"} (${g} g)`;
  if (f.id === "eggWhite") return `${Math.round(g / 33)} egg white${Math.round(g / 33) === 1 ? "" : "s"} (${g} g)`;
  if (f.id === "whey") {
    const scoop = Number(/=\s*([\d.]+)/.exec(f.hint ?? "")?.[1]) || g;
    return `${g} g (${Math.round((g / scoop) * 10) / 10} scoop)`;
  }
  if (f.id === "atta") return `${g} g atta ≈ ${Math.max(1, Math.round(g / 30))} phulka`;
  return `${g} ${f.unit}`;
}

export type PlanItem = { food: FoodItem; grams: number; label: string; macro: Macro; fib: number; ca: number; fe: number; na: number; k: number };
export type PlannedMeal = { slot: Slot; label: string; pct: number; template: string; options: number; choice: number; target: Macro; items: PlanItem[]; total: Macro };
export type PlannedDay = { day: number; meals: PlannedMeal[]; total: Macro & { fib: number; ca: number; fe: number; na: number; k: number } };

export function itemFor(food: FoodItem, grams: number): PlanItem {
  const k = grams / 100;
  return {
    food, grams, label: display(food, grams),
    macro: { kcal: food.kcal * k, p: food.p * k, c: food.c * k, f: food.f * k },
    fib: food.fib * k, ca: food.ca * k, fe: food.fe * k, na: food.na * k, k: food.k * k,
  };
}

const sum = (items: PlanItem[]): Macro => items.reduce((s, i) => ({ kcal: s.kcal + i.macro.kcal, p: s.p + i.macro.p, c: s.c + i.macro.c, f: s.f + i.macro.f }), { kcal: 0, p: 0, c: 0, f: 0 });

export function planMeal(slot: Slot, label: string, pct: number, t: Targets, p: ClientProfile, foods: Map<string, FoodItem>, choice: number, adjust?: Macro, extras: [FoodItem, number][] = []): PlannedMeal | null {
  const options = resolvedTemplates(slot, p, foods);
  if (!options.length) return null;
  const i = ((choice % options.length) + options.length) % options.length;
  const tpl = options[i];
  const share = pct / 100;
  const target: Macro = { kcal: t.kcal * share, p: t.protein * share, c: t.carb * share, f: t.fat * share };
  if (adjust) {
    target.p += adjust.p;
    target.c += adjust.c;
    target.f += adjust.f;
  }
  // Coach-added foods are fixed amounts; the lever foods re-balance around them.
  const fixedItems = [...tpl.fixed, ...extras].map(([f, g]) => itemFor(f, g));
  const fx = sum(fixedItems);
  const levers = [tpl.p, tpl.c, tpl.f].filter((f): f is FoodItem => !!f);
  // Remove duplicates (e.g. egg as both protein and fat lever is fine; same id twice is not).
  const uniq = levers.filter((f, n) => levers.findIndex((g) => g.id === f.id) === n);
  const grams = solveLevers(uniq, { p: Math.max(0, target.p - fx.p), c: Math.max(0, target.c - fx.c), f: Math.max(0, target.f - fx.f) }, mealBounds(target.kcal, p.style));
  const leverItems = uniq.map((f, n) => itemFor(f, roundGrams(f, grams[n]))).filter((it) => it.grams > 0);
  const items = [...leverItems, ...fixedItems];
  // Top up fat with cooking oil when the template's own fat sources ran out (e.g. eggs as the only fat).
  const fatGap = target.f - sum(items).f;
  if (fatGap > 2 && !uniq.some((f) => OILS.has(f.id))) {
    const oil = ["mustardOil", "oliveOil", "ghee", "groundnutOil"].map((id) => foods.get(id)).find((f) => allowed(f, p));
    if (oil) {
      const [, hi] = mealBounds(target.kcal, p.style)(oil);
      const g = roundGrams(oil, Math.min(hi, fatGap));
      if (g > 0) items.push(itemFor(oil, g));
    }
  }
  return { slot, label, pct, template: tpl.name, options: options.length, choice: i, target, items, total: sum(items) };
}

const mealError = (m: PlannedMeal) => Math.abs(m.total.p - m.target.p) * 3 + Math.abs(m.total.c - m.target.c) + Math.abs(m.total.f - m.target.f) * 2.5;

/**
 * A multi-day plan. For each meal the planner tries every allowed template and keeps the one that
 * fits the targets best, with penalties that keep variety (no repeated main protein in a day, no
 * same dish two days running). `swaps` maps "day-mealIndex" to a template index the coach picked.
 */
export function planDays(t: Targets, p: ClientProfile, days = 7, swaps: Record<string, number> = {}, extra: FoodItem[] = [], mealExtras: Record<string, { id: string; grams: number }[]> = {}): PlannedDay[] {
  const foods = foodTable(p, extra);
  const extrasFor = (d: number, mi: number): [FoodItem, number][] =>
    (mealExtras[`${d}-${mi}`] ?? []).flatMap(({ id, grams }) => (foods.has(id) && grams > 0 ? [[foods.get(id)!, grams] as [FoodItem, number]] : []));
  const layout = MEAL_LAYOUT[p.mealsPerDay];
  const yesterday = new Map<number, string>();
  return Array.from({ length: days }, (_, d) => {
    const adjust = layout.map(() => ({ kcal: 0, p: 0, c: 0, f: 0 }));
    const usedProtein = new Set<string>();
    const usedTemplate = new Set<string>();
    // Round 0 chooses templates; later rounds keep them and only re-balance quantities.
    const chosen = layout.map((m, mi) => {
      const forced = swaps[`${d}-${mi}`];
      const n = resolvedTemplates(m.slot, p, foods).length;
      if (!n) return -1;
      if (forced !== undefined) return ((forced % n) + n) % n;
      let best = -1;
      let bestScore = Infinity;
      for (let k = 0; k < n; k++) {
        const meal = planMeal(m.slot, m.label, m.pct, t, p, foods, k, undefined, extrasFor(d, mi));
        if (!meal) continue;
        const main = meal.items.find((it) => it.food.role === "protein" || it.food.id === "greekYogurt")?.food.id ?? meal.template;
        let score = mealError(meal);
        if (usedProtein.has(main)) score += 40;
        if (usedTemplate.has(meal.template)) score += 80;
        if (yesterday.get(mi) === meal.template) score += 25;
        score += ((k - d - mi * 3) % n + n) % n; // rotate ties so the week varies
        if (score < bestScore) [best, bestScore] = [k, score];
      }
      if (best >= 0) {
        const meal = planMeal(m.slot, m.label, m.pct, t, p, foods, best, undefined, extrasFor(d, mi))!;
        usedProtein.add(meal.items.find((it) => it.food.role === "protein" || it.food.id === "greekYogurt")?.food.id ?? meal.template);
        usedTemplate.add(meal.template);
      }
      return best;
    });
    let meals: (PlannedMeal | null)[] = [];
    // Day-level balancing: meals that hit a food bound leave a shortfall; hand it to the
    // other meals that can absorb it (by their share of the day) and re-solve, a few rounds.
    for (let round = 0; round < 5; round++) {
      meals = layout.map((m, mi) => (chosen[mi] < 0 ? null : planMeal(m.slot, m.label, m.pct, t, p, foods, chosen[mi], adjust[mi], extrasFor(d, mi))));
      const tot = sum(meals.flatMap((m) => m?.items ?? []));
      const resid = { p: t.protein - tot.p, c: t.carb - tot.c, f: t.fat - tot.f };
      if (Math.abs(resid.p) < 3 && Math.abs(resid.c) < 6 && Math.abs(resid.f) < 3) break;
      // Only meals with a lever for that macro can absorb it (a bedtime snack has no carb lever).
      for (const key of ["p", "c", "f"] as const) {
        const can = meals.map((m) => !!m && m.items.some((it) => it.food.role !== "veg" && (key === "p" ? it.macro.p > 3 : key === "c" ? it.macro.c > 5 && it.food.role !== "protein" : it.macro.f > 3)));
        const totalPct = layout.reduce((acc, m, mi) => acc + (can[mi] ? m.pct : 0), 0) || 100;
        layout.forEach((m, mi) => {
          if (can[mi]) adjust[mi][key] += (resid[key] * m.pct) / totalPct;
        });
      }
    }
    const planned = meals.filter((m): m is PlannedMeal => !!m);
    planned.forEach((m) => yesterday.set(layout.findIndex((l) => l.label === m.label), m.template));
    const all = planned.flatMap((m) => m.items);
    const total = { ...sum(all), fib: all.reduce((s, i) => s + i.fib, 0), ca: all.reduce((s, i) => s + i.ca, 0), fe: all.reduce((s, i) => s + i.fe, 0), na: all.reduce((s, i) => s + i.na, 0), k: all.reduce((s, i) => s + i.k, 0) };
    return { day: d + 1, meals: planned, total };
  });
}

/** Percentage deviation of a planned day from its targets. */
export function deviation(day: PlannedDay, t: Targets) {
  const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 1000) / 10 : 0);
  return { kcal: pct(day.total.kcal, t.kcal), p: pct(day.total.p, t.protein), c: pct(day.total.c, t.carb), f: pct(day.total.f, t.fat) };
}
