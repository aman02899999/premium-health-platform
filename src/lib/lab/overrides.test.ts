import { describe, expect, it } from "vitest";
import { MARKERS } from "./markers";
import { applyOverrides, parseAnalyseRequest, parseOverride, textProblem } from "./overrides";

const alt = MARKERS.find((m) => m.id === "alt")!;
const uncited = { ...MARKERS.find((m) => m.id === "mpv")!, ranges: [], sources: [] };

describe("admin marker edits", () => {
  it("adds synonyms and keeps a working edit", () => {
    const o = parseOverride(alt, MARKERS, { aliases: [...alt.aliases, "Alanine amino transferase", " "] });
    expect(typeof o).toBe("object");
    expect(applyOverrides(MARKERS, { alt: o as object }).find((m) => m.id === "alt")!.aliases).toContain("Alanine amino transferase");
  });

  it("refuses a synonym that already belongs to another test", () => {
    expect(parseOverride(alt, MARKERS, { aliases: ["SGOT"] })).toMatch(/already a name/);
  });

  it("refuses ranges without an official source", () => {
    expect(parseOverride(uncited, MARKERS, { ranges: [{ low: 7, high: 11 }] })).toMatch(/official page/);
    expect(parseOverride(uncited, MARKERS, { ranges: [{ low: 7, high: 11 }], sources: [{ url: "https://example.gov/mpv", title: "MPV" }] })).toMatchObject({ ranges: [{ low: 7, high: 11 }] });
  });

  it("refuses an upside-down range", () => {
    expect(parseOverride(alt, MARKERS, { ranges: [{ low: 40, high: 10 }] })).toMatch(/below/);
  });

  it("blocks doses and cure claims in admin text", () => {
    expect(textProblem("Take 60000 IU weekly")).toMatch(/medicine amount/);
    expect(textProblem("This herb cures fatty liver")).toMatch(/cure/);
    expect(textProblem("Walk 30 minutes after meals")).toBeNull();
    expect(parseOverride(alt, MARKERS, { high: { meaning: "x", doctor: "y", lifestyle: ["Take 500 mg daily"] } })).toMatch(/medicine amount/);
  });

  it("passes every built-in text through the same checks", () => {
    for (const m of MARKERS) for (const t of [m.about, m.low?.meaning, m.high?.meaning, ...(m.low?.lifestyle ?? []), ...(m.high?.lifestyle ?? []), ...(m.low?.ayurveda ?? []), ...(m.high?.ayurveda ?? []), m.low?.doctor, m.high?.doctor]) if (t) expect([m.id, textProblem(t)]).toEqual([m.id, null]);
  });

  it("can hide a test without deleting it", () => {
    const o = parseOverride(alt, MARKERS, { hidden: true });
    expect(o).toEqual({ hidden: true });
  });
});

describe("member requests", () => {
  const ok = { consent: true, sex: "female", age: "34", results: [{ name: "Haemoglobin", value: "11.2", unit: "g/dL", reportLow: "12", reportHigh: "15" }, { name: "", value: 1 }] };

  it("needs consent, sex and an adult age", () => {
    expect(parseAnalyseRequest({ ...ok, consent: false })).toMatch(/agree/);
    expect(parseAnalyseRequest({ ...ok, sex: "" })).toMatch(/male or female/);
    expect(parseAnalyseRequest({ ...ok, age: 12 })).toMatch(/18 or over/);
  });

  it("keeps filled rows only and reads numbers typed as text", () => {
    expect(parseAnalyseRequest(ok)).toEqual({ person: { sex: "female", age: 34 }, save: false, results: [{ name: "Haemoglobin", value: 11.2, unit: "g/dL", reportLow: 12, reportHigh: 15 }] });
  });

  it("catches a range typed the wrong way round", () => {
    expect(parseAnalyseRequest({ ...ok, results: [{ name: "Hb", value: 11, reportLow: 15, reportHigh: 12 }] })).toMatch(/lower one/);
  });
});
