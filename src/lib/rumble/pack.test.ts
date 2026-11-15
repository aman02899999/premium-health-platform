import { describe, expect, it } from "vitest";
import { istDate, isoWeek, noteEntry, packFileName, releaseTag } from "./pack";

describe("rumble pack", () => {
  it("uses the IST date, not UTC", () => {
    expect(istDate(new Date("2026-11-15T18:40:00Z"))).toBe("2026-11-16"); // 00:10 IST
    expect(istDate(new Date("2026-11-15T18:20:00Z"))).toBe("2026-11-15");
  });

  it("numbers ISO weeks from Monday, including year edges", () => {
    expect(isoWeek("2026-11-16")).toBe("2026-W47"); // Monday
    expect(isoWeek("2026-11-22")).toBe("2026-W47"); // Sunday, same week
    expect(isoWeek("2026-11-23")).toBe("2026-W48");
    expect(isoWeek("2026-12-31")).toBe("2026-W53");
    expect(isoWeek("2027-01-03")).toBe("2026-W53");
    expect(isoWeek("2027-01-04")).toBe("2027-W01");
  });

  it("makes one release tag per IST week", () => {
    expect(releaseTag(new Date("2026-11-16T02:00:00Z"))).toBe("rumble-2026-W47");
  });

  it("builds safe, date-sorted file names", () => {
    expect(packFileName(new Date("2026-11-16T02:00:00Z"), "short slot1", "Viral: Nimbu Pani!")).toBe("2026-11-16-short-slot1-viral-nimbu-pani.mp4");
    expect(packFileName(new Date("2026-11-16T02:00:00Z"), "long", "***")).toBe("2026-11-16-long-video.mp4");
  });

  it("puts title and description in copyable blocks that survive backticks", () => {
    const entry = noteEntry("a.mp4", { title: "Nimbu pani", description: "Line 1\n```code```\nLine 3", tags: ["fitness", "hinglish"] }, "https://youtube.com/shorts/x");
    expect(entry).toContain("### a.mp4");
    expect(entry).toContain("On YouTube: https://youtube.com/shorts/x");
    expect(entry).toContain("````\nLine 1\n```code```\nLine 3\n````");
    expect(entry).toContain("```\nNimbu pani\n```");
    expect(entry).toContain("Tags: fitness, hinglish");
  });
});
