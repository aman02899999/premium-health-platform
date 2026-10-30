// The analyser: turns typed-in (later, PDF-read) results into a status per marker. Pure, so the
// rules are tested without a database. Order of trust for the range:
//   1. guideline categories (HbA1c, LDL...), which don't vary by lab
//   2. the range printed on the member's own report
//   3. a cited reference range for their sex and age
// With none of these the status is "unknown": we never invent a range.
import { buildIndex, findMarker, normaliseName, type MarkerIndex } from "./match";
import type { AnalysedResult, Analysis, Marker, Person, RefRange, ResultInput, Status } from "./types";

/** Spellings of the same unit compare equal: "gm/dL" = "g/dL", "10³/µL" = "10^3/cumm", "µm³" = "fL". */
export const unitKey = (u: string) =>
  u
    .toLowerCase()
    .replace(/[µμ]/g, "u")
    .replace(/\s+/g, "")
    .replace(/³/g, "3")
    .replace(/²/g, "2")
    .replace(/^(?:um3|cumicrons?|cubicmicrons?)$/, "fl")
    .replace(/^gm(?=\/|%)/, "g")
    .replace(/mcg/g, "ug")
    .replace(/10\^?3/g, "10^3")
    .replace(/10\^?6/g, "10^6")
    .replace(/cumm|mm3|cmm/g, "ul");

/** The value in the marker's own unit, or null when the unit is one we don't know for it. */
export function toMarkerUnit(m: Marker, value: number, unit?: string): number | null {
  if (!unit || !unit.trim() || unitKey(unit) === unitKey(m.unit)) return value;
  const alt = m.altUnits?.find((a) => unitKey(a.unit) === unitKey(unit));
  return alt ? round(value * alt.factor) : null;
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/** The cited range that fits this person best: sex and age specific first, then general. */
export function citedRange(m: Marker, p: Person): RefRange | null {
  const fits = m.ranges.filter(
    (r) => (!r.sex || r.sex === p.sex) && (r.ageMin === undefined || (p.age ?? -1) >= r.ageMin) && (r.ageMax === undefined || (p.age ?? Infinity) <= r.ageMax),
  );
  // Sex-specific ranges only apply when we know the sex.
  const score = (r: RefRange) => (r.sex ? 2 : 0) + (r.ageMin !== undefined || r.ageMax !== undefined ? 1 : 0);
  return fits.sort((a, b) => score(b) - score(a))[0] ?? null;
}

function statusIn(low: number | undefined, high: number | undefined, v: number): Status {
  if (low !== undefined && v < low) return "low";
  if (high !== undefined && v > high) return "high";
  return "normal";
}

export function analyseOne(index: MarkerIndex, input: ResultInput, person: Person): AnalysedResult {
  const marker = findMarker(index, input.name);
  if (!marker) return { input, marker: null, value: null, status: "unknown", range: { from: "none" }, note: "We don't have this test in our library yet." };
  const pub = { id: marker.id, name: marker.name, panel: marker.panel, unit: marker.unit, about: marker.about, guide: marker.guide, sources: marker.sources };
  const value = toMarkerUnit(marker, input.value, input.unit);
  if (value === null || !Number.isFinite(value)) {
    return { input, marker: pub, value: null, status: "unknown", range: { from: "none" }, note: `We couldn't convert "${input.unit}" to ${marker.unit}. Check the unit on your report.` };
  }

  let status: Status = "unknown";
  let bandLabel: string | undefined;
  let range: AnalysedResult["range"] = { from: "none" };

  const band = marker.bands?.find((b) => (!b.sex || b.sex === person.sex) && (b.ageMin === undefined || (person.age ?? -1) >= b.ageMin) && (b.min === undefined || value >= b.min) && (b.max === undefined || value < b.max));
  const reportLow = input.reportLow === undefined ? undefined : toMarkerUnit(marker, input.reportLow, input.unit) ?? undefined;
  const reportHigh = input.reportHigh === undefined ? undefined : toMarkerUnit(marker, input.reportHigh, input.unit) ?? undefined;

  if (band) {
    status = band.status;
    bandLabel = band.label;
    range = { from: "guideline" };
  } else if (reportLow !== undefined || reportHigh !== undefined) {
    status = statusIn(reportLow, reportHigh, value);
    range = { low: reportLow, high: reportHigh, from: "report" };
  } else {
    const cited = citedRange(marker, person);
    if (cited) {
      status = statusIn(cited.low, cited.high, value);
      range = { low: cited.low, high: cited.high, from: "cited" };
    }
  }

  // Danger thresholds apply whichever range decided the status.
  if (marker.critical?.low !== undefined && value <= marker.critical.low) status = "critical-low";
  if (marker.critical?.high !== undefined && value >= marker.critical.high) status = "critical-high";

  const advice = status === "low" || status === "critical-low" ? marker.low : status === "high" || status === "critical-high" ? marker.high : undefined;
  const note = range.from === "none" && status === "unknown" ? "Add the range printed next to this value on your report and we'll compare against it." : undefined;
  return { input, marker: pub, value, status, bandLabel, range, advice, note };
}

const SEVERITY: Record<Status, number> = { "critical-low": 0, "critical-high": 0, low: 1, high: 1, unknown: 2, normal: 3 };

export function analyse(markers: Marker[], inputs: ResultInput[], person: Person): Analysis {
  const index = buildIndex(markers);
  // One result per test: a test typed twice (even under two names) keeps the last value.
  const unique = new Map<string, AnalysedResult>();
  for (const i of inputs) {
    if (!i.name.trim() || !Number.isFinite(i.value)) continue;
    const r = analyseOne(index, i, person);
    unique.set(r.marker?.id ?? `?${normaliseName(i.name)}`, r);
  }
  const results = [...unique.values()].sort((a, b) => SEVERITY[a.status] - SEVERITY[b.status]);
  const counts = { "critical-low": 0, low: 0, normal: 0, high: 0, "critical-high": 0, unknown: 0 } as Record<Status, number>;
  for (const r of results) counts[r.status]++;
  return { results, counts, urgent: counts["critical-low"] + counts["critical-high"] > 0 };
}
