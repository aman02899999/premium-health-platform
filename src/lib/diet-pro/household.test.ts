import { describe, expect, it } from "vitest";
import { half, household, mealTime } from "./household";

describe("household measures", () => {
  it("rounds to halves with the ½ glyph", () => {
    expect(half(0.2)).toBe("½");
    expect(half(1.3)).toBe("1½");
    expect(half(2)).toBe("2");
  });
  it("turns flour into rotis and rice batter into idlis", () => {
    expect(household("atta", 90, "Paneer sabzi, dal, phulka & salad").qty).toBe("3 phulkas");
    expect(household("atta", 90, "Aloo-paneer paratha with curd").qty).toBe("2 parathas");
    expect(household("jowar", 70, "Misal with jowar bhakri").qty).toBe("2 bhakris");
    expect(household("riceWhite", 48, "Idli, sambar & coconut chutney").qty).toBe("4 idli");
  });
  it("uses katori, glass and tsp", () => {
    expect(household("riceWhite", 55, "Rajma chawal").qty).toBe("1 katori cooked");
    expect(household("moongDal", 30, "x").qty).toBe("1 katori cooked");
    expect(household("milkLowFat", 200, "x").qty).toBe("1 glass");
    expect(household("ghee", 10, "x").qty).toBe("2 tsp");
    expect(household("almonds", 12, "x").qty).toBe("10 almonds");
    expect(household("whey", 30, "x", { scoopG: 30 }).qty).toBe("1 scoop");
  });
  it("times meals from the wake-up time", () => {
    expect(mealTime("Breakfast", "06:30")).toBe("8:00 am");
    expect(mealTime("Lunch", "06:30")).toBe("1:30 pm");
    expect(mealTime("Dinner", "07:00")).toBe("8:30 pm");
    expect(mealTime("Dinner", "07:00", 3)).toBe("8:00 pm");
    expect(mealTime("Breakfast", "bad")).toBe("8:00 am");
  });
});
