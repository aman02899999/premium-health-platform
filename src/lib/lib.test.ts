import { describe, expect, it } from "vitest";
import { bmi, bodyFatNavy, heartRateZones, idealWeight, macros, oneRepMax, tdee, waterIntake } from "./calculators";
import { parseInline, parseMarkdown, toc } from "./markdown";
import { validateContent } from "./content/validate";
import { DEFAULT_CONTENT } from "./content/defaults";

describe("calculators", () => {
  it("bmi uses Asian cut-offs", () => {
    const r = bmi(70, 175);
    expect(r.value).toBe(22.9);
    expect(r.category).toBe("Healthy");
    expect(bmi(74, 175).category).toBe("Overweight");
  });

  it("tdee matches Mifflin-St Jeor", () => {
    const r = tdee("male", 80, 180, 30, "moderate");
    expect(r.bmr).toBe(1780);
    expect(r.maintain).toBe(Math.round(1780 * 1.55));
  });

  it("body fat navy gives plausible male value and rejects bad input", () => {
    const r = bodyFatNavy("male", 178, 38, 85);
    expect(r!.value).toBeGreaterThan(12);
    expect(r!.value).toBeLessThan(20);
    expect(bodyFatNavy("male", 178, 40, 39)).toBeNull();
  });

  it("one rep max averages Epley and Brzycki", () => {
    const r = oneRepMax(100, 5);
    expect(r.epley).toBe(116.7);
    expect(r.brzycki).toBe(112.5);
    expect(r.estimate).toBe(114.6);
    expect(oneRepMax(100, 1).estimate).toBe(100);
  });

  it("macros add up to calories", () => {
    const m = macros(2500, 75, "maintain");
    expect(Math.abs(m.protein * 4 + m.carbs * 4 + m.fat * 9 - m.calories)).toBeLessThan(10);
  });

  it("ideal weight, water and heart rate", () => {
    expect(idealWeight("male", 175).average).toBeGreaterThan(65);
    expect(waterIntake(70, 60, true).litres).toBe(4);
    const hr = heartRateZones(30, 60);
    expect(hr.max).toBe(187);
    expect(hr.method).toBe("Karvonen");
    expect(hr.zones[0].low).toBe(124);
  });
});

describe("markdown", () => {
  it("parses headings, lists, tables and shortcodes", () => {
    const blocks = parseMarkdown(
      "## Hello world\n\nSome **bold** text.\n\n- a\n- b\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n[[calculator:bmi]]\n\n[[quiz:Q?|x|*y|z|Because]]\n\n[[cta]]",
    );
    expect(blocks.map((b) => b.t)).toEqual(["h2", "p", "ul", "table", "calculator", "quiz", "cta"]);
    const quiz = blocks[5] as Extract<(typeof blocks)[number], { t: "quiz" }>;
    expect(quiz.options).toEqual(["x", "y", "z"]);
    expect(quiz.answer).toBe(1);
    expect(quiz.explanation).toBe("Because");
    expect(toc(blocks)).toEqual([{ id: "hello-world", text: "Hello world", level: 2 }]);
  });

  it("drops unsafe link protocols", () => {
    expect(parseInline("[x](javascript:alert(1))").some((n) => n.t === "link")).toBe(false);
    expect(parseInline("[x](/tools)")[0]).toMatchObject({ t: "link", href: "/tools" });
  });

  it("parses every default post without empty paragraphs", () => {
    for (const post of DEFAULT_CONTENT.posts) {
      const blocks = parseMarkdown(post.body);
      expect(blocks.length).toBeGreaterThan(5);
      expect(blocks.some((b) => b.t === "cta")).toBe(true);
    }
  });
});

describe("content validation", () => {
  it("accepts defaults and rejects bad slugs", () => {
    expect(validateContent(DEFAULT_CONTENT).ok).toBe(true);
    const bad = { ...DEFAULT_CONTENT, posts: [{ ...DEFAULT_CONTENT.posts[0], slug: "Bad Slug" }] };
    expect(validateContent(bad).ok).toBe(false);
    expect(validateContent({ ...DEFAULT_CONTENT, plans: "x" }).ok).toBe(false);
  });
});

describe("fitness hub", async () => {
  const { generatePlan } = await import("./fitness/planner");
  const { EXERCISES, exerciseBySlug } = await import("./fitness/exercises");
  const { FOODS } = await import("./fitness/foods");
  const { DIET_PLANS, planTotals } = await import("./fitness/diet-plans");

  it("generates one session per training day without duplicates", () => {
    for (const days of [2, 3, 4, 5, 6]) {
      const plan = generatePlan({ goal: "muscle", days, level: "advanced", setting: "gym" });
      expect(plan).toHaveLength(days);
      for (const d of plan) {
        expect(d.items.length).toBeGreaterThanOrEqual(4);
        expect(new Set(d.items.map((i) => i.slug)).size).toBe(d.items.length);
      }
    }
  });

  it("home plans only use home equipment and respect level", () => {
    const plan = generatePlan({ goal: "fat-loss", days: 3, level: "beginner", setting: "home" });
    for (const item of plan.flatMap((d) => d.items)) {
      const ex = exerciseBySlug(item.slug)!;
      expect(["bodyweight", "dumbbell", "kettlebell"]).toContain(ex.equipment);
      expect(ex.level).toBe("beginner");
    }
  });

  it("pull day uses a rear-delt move, not a press", () => {
    const pull = generatePlan({ goal: "muscle", days: 5, level: "advanced", setting: "gym" })[1];
    expect(pull.items.some((i) => /press/.test(i.slug))).toBe(false);
  });

  it("data is consistent", () => {
    expect(new Set(EXERCISES.map((e) => e.slug)).size).toBe(EXERCISES.length);
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length);
    const ids = new Set(FOODS.map((f) => f.id));
    for (const plan of DIET_PLANS) {
      for (const it of plan.meals.flatMap((m) => m.items)) expect(ids.has(it.id)).toBe(true);
      const t = planTotals(plan);
      expect(plan.goal === "fat-loss" ? t.kcal < 2000 : t.kcal > 2300).toBe(true);
    }
  });
});
