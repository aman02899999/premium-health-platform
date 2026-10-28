import { describe, expect, it } from "vitest";
import { analyse, analyseOne, citedRange, toMarkerUnit } from "./analyse";
import { aliasClashes, buildIndex, findMarker, normaliseName } from "./match";
import { MARKERS, PANELS } from "./markers";
import type { Marker } from "./types";

const index = buildIndex(MARKERS);
const byId = (id: string) => MARKERS.find((m) => m.id === id)!;

describe("marker library", () => {
  it("has the core panels and at least 60 markers", () => {
    expect(MARKERS.length).toBeGreaterThanOrEqual(60);
    for (const p of PANELS) expect(MARKERS.some((m) => m.panel === p.id)).toBe(true);
  });

  it("has unique ids and no alias that points at two markers", () => {
    expect(new Set(MARKERS.map((m) => m.id)).size).toBe(MARKERS.length);
    expect(aliasClashes(MARKERS)).toEqual([]);
  });

  it("never names a medicine dose or promises a cure", () => {
    const text = JSON.stringify(MARKERS);
    expect(text).not.toMatch(/\b\d+\s?(mg|mcg|iu|units?)\b(?!\/)/i);
    expect(text).not.toMatch(/\bcures?\b|guarantee/i);
  });

  it("cites a source for every range and band it uses", () => {
    for (const m of MARKERS) {
      if (m.ranges.length || m.bands?.length) expect(m.sources.length, m.id).toBeGreaterThan(0);
      for (const s of m.sources) expect(s.url, m.id).toMatch(/^https:\/\//);
    }
  });
});

describe("name matching", () => {
  it.each([
    ["SGPT", "alt"],
    ["ALT (SGPT)", "alt"],
    ["S. Alanine Aminotransferase", "alt"],
    ["Haemoglobin", "hemoglobin"],
    ["Hemoglobin (Hb)", "hemoglobin"],
    ["HbA1c (Glycated/ Glycosylated Hemoglobin)", "hba1c"],
    ["LDL Cholesterol,Direct", "ldl"],
    ["LDL Cholesterol, Calculated", "ldl"],
    ["Cholesterol, Total", "cholesterol-total"],
    ["Non-HDL Cholesterol", "non-hdl"],
    ["TLC", "wbc"],
    ["Total Leucocyte Count", "wbc"],
    ["25-Hydroxy Vitamin D", "vitamin-d"],
    ["Thyroid Stimulating Hormone", "tsh"],
    ["Platelet Count", "platelets"],
    ["Serum Creatinine", "creatinine"],
    ["PCV", "hematocrit"],
  ])("%s → %s", (printed, id) => {
    expect(findMarker(index, printed)?.id).toBe(id);
  });

  it("doesn't confuse HbA1c with haemoglobin or BUN ratio with creatinine", () => {
    expect(findMarker(index, "Haemoglobin(Hb A1c)")?.id).not.toBe("hemoglobin");
    expect(findMarker(index, "BUN/Creatinine Ratio")).toBeNull();
  });

  it("normalises noise words and punctuation", () => {
    expect(normaliseName("S. Uric Acid")).toBe("uric acid");
    expect(normaliseName("Blood Urea Nitrogen (BUN)")).toBe("urea nitrogen bun");
  });
});

describe("units", () => {
  it("converts common Indian and SI units", () => {
    expect(toMarkerUnit(byId("glucose-fasting"), 5.5, "mmol/L")).toBeCloseTo(99.09, 1);
    expect(toMarkerUnit(byId("platelets"), 1.5, "lakhs/cumm")).toBe(150);
    expect(toMarkerUnit(byId("platelets"), 150000, "/cumm")).toBe(150);
    expect(toMarkerUnit(byId("platelets"), 448, "10^3/cumm")).toBe(448);
    expect(toMarkerUnit(byId("platelets"), 310, "10^3/µL")).toBe(310);
    expect(toMarkerUnit(byId("creatinine"), 88.4, "µmol/L")).toBeCloseTo(1, 3);
    expect(toMarkerUnit(byId("vitamin-d"), 50, "nmol/L")).toBeCloseTo(20.03, 1);
    expect(toMarkerUnit(byId("hemoglobin"), 135, "g/L")).toBe(13.5);
  });

  it("returns null for a unit it doesn't know, rather than guessing", () => {
    expect(toMarkerUnit(byId("hemoglobin"), 13, "mmol/L")).toBeNull();
  });
});

// A test-only marker with known numbers, so the rules are checked independently of the library.
const demo: Marker = {
  id: "demo",
  name: "Demo marker",
  panel: "cbc",
  unit: "g/dL",
  aliases: ["DM"],
  altUnits: [{ unit: "g/L", factor: 0.1 }],
  ranges: [{ low: 10, high: 20 }, { low: 12, high: 22, sex: "male" }, { low: 8, high: 18, ageMax: 12 }],
  critical: { low: 5, high: 30 },
  about: "",
  low: { meaning: "low", lifestyle: [], doctor: "d" },
  high: { meaning: "high", lifestyle: [], doctor: "d" },
  sources: [{ title: "t", publisher: "p", url: "https://example.org", checked: "2026-10-28" }],
};
const banded: Marker = { ...demo, id: "band", name: "Banded", aliases: [], ranges: [], bands: [{ label: "Normal", status: "normal", max: 5.7 }, { label: "Prediabetes", status: "high", min: 5.7, max: 6.5 }, { label: "Diabetes range", status: "high", min: 6.5 }] };
const demoIndex = buildIndex([demo, banded]);

describe("analysis rules", () => {
  it("prefers the range printed on the member's report", () => {
    const r = analyseOne(demoIndex, { name: "DM", value: 21, reportLow: 10, reportHigh: 25 }, { sex: "female" });
    expect(r.status).toBe("normal");
    expect(r.range.from).toBe("report");
  });

  it("converts the report range with the value's unit", () => {
    const r = analyseOne(demoIndex, { name: "DM", value: 260, unit: "g/L", reportLow: 100, reportHigh: 250 }, {});
    expect(r.value).toBe(26);
    expect(r.status).toBe("high");
    expect(r.range).toEqual({ low: 10, high: 25, from: "report" });
  });

  it("falls back to the cited range for the person's sex and age", () => {
    expect(citedRange(demo, { sex: "male", age: 40 })).toMatchObject({ low: 12, sex: "male" });
    expect(citedRange(demo, { sex: "female", age: 40 })).toMatchObject({ low: 10, high: 20 });
    expect(citedRange(demo, { age: 8 })).toMatchObject({ low: 8, ageMax: 12 });
    expect(analyseOne(demoIndex, { name: "DM", value: 11 }, { sex: "male", age: 40 }).status).toBe("low");
  });

  it("flags danger values whatever range decided the status", () => {
    const r = analyseOne(demoIndex, { name: "DM", value: 31, reportHigh: 40 }, {});
    expect(r.status).toBe("critical-high");
    expect(r.advice?.meaning).toBe("high");
  });

  it("uses guideline bands over the report range", () => {
    const r = analyseOne(demoIndex, { name: "Banded", value: 6, reportHigh: 6.5 }, {});
    expect(r).toMatchObject({ status: "high", bandLabel: "Prediabetes", range: { from: "guideline" } });
  });

  it("says unknown, never guesses, with no range at all", () => {
    const r = analyseOne(buildIndex([{ ...demo, ranges: [], critical: undefined }]), { name: "DM", value: 15 }, {});
    expect(r.status).toBe("unknown");
    expect(r.note).toMatch(/range printed/);
  });

  it("reports tests it doesn't know", () => {
    expect(analyseOne(demoIndex, { name: "Unobtainium", value: 1 }, {}).marker).toBeNull();
  });

  it("sorts danger first, de-duplicates and raises the urgent flag", () => {
    const a = analyse([demo], [{ name: "DM", value: 15 }, { name: "Demo marker", value: 4 }, { name: "x", value: 1 }], {});
    expect(a.results.map((r) => r.status)).toEqual(["critical-low", "unknown"]);
    expect(a.urgent).toBe(true);
    expect(a.counts["critical-low"]).toBe(1);
  });
});
