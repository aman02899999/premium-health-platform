import { describe, expect, it } from "vitest";
import { macros, tdee } from "./calculators";
import { decodeAnswers, DIET_QUESTIONS, dietScore, encodeAnswers, proteinNeed } from "./desi-tools";
import { cardFor, cardQuery, parseCardQuery } from "./share-card";

const q = (s: string) => new URLSearchParams(s);

describe("protein calculator", () => {
  it("uses the same g/kg as the macro calculator", () => {
    for (const goal of ["lose", "maintain", "gain"] as const) {
      expect(proteinNeed(70, goal, "veg").grams).toBe(macros(tdee("male", 70, 172, 28, "moderate").maintain, 70, goal).protein);
    }
  });

  it("builds a plate that fits the diet", () => {
    const veg = proteinNeed(70, "gain", "veg");
    expect(veg.plate.map((p) => p.id)).not.toContain("egg");
    expect(veg.plate.map((p) => p.id)).not.toContain("chicken");
    expect(veg.covered).toBeGreaterThanOrEqual(veg.grams);
    const nonveg = proteinNeed(70, "gain", "nonveg");
    expect(nonveg.plate.map((p) => p.id)).toContain("chicken");
    expect(nonveg.plate.map((p) => p.id)).not.toContain("paneer");
  });

  it("says honestly when a heavy lifter's plate falls short", () => {
    const r = proteinNeed(200, "lose", "veg");
    expect(r.grams).toBe(400);
    expect(r.short).toBeGreaterThan(0);
  });
});

describe("desi diet score", () => {
  it("scores 100 for all best answers and 0 for all worst", () => {
    expect(dietScore(DIET_QUESTIONS.map(() => 0)).score).toBe(100);
    const worst = dietScore(DIET_QUESTIONS.map(() => 2));
    expect(worst.score).toBe(0);
    expect(worst.best).toBeNull();
    expect(worst.fix).toBe(DIET_QUESTIONS[0].fix);
  });

  it("names the worst habit as the next fix", () => {
    const r = dietScore([0, 0, 2, 1, 0, 0, 1, 0]);
    expect(r.score).toBe(75);
    expect(r.fix).toBe(DIET_QUESTIONS[2].fix);
    expect(r.best).toBe(DIET_QUESTIONS[0].good);
  });

  it("only accepts 8 answers of 0, 1 or 2", () => {
    expect(decodeAnswers(encodeAnswers([0, 1, 2, 0, 1, 2, 0, 1]))).toEqual([0, 1, 2, 0, 1, 2, 0, 1]);
    expect(decodeAnswers("0123")).toBeNull();
    expect(decodeAnswers("01201203")).toBeNull();
    expect(decodeAnswers(null)).toBeNull();
  });
});

describe("share cards for the desi tools", () => {
  it("round-trips through the image URL", () => {
    const p = { key: "protein" as const, weight: 68, goal: "lose" as const, diet: "egg" as const };
    expect(parseCardQuery(q(cardQuery(p)))).toEqual(p);
    const d = { key: "diet-score" as const, answers: [0, 1, 2, 0, 1, 2, 0, 1] as (0 | 1 | 2)[] };
    expect(parseCardQuery(q(cardQuery(d)))).toEqual(d);
  });

  it("rejects junk", () => {
    expect(parseCardQuery(q("k=protein&w=70&g=bulk&d=veg"))).toBeNull();
    expect(parseCardQuery(q("k=protein&w=70&g=gain&d=vegan"))).toBeNull();
    expect(parseCardQuery(q("k=protein&w=999&g=gain&d=veg"))).toBeNull();
    expect(parseCardQuery(q("k=diet-score&ans=hello"))).toBeNull();
  });

  it("cites its source on the card and never prints body weight", () => {
    const c = cardFor({ key: "protein", weight: 83, goal: "gain", diet: "veg" });
    expect(c.value).toBe("149");
    expect(c.note).toMatch(/Indian Food Composition Tables/);
    expect([c.headline, c.unit, ...c.lines].join(" ")).not.toMatch(/\b83\b/);
    expect(cardFor({ key: "diet-score", answers: [0, 0, 0, 0, 0, 0, 0, 0] }).note).toMatch(/Dietary Guidelines for Indians/);
  });
});
