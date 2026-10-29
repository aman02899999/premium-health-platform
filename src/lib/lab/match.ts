// Finds the marker a lab's printed name refers to. Labs print the same test many ways
// ("SGPT", "ALT (SGPT)", "S. Alanine Aminotransferase"), so names are normalised and looked up
// in an index built from every marker's name and aliases.
import type { Marker } from "./types";

// Words that labs add in front of a name and that never change which test it is.
const NOISE = new Set(["serum", "s", "plasma", "blood", "level", "levels", "test", "value"]);

/** "S. Alanine Aminotransferase (SGPT)" → "alanine aminotransferase sgpt" */
export function normaliseName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[µμ]/g, "u")
    .replace(/[^a-z0-9%+]+/g, " ")
    .split(" ")
    .filter((w) => w && !NOISE.has(w))
    .join(" ");
}

/**
 * The name, then the bracketed part alone, then the name without its brackets. The bracket
 * comes before the stripped name so "Haemoglobin (Hb A1c)" finds HbA1c, not haemoglobin.
 */
function variants(raw: string): string[] {
  // A bracket a PDF line cut off ("ESR (Modified") is dropped, so the name before it still matches.
  const out = [raw, ...(/\([^)]*$/.test(raw) ? [raw.replace(/\([^)]*$/, " ")] : [])];
  const inner = [...raw.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]);
  if (inner.length) {
    out.push(...inner);
    out.push(raw.replace(/\([^)]*\)/g, " "));
  }
  return out.map(normaliseName).filter(Boolean);
}

/** What the index needs from a marker: the browser builds one from the names alone. */
export type Named = Pick<Marker, "id" | "name" | "aliases" | "hidden">;
export type MarkerIndex<T extends Named = Marker> = Map<string, T>;

export function buildIndex<T extends Named>(markers: T[]): MarkerIndex<T> {
  const index: MarkerIndex<T> = new Map();
  for (const m of markers) {
    if (m.hidden) continue;
    for (const name of [m.name, m.id, ...m.aliases]) {
      for (const key of variants(name)) if (!index.has(key)) index.set(key, m);
    }
  }
  return index;
}

export function findMarker<T extends Named>(index: MarkerIndex<T>, printed: string): T | null {
  for (const key of variants(printed)) {
    const hit = index.get(key);
    if (hit) return hit;
  }
  return null;
}

/** Aliases that point at two different markers: the admin editor refuses to save these. */
export function aliasClashes(markers: Marker[]): { alias: string; ids: string[] }[] {
  const seen = new Map<string, Set<string>>();
  for (const m of markers) {
    if (m.hidden) continue;
    for (const name of [m.name, ...m.aliases]) {
      const key = normaliseName(name);
      if (!key) continue;
      const ids = seen.get(key) ?? new Set<string>();
      ids.add(m.id);
      seen.set(key, ids);
    }
  }
  return [...seen].filter(([, ids]) => ids.size > 1).map(([alias, ids]) => ({ alias, ids: [...ids] }));
}
