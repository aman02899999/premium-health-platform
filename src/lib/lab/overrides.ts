// Admin edits on top of the marker library (stored in public.lab_marker_overrides), and the
// checks every edit and every member request goes through. Pure, so it is tested without a database.
import { aliasClashes } from "./match";
import type { Advice, Marker, Person, RefRange, ResultInput, Sex, Source } from "./types";

export type MarkerOverride = Partial<Pick<Marker, "name" | "aliases" | "ranges" | "critical" | "about" | "low" | "high" | "hidden" | "sources">>;

export function applyOverrides(markers: Marker[], overrides: Record<string, MarkerOverride>): Marker[] {
  return markers.map((m) => (overrides[m.id] ? { ...m, ...overrides[m.id] } : m));
}

// The YMYL rules, enforced on admin text too: no medicine doses, no cure or guarantee claims.
const DOSE = /\b\d+(\.\d+)?\s?(mg|mcg|µg|iu|units?|tablets?|capsules?|ml)\b(?!\s*\/)/i;
const CLAIM = /\bcure[sd]?\b|\bguarantee|\b100\s?%\s?(safe|results?)|\breverse[sd]?\b/i;

export function textProblem(text: string): string | null {
  if (DOSE.test(text)) return "Remove the medicine amount: the analyser never gives doses.";
  if (CLAIM.test(text)) return "Remove cure or guarantee wording: say what may help or support instead.";
  return null;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const num = (v: unknown): number | undefined => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
};
const isSex = (v: unknown): v is Sex => v === "male" || v === "female";

function parseAdvice(v: unknown): Advice | string | undefined {
  if (v === undefined || v === null) return undefined;
  const a = v as Record<string, unknown>;
  const advice: Advice = {
    meaning: str(a.meaning, 600),
    lifestyle: Array.isArray(a.lifestyle) ? a.lifestyle.map((x) => str(x, 300)).filter(Boolean).slice(0, 8) : [],
    ayurveda: Array.isArray(a.ayurveda) ? a.ayurveda.map((x) => str(x, 300)).filter(Boolean).slice(0, 4) : [],
    doctor: str(a.doctor, 400),
  };
  if (!advice.meaning || !advice.doctor) return "Each direction needs a meaning and a 'see a doctor' line.";
  for (const t of [advice.meaning, advice.doctor, ...advice.lifestyle, ...(advice.ayurveda ?? [])]) {
    const p = textProblem(t);
    if (p) return p;
  }
  return advice;
}

/** An admin's edit, checked. A string is the message to show them. */
export function parseOverride(base: Marker, all: Marker[], b: Record<string, unknown>): MarkerOverride | string {
  const out: MarkerOverride = {};
  if (b.name !== undefined) {
    out.name = str(b.name, 80);
    if (out.name.length < 2) return "Give the test a name.";
  }
  if (b.aliases !== undefined) {
    if (!Array.isArray(b.aliases)) return "Synonyms must be a list.";
    out.aliases = [...new Set(b.aliases.map((x) => str(x, 80)).filter(Boolean))].slice(0, 40);
  }
  if (b.ranges !== undefined) {
    if (!Array.isArray(b.ranges)) return "Ranges must be a list.";
    const ranges: RefRange[] = [];
    for (const r of b.ranges as Record<string, unknown>[]) {
      const range: RefRange = { low: num(r.low), high: num(r.high), sex: isSex(r.sex) ? r.sex : undefined, ageMin: num(r.ageMin), ageMax: num(r.ageMax) };
      if (range.low === undefined && range.high === undefined) return "Each range needs a low or a high value.";
      if (range.low !== undefined && range.high !== undefined && range.low >= range.high) return "A range's low value must be below its high value.";
      ranges.push(Object.fromEntries(Object.entries(range).filter(([, v]) => v !== undefined)) as RefRange);
    }
    out.ranges = ranges.slice(0, 12);
  }
  if (b.critical !== undefined) {
    const c = (b.critical ?? {}) as Record<string, unknown>;
    out.critical = Object.fromEntries(Object.entries({ low: num(c.low), high: num(c.high) }).filter(([, v]) => v !== undefined));
  }
  if (b.sources !== undefined) {
    if (!Array.isArray(b.sources)) return "Sources must be a list.";
    const sources: Source[] = [];
    for (const s of b.sources as Record<string, unknown>[]) {
      const url = str(s.url, 300);
      if (!/^https:\/\/[^\s]+$/.test(url)) return "Each source needs an https:// link.";
      sources.push({ title: str(s.title, 120) || url, publisher: str(s.publisher, 120), url, checked: /^\d{4}-\d{2}-\d{2}$/.test(str(s.checked, 10)) ? str(s.checked, 10) : new Date().toISOString().slice(0, 10) });
    }
    out.sources = sources.slice(0, 6);
  }
  if (b.about !== undefined) {
    out.about = str(b.about, 400);
    const p = textProblem(out.about);
    if (p) return p;
  }
  for (const dir of ["low", "high"] as const) {
    if (b[dir] === undefined) continue;
    const a = parseAdvice(b[dir]);
    if (typeof a === "string") return a;
    out[dir] = a;
  }
  if (b.hidden !== undefined) out.hidden = b.hidden === true;

  // Every number shown to members needs a source.
  const merged = { ...base, ...out };
  if ((merged.ranges.length || merged.bands?.length) && !merged.sources.length) return "Add the official page these ranges come from.";
  const clash = aliasClashes(all.map((m) => (m.id === base.id ? merged : m)))[0];
  if (clash) return `"${clash.alias}" is already a name for another test (${clash.ids.filter((id) => id !== base.id).join(", ")}).`;
  return out;
}

export const CONSENT_VERSION = "2026-10-28";

export type AnalyseRequest = { person: Person; results: ResultInput[]; save: boolean };

/** A member's typed-in report, checked. A string is the message to show them. */
export function parseAnalyseRequest(b: Record<string, unknown> | null): AnalyseRequest | string {
  if (!b) return "Invalid request";
  if (b.consent !== true) return "Please tick the box to agree to how we use your report.";
  const sex = isSex(b.sex) ? b.sex : undefined;
  const age = num(b.age);
  if (!sex) return "Please choose male or female: many ranges depend on it.";
  if (age === undefined || age < 18 || age > 110 || !Number.isInteger(age)) return "Please enter your age in years (18 or over: ranges for children are different).";
  if (!Array.isArray(b.results)) return "Add at least one test result.";
  const results: ResultInput[] = [];
  for (const r of (b.results as Record<string, unknown>[]).slice(0, 150)) {
    const name = str(r?.name, 80);
    const value = num(r?.value);
    if (!name || value === undefined) continue;
    if (value < 0 || value > 1e7) return `Check the value for ${name}.`;
    const reportLow = num(r.reportLow);
    const reportHigh = num(r.reportHigh);
    if (reportLow !== undefined && reportHigh !== undefined && reportLow >= reportHigh) return `Check the range you entered for ${name}: the first number should be the lower one.`;
    results.push({ name, value, unit: str(r.unit, 30) || undefined, reportLow, reportHigh });
  }
  if (!results.length) return "Add at least one test result.";
  return { person: { sex, age }, results, save: b.save === true };
}
