// Blood report analyser: the shapes shared by the marker library, the engine, the store and the
// admin editor. Education only: nothing here diagnoses or prescribes.

export type Sex = "male" | "female";

export type PanelId =
  | "cbc"
  | "diabetes"
  | "lipid"
  | "liver"
  | "kidney"
  | "electrolytes"
  | "thyroid"
  | "iron"
  | "vitamins"
  | "inflammation";

export type Source = { title: string; publisher: string; url: string; /** ISO date the page was read. */ checked: string };

/** A reference interval, optionally limited to one sex or an age band (years, inclusive). */
export type RefRange = { low?: number; high?: number; sex?: Sex; ageMin?: number; ageMax?: number };

/**
 * Guideline categories (HbA1c, fasting sugar, LDL, vitamin D...). Unlike a lab's reference
 * interval these don't change from lab to lab, so they decide the status when present.
 * `min` is inclusive, `max` exclusive.
 */
export type Band = { label: string; status: Status; min?: number; max?: number; sex?: Sex; ageMin?: number };

/** value in `unit` × factor = value in the marker's own unit. */
export type AltUnit = { unit: string; factor: number };

export type Advice = {
  /** What this direction usually means, in plain words. */
  meaning: string;
  /** Food, sleep, activity steps that are safe for most people. */
  lifestyle: string[];
  /** Traditional Indian home-care that may support the above. Never a cure, never a dose. */
  ayurveda?: string[];
  /** When and why to see a doctor. */
  doctor: string;
};

export type Marker = {
  id: string;
  name: string;
  panel: PanelId;
  /** Every other name labs print for it (SGPT, ALT, Alanine aminotransferase...). */
  aliases: string[];
  unit: string;
  altUnits?: AltUnit[];
  ranges: RefRange[];
  bands?: Band[];
  /** Values at or beyond these get the "contact a doctor today" banner. */
  critical?: { low?: number; high?: number };
  about: string;
  low?: Advice;
  high?: Advice;
  /** The lab-test guide on /health, when one exists. */
  guide?: string;
  sources: Source[];
  hidden?: boolean;
};

export type Status = "critical-low" | "low" | "normal" | "high" | "critical-high" | "unknown";

/** One line the member typed (or, later, one row read from a PDF). */
export type ResultInput = {
  name: string;
  value: number;
  unit?: string;
  /** The range printed on the member's own report: preferred over any cited range. */
  reportLow?: number;
  reportHigh?: number;
};

export type Person = { sex?: Sex; age?: number };

export type AnalysedResult = {
  input: ResultInput;
  marker: Pick<Marker, "id" | "name" | "panel" | "unit" | "about" | "guide" | "sources"> | null;
  /** The value in the marker's own unit (null when the unit couldn't be converted). */
  value: number | null;
  status: Status;
  bandLabel?: string;
  range: { low?: number; high?: number; from: "report" | "guideline" | "cited" | "none" };
  advice?: Advice;
  note?: string;
};

export type Analysis = {
  results: AnalysedResult[];
  counts: Record<Status, number>;
  urgent: boolean;
};
