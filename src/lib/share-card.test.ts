import { describe, expect, it } from "vitest";
import { waterIntake } from "./calculators";
import { cardFor, cardQuery, parseCardQuery, SHAREABLE, shareText, toolShareUrl } from "./share-card";

const q = (s: string) => new URLSearchParams(s);

describe("share cards", () => {
  it("only fitness calculators get a card, never health-risk ones", () => {
    expect([...SHAREABLE].sort()).toEqual(["heart-rate", "macro", "one-rep-max", "tdee", "water"]);
    for (const k of ["bmi", "body-fat", "idrs", "whtr", "ideal-weight"]) expect(parseCardQuery(q(`k=${k}&w=70`))).toBeNull();
  });

  it("round-trips inputs through the query string", () => {
    const input = { key: "macro" as const, sex: "female" as const, age: 30, weight: 62, height: 160, activity: "moderate" as const, goal: "lose" as const };
    expect(parseCardQuery(q(cardQuery(input)))).toEqual(input);
  });

  it("rejects out-of-range or junk inputs instead of drawing them", () => {
    expect(parseCardQuery(q("k=one-rep-max&w=9000&r=5"))).toBeNull();
    expect(parseCardQuery(q("k=one-rep-max&w=abc&r=5"))).toBeNull();
    expect(parseCardQuery(q("k=tdee&s=x&a=28&w=75&h=172&act=moderate"))).toBeNull();
    expect(parseCardQuery(q("k=water&w=70&m=60"))).toBeNull();
    expect(parseCardQuery(q("k=nope"))).toBeNull();
  });

  it("recomputes the result from the formulas, so the card can't carry made-up text", () => {
    const one = cardFor({ key: "one-rep-max", weight: 60, reps: 6 });
    expect(one.value).toBe("70.8");
    expect(one.unit).toBe("kg");
    const macro = cardFor({ key: "macro", sex: "male", age: 28, weight: 70, height: 172, activity: "moderate", goal: "gain" });
    expect(macro.value).toBe("126");
    expect(macro.unit).toBe("g protein");
    const water = cardFor({ key: "water", weight: 70, minutes: 60, hot: true });
    expect(water.value).toBe(String(waterIntake(70, 60, true).litres));
    const hr = cardFor({ key: "heart-rate", age: 30, resting: 70 });
    expect(hr.value).toMatch(/^\d+–\d+$/);
  });

  it("never prints body weight, height or age on the card", () => {
    const c = cardFor({ key: "tdee", sex: "male", age: 41, weight: 93, height: 181, activity: "light" });
    const all = [c.headline, c.value, c.unit, ...c.lines].join(" ");
    expect(all).not.toMatch(/\b(41|93|181)\b/);
  });

  it("links back to the same tool with a tag we can count", () => {
    const url = toolShareUrl("https://www.royalfitnesclub.in", "one-rep-max-calculator", "one-rep-max");
    expect(url).toBe("https://www.royalfitnesclub.in/tools/one-rep-max-calculator?utm_source=share&utm_medium=result_card&utm_campaign=one-rep-max");
    expect(shareText(cardFor({ key: "one-rep-max", weight: 60, reps: 6 }), url)).toContain(url);
  });
});
