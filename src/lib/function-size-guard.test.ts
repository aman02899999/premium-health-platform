import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { BIG_FILE_BYTES, MEDIA_ONLY_BY_URL } from "./media-by-url";

const ROOT = path.resolve(__dirname, "../..");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

describe("Vercel Hobby function limit guard", () => {
  it("keeps every big public file in a folder that is excluded from server functions", () => {
    const offenders = walk(path.join(ROOT, "public"))
      .filter((f) => statSync(f).size >= BIG_FILE_BYTES)
      .map((f) => path.relative(ROOT, f).split(path.sep).join("/"))
      .filter((rel) => !MEDIA_ONLY_BY_URL.some((dir) => rel.startsWith(`${dir}/`)));
    // A big file outside these folders can be copied into many functions and fail the deploy.
    // Move it into one of MEDIA_ONLY_BY_URL (src/lib/media-by-url.ts) if it is only fetched by URL.
    expect(offenders).toEqual([]);
  });

  it("excludes those folders from every route's file tracing", () => {
    const excludes = nextConfig.outputFileTracingExcludes?.["/*"] ?? [];
    for (const dir of MEDIA_ONLY_BY_URL) expect(excludes).toContain(`./${dir}/**/*`);
  });

  it("never ships the big media folders inside the reel functions", () => {
    const includes = Object.values(nextConfig.outputFileTracingIncludes ?? {}).flat();
    for (const glob of includes) {
      for (const dir of MEDIA_ONLY_BY_URL) expect(glob.startsWith(`./${dir}/`)).toBe(false);
    }
  });
});
