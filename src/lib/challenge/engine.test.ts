import { describe, expect, it } from "vitest";
import { answer, newAttempt, reveal, view, correctCount, expire, type Bank } from "./engine";

const ids = Array.from({ length: 30 }, (_, i) => `q${i}`);
const bank: Bank = { prompt: (id) => `Question ${id}?`, options: (id) => ["A", "B", "C", "D"].map((x) => `${x}-${id}`), answer: () => 2 };
let seed = 1;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const T0 = 1_800_000_000_000;

/** Display position of the right answer for the current question. */
const rightPos = (s: ReturnType<typeof newAttempt>) => s.orders[s.index].indexOf(2);

describe("attempt engine", () => {
  it("draws 20 different questions and never leaks the answer", () => {
    const s = newAttempt("a", "beginner", ids, T0, rand);
    expect(new Set(s.questionIds).size).toBe(20);
    const v = view(s, T0, bank);
    expect(v.question?.options).toBeNull();
    const r = reveal(v.state, 0, T0 + 2000, bank);
    expect(r.question?.options).toHaveLength(4);
    expect(JSON.stringify(r.question)).not.toMatch(/answer|correct/);
  });

  it("refuses an attempt when fewer than 20 questions are approved", () => {
    expect(() => newAttempt("a", "beginner", ids.slice(0, 19), T0)).toThrow("not-enough-questions");
  });

  it("needs the options revealed before an answer", () => {
    const s = view(newAttempt("a", "beginner", ids, T0, rand), T0, bank).state;
    expect(answer(s, 0, 0, T0 + 1000, bank).error).toBe("not-revealed");
  });

  it("scores a full run of right answers as 20", () => {
    let s = newAttempt("a", "beginner", ids, T0, rand);
    let t = T0;
    for (let i = 0; i < 20; i++) {
      s = view(s, t, bank).state;
      s = reveal(s, i, (t += 1000), bank).state;
      s = answer(s, i, rightPos(s), (t += 1000), bank).state;
    }
    expect(s.finishedAt).not.toBeNull();
    expect(correctCount(s)).toBe(20);
  });

  it("counts a late answer as wrong, by the server clock", () => {
    let s = view(newAttempt("a", "beginner", ids, T0, rand), T0, bank).state;
    s = reveal(s, 0, T0 + 1000, bank).state;
    const right = rightPos(s);
    const late = answer(s, 0, right, T0 + 34_000, bank);
    expect(late.error).toBe("stale");
    expect(late.state.answers[0]).toMatchObject({ chosen: null, correct: false });
    expect(late.state.index).toBe(1);
  });

  it("refuses a second tap on the same question", () => {
    let s = view(newAttempt("a", "beginner", ids, T0, rand), T0, bank).state;
    s = reveal(s, 0, T0 + 1000, bank).state;
    s = answer(s, 0, 0, T0 + 2000, bank).state;
    const again = answer(s, 0, rightPos({ ...s, index: 0 }), T0 + 2500, bank);
    expect(again.error).toBe("stale");
    expect(again.state.answers).toHaveLength(1);
  });

  it("refuses an answer for a question not yet shown", () => {
    let s = view(newAttempt("a", "beginner", ids, T0, rand), T0, bank).state;
    s = reveal(s, 0, T0 + 1000, bank).state;
    expect(answer(s, 5, 0, T0 + 2000, bank).error).toBe("stale");
  });

  it("ends an abandoned attempt after a day with the rest wrong", () => {
    const s = expire(newAttempt("a", "beginner", ids, T0, rand), T0 + 25 * 3_600_000);
    expect(s.finishedAt).not.toBeNull();
    expect(s.answers).toHaveLength(20);
    expect(correctCount(s)).toBe(0);
  });

  it("rejects an option outside 0-3", () => {
    let s = view(newAttempt("a", "beginner", ids, T0, rand), T0, bank).state;
    s = reveal(s, 0, T0 + 1000, bank).state;
    expect(answer(s, 0, 7, T0 + 2000, bank).error).toBe("bad-choice");
  });
});
