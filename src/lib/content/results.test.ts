import { describe, expect, it } from "vitest";
import type { CaseStudy } from "./types";
import { caseStudyRows, publishedStudies, resultStats } from "./results";

const study = (o: Partial<CaseStudy>): CaseStudy => ({
  id: Math.random().toString(36).slice(2),
  name: "Rahul S.",
  program: "Fat Loss",
  weeks: 12,
  startWeight: 0,
  endWeight: 0,
  startWaist: 0,
  endWaist: 0,
  liftName: "",
  startLift: 0,
  endLift: 0,
  story: "",
  beforeImage: "",
  afterImage: "",
  verifiedOn: "2026-09-01",
  consent: true,
  ...o,
});

describe("publishedStudies", () => {
  it("needs consent, a name, weeks and at least one before/after pair", () => {
    expect(publishedStudies([study({ startWeight: 80, endWeight: 74 })])).toHaveLength(1);
    expect(publishedStudies([study({ startWeight: 80, endWeight: 74, consent: false })])).toHaveLength(0);
    expect(publishedStudies([study({ startWeight: 80 })])).toHaveLength(0);
    expect(publishedStudies([study({ name: " ", startWeight: 80, endWeight: 74 })])).toHaveLength(0);
    expect(publishedStudies(undefined)).toHaveLength(0);
  });
});

describe("resultStats", () => {
  it("averages only members who have each measurement, and says how many", () => {
    const s = resultStats([
      study({ startWeight: 90, endWeight: 82, startWaist: 100, endWaist: 92 }),
      study({ startWeight: 70, endWeight: 66, weeks: 8 }),
      study({ startLift: 60, endLift: 90, liftName: "Squat", weeks: 16 }),
      study({ startWeight: 70, endWeight: 60, consent: false }),
    ]);
    expect(s.count).toBe(3);
    expect(s.tiles).toEqual([
      { value: "−6 kg", label: "Average weight lost (2 members who lost weight)" },
      { value: "−8 cm", label: "Average waist change (1 member)" },
      { value: "+50%", label: "Average strength change on a tracked lift (1 member)" },
      { value: "12 weeks", label: "Average time between measurements (3 members)" },
    ]);
  });

  it("keeps weight lost and weight gained apart", () => {
    const s = resultStats([study({ startWeight: 88, endWeight: 80 }), study({ startWeight: 62, endWeight: 66 })]);
    expect(s.tiles.slice(0, 2)).toEqual([
      { value: "−8 kg", label: "Average weight lost (1 member who lost weight)" },
      { value: "+4 kg", label: "Average weight gained (1 member building muscle)" },
    ]);
  });

  it("is empty with no consented data", () => {
    expect(resultStats([])).toEqual({ count: 0, tiles: [] });
  });
});

describe("caseStudyRows", () => {
  it("formats before → after with the change", () => {
    const [r] = caseStudyRows([study({ startWeight: 84, endWeight: 76.5, startLift: 40, endLift: 60, liftName: "Bench" })]);
    expect(r.weight).toBe("84 → 76.5 (−7.5 kg)");
    expect(r.waist).toBe("—");
    expect(r.lift).toBe("Bench: 40 → 60 (+20 kg)");
  });
});
