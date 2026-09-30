import { describe, it, expect } from "vitest";
import { formatWBValue, INDICATORS } from "./worldbank";
import type { WBIndicator } from "./worldbank";

describe("worldbank", () => {
  it("has 10 indicators defined", () => {
    expect(INDICATORS.length).toBe(10);
    expect(INDICATORS.map((i) => i.code)).toContain("SP.DYN.LE00.IN");
  });

  it("formatWBValue handles population", () => {
    const ind: WBIndicator = {
      code: "SP.POP.TOTL",
      label: "Population",
      value: 1_428_000_000,
      year: 2023,
      unit: "people",
      source: "WB",
    };
    expect(formatWBValue(ind)).toContain("B");
  });

  it("formatWBValue returns dash for null", () => {
    const ind: WBIndicator = {
      code: "SH.DYN.MORT",
      label: "Under-5",
      value: null,
      year: null,
      unit: "per 1k",
      source: "WB",
    };
    expect(formatWBValue(ind)).toBe("—");
  });
});
