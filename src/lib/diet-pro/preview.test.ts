import { describe, expect, it } from "vitest";
import { dietPreview, parsePreview } from "./preview";

const base = { sex: "male", age: 30, heightCm: 172, weightKg: 82, goal: "fat-loss", diet: "veg", activity: "moderate", cuisine: "north" };

describe("free diet preview", () => {
  it("builds one day of Indian meals near the calorie target", () => {
    const i = parsePreview(base);
    if (typeof i === "string") throw new Error(i);
    const d = dietPreview(i);
    expect(d.kcal).toBeLessThan(d.maintenance);
    expect(d.meals).toHaveLength(5);
    const total = d.meals.reduce((s, m) => s + m.kcal, 0);
    expect(Math.abs(total - d.kcal) / d.kcal).toBeLessThan(0.15);
    for (const m of d.meals) {
      expect(m.items.length).toBeGreaterThan(0);
      for (const x of m.items) expect(x).toMatch(/[a-z]{3,}.*\(\d/i); // a food name, then the weighed amount
    }
  });
  it("never plans a deficit for an underweight person, and respects a veg diet", () => {
    const i = parsePreview({ ...base, weightKg: 48, heightCm: 175 });
    if (typeof i === "string") throw new Error(i);
    const d = dietPreview(i);
    expect(d.kcal).toBeGreaterThanOrEqual(d.maintenance - 20);
    expect(d.notes.join(" ")).toMatch(/Underweight|BMI is under/);
    expect(d.meals.flatMap((m) => m.items).join(" ")).not.toMatch(/chicken|fish|egg|mutton/i);
  });
  it("rejects out-of-range input", () => {
    expect(parsePreview({ ...base, age: 15 })).toMatch(/18 to 70/);
    expect(parsePreview({ ...base, heightCm: 300 })).toMatch(/height/);
    expect(parsePreview({ ...base, goal: "magic" })).toMatch(/every question/);
  });
});
