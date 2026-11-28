import { describe, expect, it } from "vitest";
import { LEVELS, QUESTIONS_PER_ATTEMPT, RETRY_DAYS, attemptAccess, canStart, monthOf, referralVerdict, scorePct, tierFor } from "./levels";
import { PRIZES, allocatePrizes, prizeFor, type Candidate } from "./prizes";
import { badgesFor } from "./badges";

describe("levels and scoring", () => {
  it("has 20 questions and three levels in order", () => {
    expect(QUESTIONS_PER_ATTEMPT).toBe(20);
    expect(LEVELS.map((l) => l.id)).toEqual(["beginner", "intermediate", "advance"]);
  });

  it("uses exact thresholds: 18/20 = 90%, 16 = 80%, 14 = 70% pass, 13 fails", () => {
    expect(scorePct(18)).toBe(90);
    expect(tierFor(18)).toBe("gold");
    expect(tierFor(17)).toBe("silver");
    expect(tierFor(16)).toBe("silver");
    expect(tierFor(15)).toBe("bronze");
    expect(tierFor(14)).toBe("bronze");
    expect(tierFor(13)).toBeNull();
  });

  it("unlocks a level only after passing the one below", () => {
    expect(canStart("beginner", [])).toBe(true);
    expect(canStart("intermediate", [])).toBe(false);
    expect(canStart("intermediate", [{ level: "beginner", correct: 13 }])).toBe(false);
    expect(canStart("intermediate", [{ level: "beginner", correct: 14 }])).toBe(true);
    expect(canStart("advance", [{ level: "beginner", correct: 20 }])).toBe(false);
    expect(canStart("advance", [{ level: "intermediate", correct: 15 }])).toBe(true);
  });

  it("uses the India calendar month", () => {
    expect(monthOf(new Date("2026-11-30T19:00:00Z"))).toBe("2026-12");
    expect(monthOf(new Date("2026-11-30T18:00:00Z"))).toBe("2026-11");
  });
});

describe("prize ladder", () => {
  it("matches the owner's ladder with standard-price worth", () => {
    expect(prizeFor("advance", "gold")).toBe("gym-3m");
    expect(prizeFor("advance", "silver")).toBe("gym-1m");
    expect(prizeFor("advance", "bronze")).toBe("diet-1m");
    expect(prizeFor("intermediate", "gold")).toBe("gym-1m");
    expect(prizeFor("intermediate", "silver")).toBe("gym-15d");
    expect(prizeFor("intermediate", "bronze")).toBe("diet-1m");
    expect(prizeFor("beginner", "gold")).toBe("pass-7d");
    expect(prizeFor("beginner", "silver")).toBe("pass-3d");
    expect(prizeFor("beginner", "bronze")).toBeNull();
    expect(PRIZES["gym-3m"].worth).toBe(5000);
    expect(PRIZES["gym-1m"].worth).toBe(2000);
    expect(PRIZES["diet-1m"].worth).toBe(1999);
    expect(PRIZES["gym-3m"].cap).toBe(1);
    expect(PRIZES["gym-1m"].cap).toBe(3);
    expect(PRIZES["gym-15d"].cap).toBe(5);
    expect(PRIZES["diet-1m"].cap).toBe(15);
  });
});

const c = (userId: string, level: Candidate["level"], correct: number, totalMs: number, local = true): Candidate => ({ userId, attemptId: `${userId}-${level}`, level, correct, totalMs, local });

describe("allocatePrizes", () => {
  it("gives the single 3-month prize to the best score, ties to the fastest", () => {
    const out = allocatePrizes([c("a", "advance", 19, 300_000), c("b", "advance", 20, 400_000), c("d", "advance", 20, 350_000)]);
    expect(out.find((p) => p.prize === "gym-3m")?.userId).toBe("d");
  });

  it("falls a capped-out winner through to the next prize they qualify for", () => {
    const out = allocatePrizes([c("a", "advance", 20, 1), c("b", "advance", 19, 1)]);
    expect(out).toContainEqual(expect.objectContaining({ userId: "b", prize: "gym-1m" }));
  });

  it("gives each person at most one prize, the best one", () => {
    const out = allocatePrizes([c("a", "advance", 20, 1), c("a", "intermediate", 20, 1), c("a", "beginner", 20, 1)]);
    expect(out.filter((p) => p.userId === "a")).toHaveLength(1);
    expect(out[0].prize).toBe("gym-3m");
  });

  it("swaps gym prizes for the diet plan for people outside NCR", () => {
    const out = allocatePrizes([c("far", "advance", 20, 1, false)]);
    expect(out).toEqual([expect.objectContaining({ userId: "far", prize: "diet-1m" })]);
  });

  it("never exceeds a cap", () => {
    const many = Array.from({ length: 40 }, (_, i) => c(`u${i}`, "advance", 14, i));
    const out = allocatePrizes(many);
    expect(out.filter((p) => p.prize === "diet-1m")).toHaveLength(15);
  });

  it("gives nothing for a fail", () => {
    expect(allocatePrizes([c("a", "advance", 13, 1)])).toEqual([]);
  });
});

describe("badges", () => {
  it("awards level medals, perfect score and a 3-month streak", () => {
    const b = badgesFor([
      { level: "beginner", correct: 20, month: "2026-12" },
      { level: "intermediate", correct: 16, month: "2027-01" },
      { level: "advance", correct: 14, month: "2027-02" },
      { level: "advance", correct: 10, month: "2027-03" },
    ]);
    const ids = b.map((x) => x.id);
    expect(ids).toContain("beginner-gold");
    expect(ids).toContain("intermediate-silver");
    expect(ids).toContain("advance-bronze");
    expect(ids).toContain("perfect");
    expect(ids).toContain("streak-3");
  });

  it("keeps only the best medal per level", () => {
    const ids = badgesFor([{ level: "beginner", correct: 14, month: "2026-12" }, { level: "beginner", correct: 19, month: "2027-01" }]).map((x) => x.id);
    expect(ids).toEqual(["beginner-gold"]);
  });
});


describe("retries", () => {
  const DAY = 86_400_000;
  it("lets a level be taken again 30 days after the last attempt started", () => {
    expect(RETRY_DAYS).toBe(30);
    expect(attemptAccess(null, 0, 0)).toEqual({ via: "free", nextFreeAt: null });
    expect(attemptAccess(0, 0, 29 * DAY)).toEqual({ via: null, nextFreeAt: 30 * DAY });
    expect(attemptAccess(0, 0, 30 * DAY).via).toBe("free");
  });

  it("uses a referral retry inside the 30 days", () => {
    expect(attemptAccess(0, 1, DAY).via).toBe("retry");
  });

  it("qualifies a referral only for a different person on a different network who finished Beginner, within the cap", () => {
    const ok = { selfReferral: false, friendFinishedBeginner: true, sameNetwork: false, referrerQualifiedThisMonth: 0 };
    expect(referralVerdict(ok)).toBe("qualified");
    expect(referralVerdict({ ...ok, selfReferral: true })).toBe("rejected-self");
    expect(referralVerdict({ ...ok, friendFinishedBeginner: false })).toBe("pending");
    expect(referralVerdict({ ...ok, sameNetwork: true })).toBe("rejected-network");
    expect(referralVerdict({ ...ok, referrerQualifiedThisMonth: 3 })).toBe("capped");
  });
});
