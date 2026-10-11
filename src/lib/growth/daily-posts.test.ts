import { describe, expect, it } from "vitest";
import { coachPostEmail, dailyPost, IDEA_COUNT, upcomingPosts, type PostBiz } from "./daily-posts";

const biz: PostBiz = { name: "Royal Fitness Club", phone: "+91 88518 30081", siteUrl: "https://example.in", coach: "Coach Aman Sharma", membershipFrom: 2000 };

describe("daily marketing posts", () => {
  it("gives the same post for the same day and a different one the next day", () => {
    expect(dailyPost("2026-10-11", biz)).toEqual(dailyPost("2026-10-11", biz));
    expect(dailyPost("2026-10-12", biz).theme).not.toBe(dailyPost("2026-10-11", biz).theme);
  });

  it("never repeats a theme within the rotation", () => {
    const themes = upcomingPosts("2026-10-11", biz, IDEA_COUNT).map((p) => p.theme);
    expect(new Set(themes).size).toBe(IDEA_COUNT);
    expect(upcomingPosts("2026-10-11", biz, IDEA_COUNT + 1)[IDEA_COUNT].theme).toBe(themes[0]);
  });

  it("tags every link with the channel and day so sales can be traced", () => {
    for (const p of upcomingPosts("2026-10-11", biz, IDEA_COUNT)) {
      const wa = new URL(p.links.whatsapp);
      expect(wa.origin).toBe("https://example.in");
      expect(wa.searchParams.get("utm_source")).toBe("whatsapp");
      expect(wa.searchParams.get("utm_campaign")).toBe(`daily-${p.date}`);
      expect(p.whatsapp).toContain(p.links.whatsapp);
      expect(p.google).toContain(p.links.google);
      // Instagram captions can't link; they point to the bio.
      expect(p.instagram).toContain("link in bio");
      expect(p.instagram).toContain("#RoyalFitnessClub");
    }
  });

  it("makes no cure, guarantee or fake-urgency claims", () => {
    const all = upcomingPosts("2026-10-11", biz, IDEA_COUNT).map((p) => `${p.whatsapp} ${p.instagram} ${p.google}`).join(" ");
    expect(all).not.toMatch(/\bcure|guarantee|100%|only \d+ (left|seats)|today only|limited time|lose \d+ ?kg/i);
  });

  it("emails the coach one copy per day", () => {
    const d = coachPostEmail(dailyPost("2026-10-11", biz), "coach@example.com", "https://example.in/admin/growth?tab=marketing");
    expect(d).toMatchObject({ channel: "email", kind: "coach-daily-post", dedupeKey: "coach-daily-post:2026-10-11" });
    expect(d.body).toContain("WHATSAPP STATUS");
    expect(d.body.length).toBeLessThan(6000);
  });
});
