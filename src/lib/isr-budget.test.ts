import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Vercel Hobby includes 200,000 ISR write units a month. With about 150 ISR pages, each hourly
// rebuild cost over 20,000 units a day once crawlers visited every page every hour (Nov 2026: 285K,
// over the limit). Admin saves already refresh pages at once with revalidatePath, so the timed
// rebuild is only a safety net: keep it at 6 hours or longer. 0 (always dynamic) is fine.
const MIN_SECONDS = 6 * 60 * 60;
const APP = path.resolve(__dirname, "../app");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name) ? [full] : [];
  });
}

describe("ISR write budget (Vercel Hobby)", () => {
  it("never rebuilds an ISR page or route more often than every 6 hours", () => {
    const tooOften: string[] = [];
    for (const file of walk(APP)) {
      const m = readFileSync(file, "utf8").match(/export const revalidate = ([^;]+);/);
      if (!m) continue;
      const seconds = Number(m[1].replace(/_/g, ""));
      if (seconds !== 0 && seconds < MIN_SECONDS) tooOften.push(`${path.relative(APP, file)}: ${m[1]}`);
    }
    expect(tooOften).toEqual([]);
  });
});
