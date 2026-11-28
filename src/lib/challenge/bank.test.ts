import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { BUILT_IN, checkQuestion, questionHash } = await import("./bank");

describe("question bank", () => {
  it("has 60 questions per level with unique ids", () => {
    for (const level of ["beginner", "intermediate", "advance"]) expect(BUILT_IN.filter((q) => q.level === level)).toHaveLength(60);
    expect(new Set(BUILT_IN.map((q) => q.id)).size).toBe(BUILT_IN.length);
  });

  it("gives every question 4 different options, a valid answer and a source", () => {
    for (const q of BUILT_IN) {
      expect(q.options, q.id).toHaveLength(4);
      expect(new Set(q.options).size, q.id).toBe(4);
      expect(q.answer, q.id).toBeGreaterThanOrEqual(0);
      expect(q.answer, q.id).toBeLessThanOrEqual(3);
      expect(q.source.length, q.id).toBeGreaterThan(3);
    }
  });

  it("never names a medicine dose", () => {
    for (const q of BUILT_IN) expect([q.prompt, ...q.options, q.why].join(" "), q.id).not.toMatch(/\b\d+\s?(mg|mcg|iu|tablets?|capsules?)\b/i);
  });

  it("checks admin-typed questions strictly", () => {
    const ok = { prompt: "Which muscle does a squat train most?", options: ["Legs", "Arms", "Neck", "Ears"], answer: 0, why: "" };
    expect(checkQuestion(ok)).toBeNull();
    expect(checkQuestion({ ...ok, options: ["Legs", "legs", "Neck", "Ears"] })).toMatch(/different/);
    expect(checkQuestion({ ...ok, prompt: "Which herb cures diabetes?" })).toMatch(/cures/);
    expect(checkQuestion({ ...ok, why: "Take 500 mg daily" })).toMatch(/dose/);
  });

  it("changes the hash when the wording or answer changes", () => {
    const q = BUILT_IN[0];
    expect(questionHash(q)).not.toBe(questionHash({ ...q, answer: (q.answer + 1) % 4 }));
  });
});
