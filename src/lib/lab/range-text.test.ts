import { describe, expect, it } from "vitest";
import { parseRangeText } from "./range-text";

describe("ranges as labs print them", () => {
  it.each([
    ["13 - 17", { low: 13, high: 17 }],
    ["0.66 - 1.25", { low: 0.66, high: 1.25 }],
    ["150.0 - 410.0", { low: 150, high: 410 }],
    ["0.39 to 1.0", { low: 0.39, high: 1 }],
    ["0-24.0", { low: 0, high: 24 }],
    ["<200.00", { high: 200 }],
    ["< 5.7", { high: 5.7 }],
    [">40.00", { low: 40 }],
    ["Upto 40", { high: 40 }],
  ])("%s", (text, want) => expect(parseRangeText(text)).toEqual(want));

  it("gives up on text it can't read rather than guessing", () => {
    expect(parseRangeText("see note")).toBeNull();
    expect(parseRangeText("17 - 13")).toBeNull();
    expect(parseRangeText("")).toBeNull();
  });
});
