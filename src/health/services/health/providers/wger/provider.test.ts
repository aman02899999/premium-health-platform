import { describe, expect, it } from "vitest";
import { rankExercises } from "./provider";

const ex = (name: string) => ({ name });

describe("rankExercises", () => {
  it("matches names and ranks the closest first", () => {
    const items = ["Lat Pulldown", "Front Squat", "Squats", "Goblet Squat", "Bulgarian Split Squat", "Bench Press"].map(ex);
    expect(rankExercises(items, "squat").map((x) => x.name)).toEqual(["Squats", "Front Squat", "Goblet Squat", "Bulgarian Split Squat"]);
    expect(rankExercises(items, "bench press").map((x) => x.name)).toEqual(["Bench Press"]);
    expect(rankExercises(items, "split bulgarian").map((x) => x.name)).toEqual(["Bulgarian Split Squat"]);
    expect(rankExercises(items, "deadlift")).toEqual([]);
  });
  it("treats regex characters literally", () => {
    expect(rankExercises([ex("1/2 Kneeling (Rotation)")], "(rotation)")).toHaveLength(1);
  });
});
