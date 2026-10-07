import { describe, expect, it } from "vitest";
import { analyse, bmiBand, deurenbergBodyFat, mifflin, navyBodyFat, targets } from "./engine";
import { FOOD_DB } from "./foods";
import { TEMPLATES, allowed, deviation, foodTable, planDays, roundGrams, solveLevers } from "./meals";
import type { ClientProfile } from "./types";

const base: ClientProfile = {
  name: "Test",
  age: 30,
  sex: "male",
  heightCm: 175,
  weightKg: 80,
  m: { neck: 38, waist: 90, hip: 100 },
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
  whey: { scoopG: 30, kcal: 120, p: 24, c: 3, f: 1.5, edited: true },
  bmiScale: "asian",
  bmrFormula: "mifflin",
  overrides: {},
};

describe("formulas", () => {
  it("Mifflin-St Jeor matches the published equation", () => {
    expect(mifflin("male", 80, 175, 30)).toBeCloseTo(1748.75, 2);
    expect(mifflin("female", 60, 160, 30)).toBeCloseTo(1289, 2);
  });
  it("US Navy body fat (metric) for a known case", () => {
    // 175 cm, neck 38, waist 90 → 495/(1.0324 − 0.19077·log10(52) + 0.15456·log10(175)) − 450
    expect(navyBodyFat("male", 175, 38, 90)).toBeCloseTo(495 / (1.0324 - 0.19077 * Math.log10(52) + 0.15456 * Math.log10(175)) - 450, 6);
    expect(navyBodyFat("female", 165, 34, 80)).toBeNaN(); // hip required for women
  });
  it("Deurenberg body fat", () => {
    expect(deurenbergBodyFat(25, 30, "male")).toBeCloseTo(1.2 * 25 + 0.23 * 30 - 10.8 - 5.4, 6);
  });
  it("Asian BMI cut-offs differ from WHO", () => {
    expect(bmiBand(24, "asian").label).toBe("Overweight");
    expect(bmiBand(24, "who").label).toBe("Healthy");
  });
  it("prefers measured body fat, then Navy, then Deurenberg", () => {
    expect(analyse({ ...base, measuredBodyFat: 18 }).bfMethod).toBe("measured");
    expect(analyse(base).bfMethod).toBe("navy");
    expect(analyse({ ...base, m: {} }).bfMethod).toBe("deurenberg");
  });
});

describe("targets", () => {
  it("energy: TDEE minus a 0.5 %/week deficit", () => {
    const t = targets(base);
    expect(t.tdee).toBe(Math.round(mifflin("male", 80, 175, 30) * 1.55));
    // 0.4 kg/week × 7700 / 7 = 440 kcal/day
    expect(Math.abs(t.kcal - (t.tdee - 440))).toBeLessThanOrEqual(5);
    expect(t.protein * 4 + t.carb * 4 + t.fat * 9).toBeGreaterThan(t.kcal - 15);
    expect(t.protein * 4 + t.carb * 4 + t.fat * 9).toBeLessThan(t.kcal + 15);
  });
  it("never goes below the NIH floor without an override", () => {
    const t = targets({ ...base, sex: "female", weightKg: 48, heightCm: 150, activity: "sedentary", ratePct: 1 });
    expect(t.kcal).toBeGreaterThanOrEqual(1200);
  });
  it("blocks a deficit in pregnancy and for underweight clients", () => {
    expect(targets({ ...base, sex: "female", conditions: { ...base.conditions, pregnant: true } }).goal).toBe("maintain");
    expect(targets({ ...base, weightKg: 52 }).goal).toBe("maintain");
  });
  it("caps protein in kidney disease", () => {
    expect(targets({ ...base, conditions: { ...base.conditions, ckd: true } }).proteinPerKg).toBeLessThanOrEqual(0.8);
  });
  it("keto keeps carbs at 50 g", () => {
    expect(targets({ ...base, style: "keto" }).carb).toBe(50);
  });
});

