import { describe, expect, it } from "vitest";
import { targets } from "./engine";
import { training } from "./guidance";
import { clock, mealMinutes, mealTime } from "./household";
import { planDays } from "./meals";
import { buyAmount, groceryList, habits, heartZones, projection, stepTarget, TRAINING_SLOTS, weeklySchedule } from "./program";
import type { ClientProfile } from "./types";

const base: ClientProfile = {
  name: "Test",
  age: 30,
  sex: "male",
  heightCm: 175,
  weightKg: 80,
  targetWeightKg: 74,
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
  wakeTime: "06:30",
  trainTime: "18:00",
  allergies: [],
  conditions: { pcos: false, hypothyroid: false, diabetes: false, hypertension: false, ckd: false, pregnant: false, lactating: false },
  useWhey: false,
  whey: { scoopG: 30, kcal: 120, p: 24, c: 3, f: 1.5, edited: true },
  bmiScale: "asian",
  bmrFormula: "mifflin",
  overrides: {},
};
const build = (p: ClientProfile) => {
  const T = targets(p);
  const days = planDays(T, p, 7);
  const train = training({ ...p, goal: T.goal });
  return { T, days, train, week: weeklySchedule(p, T, train, days) };
};

describe("clock helpers", () => {
  it("meal times are unchanged by the refactor", () => {
    expect(mealTime("Breakfast", "06:30", 5)).toBe("8:00 am");
    expect(mealTime("Dinner", "06:30", 3)).toBe("7:30 pm");
    expect(clock(mealMinutes("Evening snack", "06:30", 5))).toBe("5:00 pm");
    expect(clock(-30)).toBe("11:30 pm");
  });
});

describe("weekly schedule", () => {
  it("places every training session once and never two rest days for a 6-day split", () => {
    for (const n of [2, 3, 4, 5, 6]) {
      const { week, train } = build({ ...base, trainingDays: n });
      expect(train.length).toBe(n);
      expect(week.filter((d) => d.session).length).toBe(n);
      expect(TRAINING_SLOTS[n].every((i) => week[i].session)).toBe(true);
    }
  });
  it("links pre- and post-workout meals from that day's chart (18:00 session, 5 meals)", () => {
    const { week, days } = build(base);
    const d = week.find((x) => x.session)!;
    // Evening snack 5:00 pm is 60 min before; dinner 8:00 pm is 2 h after.
    expect(d.pre?.label).toBe("Evening snack");
    expect(d.post?.label).toBe("Dinner");
    expect(d.pre?.dish).toBe(days[d.day - 1].meals.find((m) => m.label === "Evening snack")?.template);
    expect(d.kcal).toBe(Math.round(days[d.day - 1].total.kcal));
  });
  it("an early session has no pre-workout meal but breakfast after it", () => {
    const { week } = build({ ...base, trainTime: "06:45" });
    const d = week.find((x) => x.session)!;
    expect(d.pre).toBeNull();
    expect(d.post?.label).toBe("Breakfast");
  });
  it("cardio and steps follow the goal the plan actually uses", () => {
    const loss = build(base).week;
    expect(loss.find((d) => !d.session)?.cardio).toMatch(/30–40 min/);
    expect(loss[0].steps).toBe(10000);
    const gain = build({ ...base, goal: "gain", ratePct: 0.5, targetWeightKg: 85 }).week;
    expect(gain.find((d) => !d.session)?.cardio).toMatch(/light/);
    expect(stepTarget("fat-loss", 65)).toBe(8000);
  });
  it("no training days → every day is a walk day", () => {
    const { week } = build({ ...base, trainingDays: 0 });
    expect(week.every((d) => !d.session && d.title === "Walk + mobility")).toBe(true);
  });
});

describe("extras", () => {
  it("heart-rate zones use Tanaka's max HR", () => {
    const z = heartZones(30);
    expect(z.max).toBe(187);
    expect(z.zones[0].range).toBe("112–131 bpm");
  });
  it("projection follows the prescribed weekly change and stops at the target", () => {
    const { T } = build(base);
    const pr = projection(base, T, 12);
    expect(pr[0].kg).toBe(80);
    expect(pr[1].kg).toBeCloseTo(80 + T.weeklyKg, 1);
    expect(Math.min(...pr.map((x) => x.kg))).toBeGreaterThanOrEqual(74);
    expect(projection({ ...base, goal: "maintain" }, targets({ ...base, goal: "maintain" }))).toEqual([]);
  });
  it("grocery list totals the week and rounds up to buyable amounts", () => {
    const { days } = build(base);
    const list = groceryList(days);
    expect(list.length).toBeGreaterThan(3);
    const all = list.flatMap((g) => g.items);
    expect(all.every((i) => /\d/.test(i.amount))).toBe(true);
    expect(buyAmount(1234, "g")).toBe("1.25 kg");
    expect(buyAmount(430, "g")).toBe("450 g");
    expect(buyAmount(1500, "ml")).toBe("1.5 L");
    expect(buyAmount(14, "g")).toBe("20 g");
  });
  it("habit tracker uses the client's own numbers", () => {
    const { T } = build(base);
    const h = habits(base, T);
    expect(h[0]).toContain(String(T.waterRestL));
    expect(h[2]).toContain(String(T.protein));
  });
});
