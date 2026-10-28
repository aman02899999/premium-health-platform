// Reads a range the way labs print it: "13 - 17", "13.0-17.0", "<200", "< 5.7", ">40", "Upto 40",
// "0.66 to 1.25". Used for what members type, and later for ranges read from PDFs.

export type ParsedRange = { low?: number; high?: number };

const NUM = String.raw`(\d+(?:[.,]\d+)?)`;
const n = (s: string) => Number(s.replace(",", "."));

export function parseRangeText(raw: string): ParsedRange | null {
  const t = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!t) return null;
  let m = t.match(new RegExp(`^${NUM}\\s*(?:-|–|—|to)\\s*${NUM}$`));
  if (m) {
    const [low, high] = [n(m[1]), n(m[2])];
    return low < high ? { low, high } : null;
  }
  m = t.match(new RegExp(`^(?:<|<=|≤|less than|below|up ?to|upto)\\s*${NUM}$`));
  if (m) return { high: n(m[1]) };
  m = t.match(new RegExp(`^(?:>|>=|≥|more than|above|greater than)\\s*${NUM}$`));
  if (m) return { low: n(m[1]) };
  return null;
}
