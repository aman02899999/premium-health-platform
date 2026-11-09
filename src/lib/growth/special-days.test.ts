import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FESTIVE_2026 } from "@/lib/offers";
import { SPECIAL_POSTS, SPECIAL_REELS, specialFeedPost, specialReel, specialStory } from "./special-days";

describe("special-day posts", () => {
  it("Diwali replaces only the morning card and the Story on 8 Nov 2026", () => {
    expect(specialFeedPost("2026-11-08", "am")?.id).toBe("diwali-2026");
    expect(specialFeedPost("2026-11-08", "pm")).toBeNull();
    expect(specialFeedPost("2026-11-07", "am")).toBeNull();
    expect(specialFeedPost("2026-11-09", "am")).toBeNull();
    expect(specialStory("2026-11-08")?.id).toBe("diwali-2026");
    expect(specialStory("2026-11-09")).toBeNull();
  });

  it("every image and video exists in public/", () => {
    for (const p of SPECIAL_POSTS) {
      for (const f of [p.feedImage, p.storyImage].filter(Boolean) as string[]) expect(existsSync(join(process.cwd(), "public", f)), f).toBe(true);
      expect(p.feedImage || p.storyImage, p.id).toBeTruthy();
      if (p.feedImage) expect(p.slot, p.id).toBeTruthy();
    }
    for (const r of SPECIAL_REELS) expect(existsSync(join(process.cwd(), "public", r.video)), r.video).toBe(true);
  });

  it("myth Stories replace the sales Story on their days only; a Story-only post never takes a feed slot", () => {
    expect(specialStory("2026-11-10")?.id).toBe("myth-story-1");
    expect(specialStory("2026-11-16")?.id).toBe("myth-story-4");
    expect(specialStory("2026-11-12")).toBeNull();
    expect(specialFeedPost("2026-11-10", "am")).toBeNull();
    expect(specialFeedPost("2026-11-10", "pm")).toBeNull();
  });

  it("tips Reels take the midday Reel on their days only, at most one a day", () => {
    expect(specialReel("2026-11-10")?.id).toBe("reel-fat-loss-myths");
    expect(specialReel("2026-11-17")?.id).toBe("reel-muscle-basics");
    expect(specialReel("2026-11-11")).toBeNull();
    const dates = SPECIAL_REELS.map((r) => r.date);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it("tips Reels follow the health rules: sources, an education note, no cure or guarantee words", () => {
    for (const r of SPECIAL_REELS) {
      for (const c of [r.instagram, r.facebook]) {
        expect(c, r.id).toMatch(/Sources?:/);
        expect(c, r.id).toContain("medical advice nahi");
        expect(c, r.id).not.toMatch(/guarantee|cure|100%|detox/i);
      }
    }
  });

  it("captions follow the house rules: the right number, no links on Instagram, no fake urgency", () => {
    for (const p of [...SPECIAL_POSTS.filter((x) => x.feedImage), ...SPECIAL_REELS]) {
      for (const c of [p.instagram, p.facebook]) {
        expect(c).toContain("88518 30081");
        expect(c).not.toContain("92668");
        expect(c).not.toMatch(/limited (seats|slots)|only \d+ (left|spots)|hurry|last chance/i);
        expect(c.length).toBeLessThanOrEqual(2200); // Instagram's caption limit
      }
      expect(p.instagram).not.toMatch(/https?:\/\//);
      expect(p.facebook).toMatch(/https:\/\/www\.royalfitnesclub\.in\/.*utm_campaign=/);
    }
  });

  it("Diwali prices match the festive offer", () => {
    const d = SPECIAL_POSTS.find((p) => p.id === "diwali-2026")!;
    const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
    for (const [id, o] of Object.entries(FESTIVE_2026.plans)) {
      expect(d.instagram, id).toContain(inr(o.price));
    }
    expect(d.instagram).toContain("Monthly ₹1,500 + 5 bonus days");
    expect(d.instagram).toContain("Annual ₹14,000 = 14 months");
    expect(d.instagram).toContain("Female's Special ₹7,000");
    expect(d.date >= FESTIVE_2026.startsOn && d.date <= FESTIVE_2026.endsOn).toBe(true);
  });
});
