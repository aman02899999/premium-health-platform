import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// recharts is ~300 KB of JS and took ~0.5 s of main-thread time on a throttled phone when it
// loaded with every disease page. It must only arrive through the lazy loader, when a chart
// scrolls near the screen.
const dir = path.join(process.cwd(), "src/health/components");
const read = (f: string) => readFileSync(path.join(dir, f), "utf8");
const staticRecharts = /^\s*import[^;]*from\s+["']recharts["']/m;

describe("health charts load recharts lazily", () => {
  it("charts.tsx (imported by pages) has no static recharts import", () => {
    expect(read("charts.tsx")).not.toMatch(staticRecharts);
  });

  it("the lazy loader only pulls recharts in with a dynamic import", () => {
    const src = read("LazyChart.tsx");
    expect(src).not.toMatch(staticRecharts);
    expect(src).toMatch(/dynamic\(\s*\(\)\s*=>\s*import\(["']\.\/charts-recharts["']\)/);
  });
});
