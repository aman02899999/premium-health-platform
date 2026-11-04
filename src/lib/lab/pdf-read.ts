// Reads the results table out of a lab report PDF's text. Pure, so it runs in the member's
// browser (the PDF never leaves their phone) and in tests. Each result line on Indian lab
// reports is the same four columns: test name, value, unit, the lab's reference range. We
// keep a line only when its name is a test in our library, so headers, addresses, notes and
// the patient's name are never picked up.
import { unitKey } from "./analyse";
import { buildIndex, findMarker, normaliseName, type MarkerIndex, type Named } from "./match";
import { parseRangeText } from "./range-text";

/** One piece of text on a PDF page, with its position (PDF units, y grows upwards). */
export type TextItem = { str: string; x: number; y: number; w: number; h: number };

export type ReadResult = { markerId: string; printed: string; value: string; unit: string; range: string };
/** A marker as the reader needs it: its names, and every unit it can be given in. */
export type ReadMarker = Named & { units: string[] };
export type ReadReport = { results: ReadResult[]; person: { sex?: "male" | "female"; age?: number }; skipped: string[] };

const NUMBER = /^[<>]?\d+(?:[.,]\d+)?$/;
// Urine and stool tests share names with blood tests ("Creatinine, Urine"); never read them as blood.
const NOT_BLOOD = /\b(?:urine|urinary|stool|csf|fluid|crystals?|24 ?h(?:ou)?rs?)\b/i;
// Flags some labs print right after the value: "12.62 H", "4.39 L", "51.0 *".
const FLAG = /^(?:h|l|high|low|\*+|↑|↓)$/i;

/**
 * Groups a page's text into lines of cells. Items on the same baseline (within a third of the
 * text height) make a line; items closer together than about one space join into a cell.
 */
export function toLines(pages: TextItem[][]): string[][] {
  const lines: string[][] = [];
  for (const items of pages) {
    const rows: TextItem[][] = [];
    for (const it of [...items].filter((i) => i.str.trim()).sort((a, b) => b.y - a.y || a.x - b.x)) {
      const row = rows.find((r) => Math.abs(r[0].y - it.y) <= Math.max(2, r[0].h / 3));
      if (row) row.push(it);
      else rows.push([it]);
    }
    for (const row of rows.sort((a, b) => b[0].y - a[0].y)) {
      row.sort((a, b) => a.x - b.x);
      const cells: string[] = [];
      let end = -Infinity;
      for (const it of row) {
        const gap = it.x - end;
        if (cells.length && gap < Math.max(1.5, it.h * 0.4)) cells[cells.length - 1] += (gap > 0.5 ? " " : "") + it.str.trim();
        else cells.push(it.str.trim());
        end = it.x + it.w;
      }
      lines.push(cells.filter(Boolean));
    }
  }
  return lines;
}

/** Splits a cell whose value got glued to the name ("Total Leucocyte Count (TLC) 12.62"). */
function unglue(cells: string[]): string[] {
  const m = cells[0]?.match(/^(.*?[a-z)\]])\s+([<>]?\d+(?:[.,]\d+)?)$/i);
  return m ? [m[1], m[2], ...cells.slice(1)] : cells;
}

function personFrom(lines: string[][]): ReadReport["person"] {
  const out: ReadReport["person"] = {};
  for (let i = 0; i < lines.length && (!out.age || !out.sex); i++) {
    const t = lines[i].join(" ");
    if (!out.age && /\bage\b/i.test(t)) {
      const a = t.match(/\bage\b[^0-9]{0,20}(\d{1,3})\s*(?:y\b|yrs?\b|years?\b)/i);
      if (a && +a[1] > 0 && +a[1] < 120) out.age = +a[1];
    }
    if (!out.sex && /\b(?:sex|gender)\b/i.test(t)) {
      const s = t.match(/(?:\/|:)\s*(male|female|m|f)\b/i);
      if (s) out.sex = s[1].toLowerCase().startsWith("f") ? "female" : "male";
    }
  }
  return out;
}

/**
 * The name as printed, or, when a long name wrapped onto the next line ("SGOT- Aspartate" /
 * "Aminotransferase"), its leading abbreviation alone. Only a capitalised abbreviation counts,
 * so "Albumin, Urine" or "AST:ALT Ratio" never turn into a different test.
 */
function lookup<T extends ReadMarker>(index: MarkerIndex<T>, name: string): { marker: T; loose: boolean } | null {
  const hit = findMarker(index, name);
  if (hit) return { marker: hit, loose: false };
  const first = name.trim().split(/\s+/)[0];
  const loose = /^[A-Z][A-Z0-9]{1,5}-?$/.test(first) && first !== name.trim() ? findMarker(index, normaliseName(first)) : null;
  return loose ? { marker: loose, loose: true } : null;
}

export function readReport(lines: string[][], markers: ReadMarker[]): ReadReport {
  const index = buildIndex(markers);
  const results: ReadResult[] = [];
  const seen = new Set<string>();
  const skipped: string[] = [];

  for (const raw of lines) {
    const cells = unglue(raw);
    // The value is the first cell after the name that is only a number.
    const at = cells.findIndex((c, i) => i > 0 && NUMBER.test(c.replace(/\s+/g, "")));
    if (at < 1) continue;
    const name = cells.slice(0, at).join(" ");
    if (NOT_BLOOD.test(name)) continue;
    const found = lookup(index, name) ?? (at > 1 ? lookup(index, cells[0]) : null);
    const marker = found?.marker ?? null;
    let rest = cells.slice(at + 1);
    if (rest[0] && FLAG.test(rest[0])) rest = rest.slice(1);

    // After the value: an optional unit, then the range. A cell that reads as a range is the range.
    let unit = "";
    let range = "";
    for (const c of rest) {
      if (!range && parseRangeText(c)) range = c;
      else if (!unit && !range && /[a-z%/^µμ]/i.test(c) && c.length <= 20) unit = c;
    }

    // A unit the test is never given in ("RBC 0-2 /hpf" in a urine section) means it's a different test.
    // A match on the abbreviation alone also needs the unit to agree.
    const fits = marker && (unit ? marker.units.some((u) => unitKey(u) === unitKey(unit)) : !found?.loose);
    if (marker && !fits) {
      // Lal PathLabs prints absolute counts under the same name ("Neutrophils … thou/mm3").
      const twin = unit ? findMarker(index, `Absolute ${name}`) : null;
      if (twin && !seen.has(twin.id) && twin.units.some((u) => unitKey(u) === unitKey(unit))) {
        seen.add(twin.id);
        results.push({ markerId: twin.id, printed: name, value: cells[at].replace(/\s+/g, "").replace(/^[<>]/, ""), unit, range });
      }
      continue;
    }
    if (!marker) {
      // Looks like a result line (name, number, unit or range) for a test we don't cover yet.
      if ((unit || range) && /^[a-z]/i.test(name) && !/\||:\s*$|^(?:less|more|greater|up ?to)\b/i.test(name) && name.length <= 60 && skipped.length < 40) skipped.push(name);
      continue;
    }
    if (seen.has(marker.id)) continue;
    seen.add(marker.id);
    results.push({ markerId: marker.id, printed: name, value: cells[at].replace(/\s+/g, "").replace(/^[<>]/, ""), unit, range });
  }
  return { results, person: personFrom(lines), skipped: [...new Set(skipped)] };
}
