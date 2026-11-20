import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { packById } from "@/lib/library/packs";
import { buyLink, dueLongVideo, LONG_VIDEOS, longVideoDescription, longVideoFile, longVideoTags, longVideoThumb, type LongVideo } from "./long-videos";

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
      // A literal backslash-n (instead of a line break) shows up as "\n" text on YouTube.
      expect(v.intro, v.id).not.toContain("\\n");
      const d = longVideoDescription(v);
      expect(d.length).toBeLessThan(5000);
      expect(d).not.toMatch(/[<>]/);
      expect(d).toContain("medical advice nahi");
      expect(d).toContain("88518 30081");
      expect(d).not.toContain("92668");
      expect(d).toMatch(/utm_source=youtube.*#trial/);
      expect(d).toContain("https://www.youtube.com/@RoyalFitnessTV?sub_confirmation=1");
      expect(`${v.title} ${d}`).not.toMatch(/\bcure|guarantee|\bmg\b|tablet|capsule/i);
      expect(v.sources.length).toBeGreaterThan(0);
      for (const [, url] of v.sources) expect(url).toMatch(/^https:\/\//);
      expect(longVideoTags(v).join(",").length).toBeLessThan(500);
    }
  });

  it("chapters start at 0:00, run in order, are at least 10 s apart and number at least three", () => {
    for (const v of LONG_VIDEOS.filter((x) => !x.short)) {
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

describe("long video files and Vercel", () => {
  it("are kept out of Vercel deployments (the GitHub runner reads them from the checkout)", () => {
    const ignore = readFileSync(join(process.cwd(), ".vercelignore"), "utf8").split("\n").map((l) => l.trim());
    expect(ignore).toContain("/public/youtube");
  });
});

describe("promo long videos", () => {
  const fake: LongVideo = { id: "promo-lib-test", date: "2026-11-22", title: "t", intro: "i", chapters: [["0:00", "a"]], sources: [["s", "https://x.in"]], tags: ["pdf books"], buy: ["5 books ₹423", "/library/pack/indian-food"] };

  it("puts the tracked buy link first and uses promo tags", () => {
    const d = longVideoDescription(fake);
    expect(d.split("\n")[0]).toBe(`👉 5 books ₹423: ${buyLink(fake)}`);
    expect(buyLink(fake)).toMatch(/\/library\/pack\/indian-food\?utm_source=youtube&utm_medium=video&utm_campaign=promo-library&utm_content=promo-lib-test$/);
    expect(longVideoTags(fake)).not.toContain("fitness myths");
    expect(buyLink({ ...fake, id: "promo-diet-x", buy: ["Trial", "/diet-trial"] })).toContain("utm_campaign=promo-diet-trial");
  });

  it("a Short keeps the buy link and its own tracking, without chapters", () => {
    const short = { ...fake, id: "short-promo-lib-test", short: true };
    const d = longVideoDescription(short);
    expect(d).toContain("utm_campaign=promo-library&utm_content=short-promo-lib-test");
    expect(d).not.toContain("Chapters");
    expect(longVideoDescription(fake)).toContain("Chapters");
  });

  it("every promo video links to a real pack or the diet trial", () => {
    for (const v of LONG_VIDEOS.filter((x) => x.buy)) {
      const path = v.buy![1];
      const pack = path.match(/^\/library\/pack\/([a-z0-9-]+)$/);
      expect(pack ? Boolean(packById(pack[1])) : path === "/diet-trial", v.id).toBe(true);
    }
  });
});
