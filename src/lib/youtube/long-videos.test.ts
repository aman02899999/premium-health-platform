import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { dueLongVideo, LONG_VIDEOS, longVideoDescription, longVideoFile, longVideoTags, longVideoThumb } from "./long-videos";

const pub = (p: string) => join(process.cwd(), "public", p);
const secs = (t: string) => t.split(":").reduce((a, n) => a * 60 + Number(n), 0);

describe("long videos", () => {
  it("each has its MP4 and thumbnail in public/, a unique id and a date in order", () => {
    expect(new Set(LONG_VIDEOS.map((v) => v.id)).size).toBe(LONG_VIDEOS.length);
    for (const v of LONG_VIDEOS) {
      expect(existsSync(pub(longVideoFile(v))), v.id).toBe(true);
      expect(statSync(pub(longVideoFile(v))).size).toBeGreaterThan(1_000_000);
      expect(existsSync(pub(longVideoThumb(v))), v.id).toBe(true);
      expect(statSync(pub(longVideoThumb(v))).size).toBeLessThan(2_000_000);
    }
    const dates = LONG_VIDEOS.map((v) => v.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it("titles, descriptions and tags fit YouTube's limits and the health rules", () => {
    for (const v of LONG_VIDEOS) {
      expect(v.title.length).toBeLessThanOrEqual(100);
      expect(v.title).not.toMatch(/[<>]/);
      const d = longVideoDescription(v);
      expect(d.length).toBeLessThan(5000);
      expect(d).not.toMatch(/[<>]/);
      expect(d).toContain("medical advice nahi");
      expect(d).toContain("88518 30081");
      expect(d).not.toContain("92668");
      expect(d).toMatch(/utm_source=youtube.*#trial/);
      expect(`${v.title} ${d}`).not.toMatch(/\bcure|guarantee|\bmg\b|tablet|capsule/i);
      expect(v.sources.length).toBeGreaterThan(0);
      for (const [, url] of v.sources) expect(url).toMatch(/^https:\/\//);
      expect(longVideoTags(v).join(",").length).toBeLessThan(500);
    }
  });

  it("chapters start at 0:00, run in order, are at least 10 s apart and number at least three", () => {
    for (const v of LONG_VIDEOS) {
      expect(v.chapters[0][0]).toBe("0:00");
      expect(v.chapters.length).toBeGreaterThanOrEqual(3);
      for (let i = 1; i < v.chapters.length; i++) expect(secs(v.chapters[i][0]) - secs(v.chapters[i - 1][0])).toBeGreaterThanOrEqual(10);
    }
  });

  it("picks the oldest due video nobody has uploaded", () => {
    expect(dueLongVideo("2026-11-08", [])).toBeNull();
    expect(dueLongVideo("2026-11-20", [])?.id).toBe(LONG_VIDEOS[0].id);
    expect(dueLongVideo("2026-11-20", [LONG_VIDEOS[0].id])?.id).toBe(LONG_VIDEOS[1].id);
    expect(dueLongVideo("2026-11-20", LONG_VIDEOS.map((v) => v.id))).toBeNull();
  });
});
