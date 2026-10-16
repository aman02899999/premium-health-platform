import { describe, expect, it, vi } from "vitest";
import { CALENDAR_DAYS, dailyPost } from "@/lib/growth/daily-posts";
import { FADE, MEDICAL_LINE, reelScenes, reelSeconds, readTime } from "./reel-scenes";

vi.mock("server-only", () => ({}));

const biz = { name: "Royal Fitness Club", phone: "+91 88518 30081", siteUrl: "https://www.example.in", coach: "Coach Aman Sharma", membershipFrom: 2000, address: "Gejha Village, Sector 93, Noida" };
const day = (n: number) => new Date(Date.parse("2026-10-16") + n * 86_400_000).toISOString().slice(0, 10);

describe("reel scenes", () => {
  it("every day of the calendar makes a watchable Reel: a hook, real content and a call to action", () => {
    for (let n = 0; n < CALENDAR_DAYS; n++) {
      const post = dailyPost(day(n), biz);
      const scenes = reelScenes(post);
      expect(scenes[0]).toMatchObject({ kind: "hook", text: post.title });
      expect(scenes.at(-1)).toEqual({ kind: "cta", text: post.cta, seconds: 3.5 });
      expect(scenes.length).toBeGreaterThanOrEqual(3);
      expect(scenes.length).toBeLessThanOrEqual(7);
      const total = reelSeconds(scenes);
      expect(total).toBeGreaterThanOrEqual(10);
      expect(total).toBeLessThanOrEqual(35); // short Reels get watched to the end
      for (const s of scenes) {
        expect(s.seconds).toBeGreaterThan(FADE * 2);
        const text = "text" in s ? s.text : "items" in s ? s.items.join(" ") : s.title;
        expect(text.trim().length).toBeGreaterThan(2);
      }
    }
  });

  it("tips show each point on its own screen, numbered, and health tips carry the medical line", () => {
    for (let n = 0; n < CALENDAR_DAYS; n++) {
      const post = dailyPost(day(n), biz);
      if (post.category === "Shop" || post.category === "Offer") continue;
      const scenes = reelScenes(post);
      const points = scenes.filter((s) => s.kind === "point");
      expect(points.map((p) => p.text)).toEqual(post.points);
      expect(points.map((p) => p.n)).toEqual(post.points.map((_, i) => i + 1));
      const take = scenes.find((s) => s.kind === "takeaway");
      expect(take && take.kind === "takeaway" && take.note).toBe(post.medical ? MEDICAL_LINE : null);
    }
  });

  it("shop days show the product, what you get and the price", () => {
    const n = Array.from({ length: 14 }, (_, i) => i).find((i) => dailyPost(day(i), biz).category === "Shop")!;
    const post = dailyPost(day(n), biz);
    expect(reelScenes(post).map((s) => s.kind)).toEqual(["hook", "product", "bullets", "price", "cta"]);
    expect(reelScenes(post).find((s) => s.kind === "price")).toMatchObject({ text: post.takeaway });
  });

  it("reading time grows with the words and stays within bounds", () => {
    expect(readTime("Short")).toBe(2.6);
    expect(readTime(Array(60).fill("word").join(" "))).toBe(5.5);
    expect(readTime(Array(14).fill("word").join(" "))).toBe(5.4);
  });
});

describe("reel video", () => {
  it("chains the cross-fades at the right offsets and runs the progress bar for the whole Reel", async () => {
    const { filterGraph } = await import("./reel-video");
    const g = filterGraph([3, 4, 3.5], false);
    expect(g).toContain("[v0][v1]xfade=transition=fade:duration=0.4:offset=2.60[x1]");
    expect(g).toContain("[x1][v2]xfade=transition=slideleft:duration=0.4:offset=6.20[x2]");
    expect(g).toContain("w='iw*t/9.70'");
    expect(g).toContain("[3:a]anull[aout]");
    expect(filterGraph([3, 4], true)).toContain("[2:a]afade=t=in");
  });

  it("encodes real frames into a 1080×1920 H.264 Reel with an audio track", async () => {
    const { encodeReel, ffmpegPath } = await import("./reel-video");
    const bin = ffmpegPath();
    if (!bin) return; // ffmpeg-static not installed in this environment
    const sharp = (await import("sharp")).default;
    const frame = (r: number) => sharp({ create: { width: 1080, height: 1920, channels: 3, background: { r, g: 20, b: 40 } } }).png().toBuffer();
    const mp4 = await encodeReel([await frame(200), await frame(20)], [1.5, 1.5]);
    expect(mp4.subarray(4, 8).toString()).toBe("ftyp");
    const { execFileSync } = await import("node:child_process");
    const { writeFileSync } = await import("node:fs");
    const file = `${(await import("node:os")).tmpdir()}/reel-test.mp4`;
    writeFileSync(file, mp4);
    let info = "";
    try {
      execFileSync(bin, ["-i", file], { stdio: "pipe" });
    } catch (e) {
      info = String((e as { stderr: Buffer }).stderr);
    }
    expect(info).toMatch(/Video: h264 .*1080x1920/);
    expect(info).toMatch(/Audio: aac/);
    expect(info).toMatch(/Duration: 00:00:02\.[56]/);
  }, 60_000);
});