describe("food database", () => {
  it("every food has sane macros and a source", () => {
    for (const f of FOOD_DB) {
      expect(f.source.ref).toBeTruthy();
      expect(f.p + f.c + f.f).toBeLessThanOrEqual(101);
      // Atwater cross-check (4/4/9 + 2 kcal/g fibre). Tables use food-specific factors, so allow
      // 20 % on energy-dense foods and 15 kcal on low-energy vegetables and fruit.
      const atwater = f.p * 4 + f.c * 4 + f.f * 9 + f.fib * 2;
      if (atwater > 100) expect(Math.abs(f.kcal - atwater) / atwater, f.id).toBeLessThan(0.2);
      else expect(Math.abs(f.kcal - atwater), f.id).toBeLessThan(15);
    }
  });
  it("every template food exists", () => {
    const ids = new Set([...FOOD_DB.map((f) => f.id), "whey"]);
    for (const t of TEMPLATES) for (const id of [...t.p, ...(t.c ?? []), ...(t.f ?? []), ...(t.fixed ?? []).map(([i]) => i)]) expect(ids.has(id), `${t.name}: ${id}`).toBe(true);
  });
  it("diet and allergy filters", () => {
    const foods = foodTable(base);
    expect(allowed(foods.get("chickenBreast"), base)).toBe(false);
    expect(allowed(foods.get("paneer"), base)).toBe(true);
    expect(allowed(foods.get("paneer"), { ...base, diet: "vegan" })).toBe(false);
    expect(allowed(foods.get("onion"), { ...base, diet: "jain" })).toBe(false);
    expect(allowed(foods.get("almonds"), { ...base, allergies: ["nuts"] })).toBe(false);
  });
});

describe("meal solver", () => {
  it("hits protein/carb/fat for a simple meal", () => {
    const foods = foodTable(base);
    const levers = ["paneer", "atta", "ghee"].map((id) => foods.get(id)!);
    const g = solveLevers(levers, { p: 30, c: 60, f: 22 });
    const got = { p: 0, c: 0, f: 0 };
    levers.forEach((f, i) => {
      got.p += (f.p * g[i]) / 100;
      got.c += (f.c * g[i]) / 100;
      got.f += (f.f * g[i]) / 100;
    });
    expect(got.p).toBeCloseTo(30, 0);
    expect(got.c).toBeCloseTo(60, 0);
    expect(got.f).toBeCloseTo(22, 0);
  });
  it("rounds eggs to whole eggs", () => {
    const egg = FOOD_DB.find((f) => f.id === "egg")!;
    expect(roundGrams(egg, 120)).toBe(100);
  });
  const profiles: [string, Partial<ClientProfile>][] = [
    ["veg fat loss", {}],
    ["non-veg gain 4 meals", { diet: "nonveg", goal: "lean-gain", mealsPerDay: 4 }],
    ["vegan maintain", { diet: "vegan", goal: "maintain" }],
    ["egg high-protein 6 meals + whey", { diet: "egg", style: "high-protein", mealsPerDay: 6, useWhey: true }],
    ["jain female", { diet: "jain", sex: "female", weightKg: 62, heightCm: 158, m: { neck: 32, waist: 78, hip: 98 } }],
    ["non-veg diabetic", { diet: "nonveg", style: "diabetic" }],
  ];
  for (const [label, patch] of profiles) {
    it(`7-day plan within 10 % of targets: ${label}`, () => {
      const p = { ...base, ...patch } as ClientProfile;
      const t = targets(p);
      const days = planDays(t, p, 7);
      expect(days).toHaveLength(7);
      for (const d of days) {
        expect(d.meals.length).toBe(p.mealsPerDay);
        const dev = deviation(d, t);
        expect(Math.abs(dev.kcal), `${label} day ${d.day} kcal ${dev.kcal}%`).toBeLessThan(10);
        expect(Math.abs(dev.p), `${label} day ${d.day} protein ${dev.p}%`).toBeLessThan(10);
        for (const m of d.meals) for (const it of m.items) expect(allowed(it.food, p), `${label}: ${it.food.id}`).toBe(true);
      }
    });
  }
});
