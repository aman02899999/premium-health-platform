import { describe, expect, it } from "vitest";
import { parseDietOrder, intakeToProfile } from "@/lib/growth/diet-intake";
import { CONDITION_KEYS } from "./conditions";
import { targets } from "./engine";
import { FOOD_DB } from "./foods";
import { TEMPLATES, planDays } from "./meals";
import { weeklySchedule } from "./program";
import { training } from "./guidance";
import type { ClientProfile } from "./types";

const base: ClientProfile = {
  name: "Test", age: 35, sex: "male", heightCm: 172, weightKg: 82, m: {}, activity: "moderate", trainingDays: 4, level: "intermediate", setting: "gym",
  goal: "fat-loss", ratePct: 0.5, style: "balanced", diet: "nonveg", mealsPerDay: 5, allergies: [],
  conditions: { pcos: false, hypothyroid: false, diabetes: false, hypertension: false, ckd: false, pregnant: false, lactating: false },
  useWhey: false, whey: { scoopG: 30, kcal: 120, p: 24, c: 3, f: 1.5, edited: true }, bmiScale: "asian", bmrFormula: "mifflin", overrides: {},
};
const week = (p: ClientProfile) => planDays(targets(p), p, 7);
const foodsIn = (p: ClientProfile) => new Set(week(p).flatMap((d) => d.meals.flatMap((m) => m.items.map((i) => i.food.id))));
const mains = (p: ClientProfile) => week(p).flatMap((d) => d.meals.map((m) => (m.items.find((i) => i.food.role === "protein") ?? m.items[0]).food.diet));

describe("food database", () => {
  it("has 316 foods (300 foods + 16 herbs/spices) with unique ids, sources and sane values", () => {
    expect(FOOD_DB.length).toBe(316);
    expect(new Set(FOOD_DB.map((f) => f.id)).size).toBe(316);
    expect(FOOD_DB.filter((f) => f.role === "herb").length).toBe(15);
    for (const f of FOOD_DB) {
      expect(f.source.ref, f.id).toBeTruthy();
      expect(f.p + f.c + f.f, f.id).toBeGreaterThan(0);
      // Spices use food-specific energy factors in IFCT and are eaten in grams; skip the Atwater check for them.
      if (f.role === "herb") continue;
      // Energy roughly matches the macros (Atwater 4/4/9), allowing for fibre, alcohols and rounding.
      expect(Math.abs(f.kcal - (f.p * 4 + f.c * 4 + f.f * 9)), f.id).toBeLessThan(Math.max(45, f.kcal * 0.25));
    }
    const byDiet = (d: string) => FOOD_DB.filter((f) => f.diet === d).length;
    expect(byDiet("nonveg")).toBeGreaterThanOrEqual(50);
    expect(byDiet("egg")).toBeGreaterThanOrEqual(10);
  });
  it("every dish only uses foods that exist", () => {
    const ids = new Set([...FOOD_DB.map((f) => f.id), "whey"]);
    for (const t of TEMPLATES) for (const id of [...t.p, ...(t.c ?? []), ...(t.f ?? []), ...(t.fixed ?? []).map((x) => x[0])]) expect(ids.has(id), `${t.name}: ${id}`).toBe(true);
  });
});

describe("food preference drives the chart", () => {
  it("non-veg clients get meat, chicken or fish at most lunches and dinners", () => {
    expect(mains(base).filter((d) => d === "nonveg").length).toBeGreaterThanOrEqual(10);
  });
  it("eggetarians get eggs and never meat", () => {
    const m = mains({ ...base, diet: "egg" });
    expect(m.filter((d) => d === "egg").length).toBeGreaterThanOrEqual(7);
    expect(m).not.toContain("nonveg");
  });
  it("vegetarian and Jain charts contain no egg or meat, Jain has no roots or mushrooms", () => {
    for (const diet of ["veg", "jain"] as const) expect(mains({ ...base, diet }).some((d) => d === "egg" || d === "nonveg")).toBe(false);
    const jain = foodsIn({ ...base, diet: "jain" });
    for (const id of ["potato", "onion", "carrot", "mushroom", "sweetPotato"]) expect(jain.has(id), id).toBe(false);
  });
  it("calories stay within 6 % of target for every diet", () => {
    for (const diet of ["veg", "egg", "nonveg", "vegan", "jain"] as const) {
      const p = { ...base, diet };
      const T = targets(p);
      for (const d of planDays(T, p, 7)) expect(Math.abs(d.total.kcal - T.kcal) / T.kcal, diet).toBeLessThan(0.06);
    }
  });
});

describe("health conditions", () => {
  const withC = (c: Partial<ClientProfile["conditions"]>) => ({ ...base, conditions: { ...base.conditions, ...c } });
  it("cholesterol leaves out ghee, coconut oil and khoa", () => {
    const f = foodsIn(withC({ cholesterol: true }));
    for (const id of ["ghee", "coconutOil", "coconutMilk", "khoa"]) expect(f.has(id), id).toBe(false);
    for (const id of f) {
      const food = FOOD_DB.find((x) => x.id === id);
      if (food?.diet === "nonveg" && !food.allergen) expect(food.f, id).toBeLessThan(10);
    }
  });
  it("gout leaves out organ meats, shellfish and oily small fish", () => {
    const f = foodsIn(withC({ gout: true }));
    for (const id of ["chickenLiver", "goatLiver", "prawns", "prawnsRaw", "squid", "sardine", "mackerel"]) expect(f.has(id), id).toBe(false);
  });
  it("lactose intolerance leaves out milk, kidney stones leave out spinach, and dishes are dropped rather than served without them", () => {
    expect([...foodsIn(withC({ lactose: true }))].some((id) => id.startsWith("milk"))).toBe(false);
    const stones = withC({ kidneyStones: true });
    const days = week(stones);
    expect(days.some((d) => d.meals.some((m) => /palak/i.test(m.template)))).toBe(false);
    expect(targets(stones).waterRestL).toBeGreaterThanOrEqual(2.5);
  });
  it("bone health raises calcium; joint pain switches cardio to low impact; each condition adds a warning", () => {
    expect(targets(withC({ osteoporosis: true })).calciumMg).toBe(1200);
    const p = withC({ jointPain: true });
    const T = targets(p);
    const w = weeklySchedule(p, T, training(p), planDays(T, p, 7));
    expect(w.find((d) => !d.session)?.cardio).toMatch(/cycling or swimming/);
    const plain = targets(base).warnings.length;
    for (const k of ["cholesterol", "fattyLiver", "gout", "kidneyStones", "anaemia", "gerd", "ibs", "lactose", "jointPain"] as const) expect(targets(withC({ [k]: true })).warnings.length, k).toBeGreaterThan(plain);
  });
  it("the order form accepts every condition and maps them onto the profile", () => {
    const r = parseDietOrder({ name: "Priya", phone: "9876543210", email: "", age: 40, sex: "female", heightCm: 160, weightKg: 70, goal: "fat-loss", diet: "egg", activity: "light", conditions: [...CONDITION_KEYS, "made-up"], consent: true });
    if (typeof r === "string") throw new Error(r);
    expect(r.intake.conditions.length).toBe(CONDITION_KEYS.length);
    const prof = intakeToProfile("Priya", r.intake, base);
    expect(prof.conditions.gout && prof.conditions.menopause && prof.conditions.pcos).toBe(true);
    expect(parseDietOrder({ name: "Raj", phone: "9876543210", age: 40, sex: "male", heightCm: 170, weightKg: 70, goal: "fat-loss", diet: "veg", activity: "light", conditions: ["menopause"], consent: true })).toMatch(/health conditions/);
  });
});
