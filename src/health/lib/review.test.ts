import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { NOT_REVIEWED, isRealReviewer, reviewLine } from "./review";

describe("reviewLine", () => {
  it("never shows a placeholder or pending reviewer as if it were a person", () => {
    for (const r of ["Medical review pending — placeholder", "Review pending — placeholder", "Dr. Placeholder (medical review pending)", "Pending medical review", "Not medically reviewed (official source)", "डॉक्टर की समीक्षा बाकी", "", "  ", undefined, null]) {
      expect(isRealReviewer(r)).toBe(false);
      expect(reviewLine(r)).toBe(NOT_REVIEWED);
    }
  });

  it("names a real reviewer", () => {
    expect(reviewLine("Dr. Asha Verma, MBBS")).toBe("Medically reviewed by: Dr. Asha Verma, MBBS");
  });
});

// Words that were written for the team and leaked onto public health pages (Phase 0 baseline,
// docs/baseline/2026-10-24/geo-report.md issue 1). Admin screens and API routes are not public.
const LEAKS: [string, RegExp][] = [
  ["placeholder reviewer", /review pending — placeholder|Review: pending — placeholder|Dr\. Placeholder|placeholder review tag|pending placeholder/i],
  ["sandbox note", /Sandbox preview/i],
  ["template note", /Auto-selects relevant actions|Never hide emergency info behind paywall/i],
  ["earning note", /"Earning:|high-ticket India|free monetized|zero marginal cost|Affiliate 8% avg/i],
];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) return /admin|api$/.test(name) ? [] : files(p);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [p] : [];
  });
}

describe("public health pages", () => {
  const root = path.resolve(__dirname, "../..");
  const sources = [...files(path.join(root, "app/(health)")), ...files(path.join(root, "health/components")), ...files(path.join(root, "health/data"))];

  it.each(LEAKS)("show no %s", (_name, re) => {
    const hits = sources
      .map((f) => [f, readFileSync(f, "utf8")] as const)
      .filter(([, text]) => !text.includes("requireAdmin(") && re.test(text))
      .map(([f]) => path.relative(root, f));
    expect(hits).toEqual([]);
  });
});
