import { describe, expect, it } from "vitest";
import { idrs } from "./calculators";

// Mohan et al., JAPI 2005 (CURES): <30 low, 30–50 moderate, ≥60 high.
describe("idrs (Indian Diabetes Risk Score)", () => {
  it("scores 50 as Moderate, not High", () => {
    // 30 y (0) + male waist 92 (10) + sedentary (30) + one parent (10)
    expect(idrs("male", 30, 92, "sedentary", "one")).toMatchObject({ score: 50, risk: "Moderate" });
  });
  it("scores 60 as High", () => {
    expect(idrs("male", 40, 90, "mild", "one")).toMatchObject({ score: 60, risk: "High" });
  });
  it("uses lower waist cut-offs for women (80/90 cm)", () => {
    expect(idrs("female", 30, 85, "vigorous", "none").parts.waist).toBe(10);
    expect(idrs("male", 30, 85, "vigorous", "none").parts.waist).toBe(0);
    expect(idrs("female", 30, 92, "vigorous", "none").parts.waist).toBe(20);
  });
  it("has the moderate activity level (10)", () => {
    expect(idrs("male", 30, 80, "moderate", "none").score).toBe(10);
  });
});
