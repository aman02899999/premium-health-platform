// Member outcome numbers, computed only from case studies the admin entered with the member's
// consent. Nothing here is estimated: an average appears only when at least one member has
// both a start and an end value for it, and every label says how many members it covers.
import type { CaseStudy } from "./types";

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0);
const pair = (a: unknown, b: unknown) => num(a) > 0 && num(b) > 0;

/** Consented, named, dated studies with at least one before/after pair. */
export function publishedStudies(studies: CaseStudy[] | undefined): CaseStudy[] {
  return (studies ?? []).filter(
    (s) =>
      s.consent === true &&
      typeof s.name === "string" &&
      s.name.trim().length > 1 &&
      num(s.weeks) > 0 &&
      (pair(s.startWeight, s.endWeight) || pair(s.startWaist, s.endWaist) || pair(s.startLift, s.endLift)),
  );
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const r1 = (v: number) => Math.round(v * 10) / 10;
const signed = (v: number, unit: string) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(r1(v))} ${unit}`;
const members = (n: number) => `${n} member${n === 1 ? "" : "s"}`;

export type StatTile = { value: string; label: string };

export function resultStats(studies: CaseStudy[]): { count: number; tiles: StatTile[] } {
  const s = publishedStudies(studies);
  const tiles: StatTile[] = [];
  // Fat-loss and muscle-gain members move in opposite directions; one average would hide both.
  const w = s.filter((x) => pair(x.startWeight, x.endWeight)).map((x) => x.endWeight - x.startWeight);
  const lost = w.filter((d) => d < 0);
  const gained = w.filter((d) => d > 0);
  if (lost.length) tiles.push({ value: signed(avg(lost), "kg"), label: `Average weight lost (${members(lost.length)} who lost weight)` });
  if (gained.length) tiles.push({ value: signed(avg(gained), "kg"), label: `Average weight gained (${members(gained.length)} building muscle)` });
  const waist = s.filter((x) => pair(x.startWaist, x.endWaist)).map((x) => x.endWaist - x.startWaist);
  if (waist.length) tiles.push({ value: signed(avg(waist), "cm"), label: `Average waist change (${members(waist.length)})` });
  const lift = s.filter((x) => pair(x.startLift, x.endLift)).map((x) => ((x.endLift - x.startLift) / x.startLift) * 100);
  if (lift.length) tiles.push({ value: `${avg(lift) >= 0 ? "+" : "−"}${Math.abs(Math.round(avg(lift)))}%`, label: `Average strength change on a tracked lift (${members(lift.length)})` });
  if (s.length) tiles.push({ value: `${Math.round(avg(s.map((x) => x.weeks)))} weeks`, label: `Average time between measurements (${members(s.length)})` });
  return { count: s.length, tiles };
}

const change = (a: number, b: number, unit: string) => (pair(a, b) ? `${r1(a)} → ${r1(b)} (${signed(b - a, unit)})` : "—");

export function caseStudyRows(studies: CaseStudy[]) {
  return publishedStudies(studies).map((s) => ({
    id: s.id,
    name: s.name.trim(),
    program: s.program || "—",
    weeks: s.weeks,
    weight: change(s.startWeight, s.endWeight, "kg"),
    waist: change(s.startWaist, s.endWaist, "cm"),
    lift: pair(s.startLift, s.endLift) ? `${s.liftName || "Lift"}: ${change(s.startLift, s.endLift, "kg")}` : "—",
    verifiedOn: s.verifiedOn || "—",
  }));
}
