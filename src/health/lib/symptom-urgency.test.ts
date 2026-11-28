import { describe, expect, it } from "vitest";
import { symptomUrgency } from "./symptom-urgency";

const base = { symptom: "Fever", extra: ["Fatigue"], severity: "Moderate — affects routine", duration: "2–3 days", age: "Adult (18–60)" };

describe("symptomUrgency", () => {
  it("keeps a moderate adult fever at a same-week visit", () => {
    expect(symptomUrgency(base).text).toMatch(/same-week/);
  });
  it("asks for a same-day visit when fever comes with a rash", () => {
    expect(symptomUrgency({ ...base, extra: ["Rash"] }).text).toMatch(/today/);
  });
  it("asks for a same-day visit when fever comes with vomiting", () => {
    expect(symptomUrgency({ ...base, extra: ["Vomiting"] }).text).toMatch(/dengue or malaria/);
  });
  it("treats chest discomfort or severe symptoms as an emergency", () => {
    expect(symptomUrgency({ ...base, extra: ["Chest discomfort"] }).emergency).toBe(true);
    expect(symptomUrgency({ ...base, severity: "Severe — cannot function / alarming" }).emergency).toBe(true);
  });
});
