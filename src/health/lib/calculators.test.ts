import { describe, expect, it } from "vitest";
import {
  bmi, bmiAsian, bmiWho, bodyFatCategory, bodyFatNavy, caloriePlan, cmFromFeetInches, cycleIsTypical, dueDate, feetInchesFromCm,
  gestationalAge, healthyRange, isoDate, kgFromLb, kgToHealthy, milestoneDates, parseDate, predictCycles,
} from "./calculators";

const d = (s: string) => parseDate(s)!;

describe("dates", () => {
  it("parses valid ISO dates and rejects impossible ones", () => {
    expect(isoDate(d("2026-02-28"))).toBe("2026-02-28");
    expect(parseDate("2026-02-30")).toBeNull();
    expect(parseDate("02/10/2026")).toBeNull();
  });
});

describe("units", () => {
  it("converts feet/inches and pounds", () => {
    expect(cmFromFeetInches(5, 6)).toBeCloseTo(167.64, 2);
    expect(kgFromLb(150)).toBeCloseTo(68.04, 2);
    expect(feetInchesFromCm(167.64)).toEqual({ ft: 5, inch: 6 });
    expect(feetInchesFromCm(182.8)).toEqual({ ft: 6, inch: 0 });
  });
});

describe("BMI", () => {
  it("computes BMI and both category systems", () => {
    expect(bmi(70, 170)).toBeCloseTo(24.22, 2);
    expect(bmiAsian(24.2).label).toBe("Overweight");
    expect(bmiWho(24.2).label).toBe("Normal");
    expect(bmiAsian(22.9).label).toBe("Healthy");
    expect(bmiAsian(23).label).toBe("Overweight");
    expect(bmiAsian(27).label).toBe("Obese (class I)");
    expect(bmiWho(41).label).toBe("Obese class III");
    expect(bmi(70, 0)).toBeNaN();
  });
  it("gives the healthy weight range and distance to it", () => {
    const r = healthyRange(170);
    expect(r.min).toBeCloseTo(53.5, 1);
    expect(r.max).toBeCloseTo(66.2, 1);
    expect(kgToHealthy(70, 170)).toBeCloseTo(3.82, 1);
    expect(kgToHealthy(60, 170)).toBe(0);
    expect(kgToHealthy(50, 170)).toBeLessThan(0);
  });
});

describe("pregnancy", () => {
  it("applies Naegele's rule with cycle adjustment", () => {
    expect(isoDate(dueDate("lmp", d("2026-01-01")))).toBe("2026-10-08");
    expect(isoDate(dueDate("lmp", d("2026-01-01"), 32))).toBe("2026-10-12");
    expect(isoDate(dueDate("conception", d("2026-01-15")))).toBe("2026-10-08");
    expect(isoDate(dueDate("ivf5", d("2026-01-20")))).toBe("2026-10-08");
    expect(isoDate(dueDate("ivf3", d("2026-01-18")))).toBe("2026-10-08");
  });
  it("reports gestational age and trimester", () => {
    const due = d("2026-10-08");
    expect(gestationalAge(due, d("2026-01-01"))).toMatchObject({ days: 0, weeks: 0, trimester: 1 });
    expect(gestationalAge(due, d("2026-04-09"))).toMatchObject({ weeks: 14, rem: 0, trimester: 2 });
    expect(gestationalAge(due, d("2026-07-16"))).toMatchObject({ weeks: 28, trimester: 3, daysToGo: 84 });
  });
  it("dates the NT scan window 11w0d–13w6d", () => {
    const nt = milestoneDates(d("2026-10-08")).find((m) => m.title.startsWith("NT"))!;
    expect(isoDate(nt.start)).toBe("2026-03-19");
    expect(isoDate(nt.end)).toBe("2026-04-08");
  });
});

describe("cycle", () => {
  it("predicts ovulation 14 days before the next period and a 7-day fertile window", () => {
    const [c] = predictCycles(d("2026-10-01"), 28, 5);
    expect(isoDate(c.periodEnd)).toBe("2026-10-05");
    expect(isoDate(c.ovulation)).toBe("2026-10-15");
    expect(isoDate(c.fertileStart)).toBe("2026-10-10");
    expect(isoDate(c.fertileEnd)).toBe("2026-10-16");
    expect(isoDate(c.nextPeriod)).toBe("2026-10-29");
    expect(predictCycles(d("2026-10-01"), 30, 5, 14, 3)).toHaveLength(3);
  });
  it("flags atypical cycle lengths", () => {
    expect(cycleIsTypical(28)).toBe(true);
    expect(cycleIsTypical(20)).toBe(false);
    expect(cycleIsTypical(40)).toBe(false);
  });
});

describe("body fat (US Navy)", () => {
  it("matches the Hodgdon–Beckett metric equations", () => {
    // Male 178 cm, neck 38, waist 86: 495 / (1.0324 − 0.19077·log10(48) + 0.15456·log10(178)) − 450
    expect(bodyFatNavy("male", 178, 38, 86)).toBeCloseTo(17.2, 1);
    // Female 165 cm, neck 33, waist 75, hip 98: 495 / (1.29579 − 0.35004·log10(140) + 0.221·log10(165)) − 450
    expect(bodyFatNavy("female", 165, 33, 75, 98)).toBeCloseTo(28.4, 1);
    expect(bodyFatNavy("male", 178, 40, 39)).toBeNaN();
  });
  it("uses ACE categories", () => {
    expect(bodyFatCategory("male", 15).label).toBe("Fitness");
    expect(bodyFatCategory("male", 10).label).toBe("Athletes");
    expect(bodyFatCategory("male", 26).label).toBe("Obese range");
    expect(bodyFatCategory("female", 22).label).toBe("Fitness");
    expect(bodyFatCategory("female", 12).label).toBe("Essential fat");
    expect(bodyFatCategory("female", 33).label).toBe("Obese range");
  });
});

describe("calorie plan", () => {
  it("builds targets and macros that add up", () => {
    const p = caloriePlan({ weightKg: 70, heightCm: 170, age: 30, sex: "male", activity: 1.375, goal: "lose-0.5" });
    expect(p.bmr).toBe(1618);
    expect(p.tdee).toBe(2224);
    expect(p.target).toBe(1674);
    expect(p.proteinG).toBe(112);
    expect(Math.abs(p.proteinG * 4 + p.fatG * 9 + p.carbG * 4 - p.target)).toBeLessThan(10);
  });
  it("never goes below the safety floor", () => {
    const p = caloriePlan({ weightKg: 45, heightCm: 150, age: 60, sex: "female", activity: 1.2, goal: "lose-0.5" });
    expect(p.target).toBe(1200);
    expect(p.floored).toBe(true);
  });
});
