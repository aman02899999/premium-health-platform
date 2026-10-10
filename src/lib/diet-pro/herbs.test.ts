import { describe, expect, it } from "vitest";
import { herbAdvice, herbRoutine } from "./herbs";
import { household } from "./household";
import type { ClientProfile } from "./types";

const base: ClientProfile = {
  name: "T", age: 40, sex: "female", heightCm: 160, weightKg: 70, m: {}, activity: "light", trainingDays: 3, level: "beginner", setting: "gym",
  goal: "fat-loss", ratePct: 0.5, style: "balanced", diet: "veg", mealsPerDay: 5, allergies: [],
  conditions: { pcos: false, hypothyroid: false, diabetes: false, hypertension: false, ckd: false, pregnant: false, lactating: false },
  useWhey: false, whey: { scoopG: 30, kcal: 120, p: 24, c: 3, f: 1.5, edited: true }, bmiScale: "asian", bmrFormula: "mifflin", overrides: {},
};
const withC = (c: Partial<ClientProfile["conditions"]>) => ({ ...base, conditions: { ...base.conditions, ...c } });
const names = (p: ClientProfile) => herbAdvice(p).items.map((h) => h.name);

describe("herbs & supplements", () => {
  it("no conditions → only the everyday kitchen-herb tip, no routine line", () => {
    expect(names(base)).toEqual(["Herbs instead of extra salt"]);
    expect(herbRoutine(base)).toBe("");
  });
  it("matches each condition with dose, timing, evidence and caution", () => {
    expect(names(withC({ diabetes: true }))).toContain("Methi (fenugreek) seeds");
    expect(names(withC({ cholesterol: true }))).toEqual(expect.arrayContaining(["Isabgol (psyllium husk)", "Garlic (lahsun)"]));
    expect(names(withC({ ibs: true }))).toContain("Peppermint oil capsules");
    for (const h of herbAdvice(withC({ diabetes: true, hypertension: true, jointPain: true, anaemia: true, ibs: true, pcos: true })).items) {
      expect(h.how.length, h.name).toBeGreaterThan(20);
      expect(h.caution.length, h.name).toBeGreaterThan(3);
      expect(h.source.length, h.name).toBeGreaterThan(5);
    }
  });
  it("never claims to cure, and always says it does not replace medicine", () => {
    const all = herbAdvice(withC({ diabetes: true, hypertension: true, cholesterol: true, pcos: true, gout: true, jointPain: true, ibs: true }));
    const text = JSON.stringify(all).toLowerCase();
    expect(text).not.toMatch(/\bcures?\b(?! a disease)|\bcured\b|guarantee/);
    expect(all.notes[0]).toMatch(/do not cure a disease or replace any medicine/);
  });
  it("safety switches: pregnancy, kidney disease, reflux", () => {
    const preg = herbAdvice(withC({ pregnant: true, diabetes: true, pcos: true }));
    expect(preg.items.every((h) => h.kind === "kitchen")).toBe(true);
    expect(preg.items.map((h) => h.name)).not.toContain("Methi (fenugreek) seeds");
    expect(herbAdvice(withC({ ckd: true, cholesterol: true })).items.some((h) => h.kind !== "kitchen")).toBe(false);
    expect(names(withC({ ibs: true, gerd: true }))).not.toContain("Peppermint oil capsules");
    expect(herbAdvice(withC({ fattyLiver: true })).notes.join(" ")).toMatch(/giloy, ashwagandha/);
  });
  it("routine line for the diet chart and kitchen measures for herbs", () => {
    expect(herbRoutine(withC({ diabetes: true }))).toMatch(/On waking: methi/);
    expect(household("garlic", 6).qty).toBe("2 cloves");
    expect(household("turmeric", 1.5).qty).toBe("½ tsp");
    expect(household("blackPepper", 0.5).qty).toBe("a pinch");
    expect(household("coconutWater", 200).qty).toBe("1 glass");
  });
});
