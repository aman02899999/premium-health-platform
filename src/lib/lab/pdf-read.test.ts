import { describe, expect, it } from "vitest";
import { MARKERS } from "./markers";
import { readReport, toLines, type TextItem } from "./pdf-read";

// Lines below copy the layouts of real Indian lab reports (Max Lab, Lal PathLabs and a
// HiQPdf-made report), with made-up values and no patient details.
const markers = MARKERS.map((m) => ({ ...m, units: [m.unit, ...(m.altUnits ?? []).map((u) => u.unit)] }));
const read = (lines: string[][]) => readReport(lines, markers);
const byId = (lines: string[][]) => Object.fromEntries(read(lines).results.map((r) => [r.markerId, r]));

describe("grouping PDF text into lines", () => {
  const item = (str: string, x: number, y: number, w = str.length * 4): TextItem => ({ str, x, y, w, h: 9 });

  it("puts items on one baseline in a line, left to right, and keeps columns apart", () => {
    const page = [item("15.8", 149, 519), item("Haemoglobin", 34, 520), item("g/dL", 452, 519), item("13 - 17", 494, 519), item("MCV", 34, 497), item("82 - 97", 494, 497)];
    expect(toLines([page])).toEqual([["Haemoglobin", "15.8", "g/dL", "13 - 17"], ["MCV", "82 - 97"]]);
  });

  it("joins pieces of one cell that a PDF split up", () => {
    expect(toLines([[item("Total", 34, 400, 20), item("Protein", 56, 400, 30), item("7.6", 149, 400)]])).toEqual([["Total Protein", "7.6"]]);
  });
});

describe("reading results from a report", () => {
  it("reads name, value, unit and the lab's range", () => {
    const r = byId([
      ["Haemoglobin", "15.8", "g/dL", "13 - 17"],
      ["Packed Cell, Volume", "47.0", "%", "40 - 50"],
      ["Cholesterol Total", "165", "mg/dL", "<200.00"],
      ["HDL Cholesterol", "45", "mg/dL", ">40.00"],
      ["ESR (Modified", "09", "mm/hr", "<=10"],
      ["A : G Ratio", "1.33", "0.90 - 2.00"],
    ]);
    expect(r.hemoglobin).toMatchObject({ value: "15.8", unit: "g/dL", range: "13 - 17" });
    expect(r.hematocrit.value).toBe("47.0");
    expect(r["cholesterol-total"].range).toBe("<200.00");
    expect(r.hdl.range).toBe(">40.00");
    expect(r.esr).toMatchObject({ value: "09", range: "<=10" });
    expect(r["ag-ratio"]).toMatchObject({ unit: "", range: "0.90 - 2.00" });
  });

  it("splits a value glued to the name, and skips a High/Low flag", () => {
    const r = byId([["Total Leucocyte Count (TLC) 12.62", "10^3/μL", "4 - 10"], ["ALT (SGPT)", "51.0", "H", "U/L", "10.00 - 49.00"]]);
    expect(r.wbc).toMatchObject({ value: "12.62", unit: "10^3/μL", range: "4 - 10" });
    expect(r.alt).toMatchObject({ value: "51.0", unit: "U/L" });
  });

  it("reads a long name that wrapped onto the next line by its abbreviation, when the unit agrees", () => {
    const r = byId([["SGOT- Aspartate", "56.4", "U/L", "17.0 - 59.0"], ["Aminotransferase"]]);
    expect(r.ast.value).toBe("56.4");
    // The abbreviation alone isn't enough without a unit that fits the test.
    expect(read([["TSH Receptor Antibody", "1.2"]]).results).toEqual([]);
    expect(read([["MCV Index", "12", "ratio", "0 - 20"]]).results).toEqual([]);
    expect(byId([["RDW SD", "44.5", "F/L", "38.5 - 45.5"]])["rdw-sd"].value).toBe("44.5");
  });

  it("reads an absolute count printed under the percentage's name by its unit", () => {
    const r = byId([["Neutrophils", "52.10", "%", "40.00 - 80.00"], ["Neutrophils", "2.29", "thou/mm3", "2.00 - 7.00"], ["Eosinophils", "0.30", "thou/mm3", "0.02 - 0.50"]]);
    expect(r.neutrophils.value).toBe("52.10");
    expect(r.anc).toMatchObject({ value: "2.29", range: "2.00 - 7.00" });
    expect(r.aec.value).toBe("0.30");
  });

  it("reads hormone and advanced tests", () => {
    const r = byId([["Testosterone, Total", "512", "ng/dL", "249 - 836"], ["Prolactin", "14.2", "ng/mL", "4.0 - 15.2"], ["Lipoprotein (a)", "42", "mg/dL", "<30"], ["CPK", "1450", "U/L", "39 - 308"], ["PT (Patient)", "12.8", "sec", "11 - 13.5"]]);
    expect(Object.keys(r).sort()).toEqual(["ck", "lpa", "prolactin", "pt", "testosterone-total"]);
  });

  it("never reads urine tests, absolute counts or other units as the blood test", () => {
    const r = byId([
      ["Neutrophils", "52.10", "%", "40.00 - 80.00"],
      ["Neutrophils", "2.29", "thou/mm3", "2.00 - 7.00"],
      ["RBC Count", "4.60", "mill/mm3", "4.50 - 5.50"],
      ["RBC", "0.00", "/hpf", "0.0 - 2.0"],
      ["Creatinine, Urine", "88", "mg/dL"],
      ["Albumin, Urine", "12", "mg/L"],
    ]);
    expect(r.neutrophils.value).toBe("52.10");
    expect(r.rbc.value).toBe("4.60");
    expect(r.creatinine).toBeUndefined();
    expect(r.albumin).toBeUndefined();
  });

  it("keeps the first value when a test appears twice", () => {
    expect(byId([["Glucose Fasting", "83", "mg/dL", "70 - 100"], ["Glucose, Fasting", "90", "mg/dL", "70 - 100"]])["glucose-fasting"].value).toBe("83");
  });

  it("ignores headers, addresses and the patient's details", () => {
    const out = read([
      ["Patient Name", ":", "Mr. Test Person"],
      ["Lab No.", ":", "487952737"],
      ["SK 82 A, behind kotak bank", "N-27, SECTOR-18, NOIDA - 201301"],
      ["Date", "22/Oct/2026"],
      ["Normal", "70-100"],
    ]);
    expect(out.results).toEqual([]);
    expect(out.skipped).toEqual([]);
  });

  it("lists result lines for tests we don't cover yet, so the member can type them in", () => {
    expect(read([["Vitamin A", "512", "ng/mL", "200 - 800"], ["HOMA-IR", "2.1", "0 - 2.5"]]).skipped).toEqual(["Vitamin A", "HOMA-IR"]);
  });
});

describe("reading age and sex from the header", () => {
  it.each([
    [[["Age/Gender", ":", "29 Y 0 M 0 D / M"]], { age: 29, sex: "male" }],
    [[["Age / Gender:", "44 Y 0 M 0 D /Female"]], { age: 44, sex: "female" }],
    [[["Age", ":", "36 Years"], ["Gender", ":", "Male"]], { age: 36, sex: "male" }],
    [[["Sex", ":", "F"], ["Age", ":", "52 Yrs"]], { age: 52, sex: "female" }],
    [[["Date", "22/Oct/2026"]], {}],
  ])("%j", (lines, want) => expect(read(lines as string[][]).person).toEqual(want));
});
