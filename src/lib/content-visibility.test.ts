import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// `cv-auto` lets the browser skip off-screen sections on long pages (home, /health, /library).
// Without a placeholder size those sections would collapse to zero height and make the
// scrollbar jump, so both stylesheets must keep contain-intrinsic-size with `auto`.
const css = (f: string) => readFileSync(path.join(process.cwd(), f), "utf8");

describe("cv-auto utility", () => {
  for (const f of ["src/app/(gym)/globals.css", "src/app/(health)/health/globals.css"]) {
    it(`is defined with a remembered placeholder size in ${f}`, () => {
      const rule = css(f).match(/\.cv-auto\s*\{([^}]*)\}/)?.[1] ?? "";
      expect(rule).toMatch(/content-visibility:\s*auto/);
      expect(rule).toMatch(/contain-intrinsic-size:\s*auto\s+\d+px/);
    });
  }
});

// On a phone everything after the /health hero is at least two screens down. The live pulse,
// categories and latest-articles blocks hold ~700 elements, so they must be skipped too.
describe("/health hub sections below the hero", () => {
  it("all use cv-auto", () => {
    const src = css("src/app/(health)/health/page.tsx");
    const body = src.slice(src.indexOf('<div className="mx-auto max-w-7xl space-y-16'));
    const sections = body.match(/<section[^>]*>/g) ?? [];
    expect(sections.length).toBeGreaterThan(5);
    for (const s of sections) expect(s).toContain("cv-auto");
  });
});
