import { describe, expect, it } from "vitest";
import { CALENDAR_DAYS, coachPostEmail, dailyPost, IDEA_COUNT, TIP_COUNT, upcomingPosts, type PostBiz } from "./daily-posts";

const biz: PostBiz = { name: "Royal Fitness Club", phone: "+91 88518 30081", siteUrl: "https://example.in", coach: "Coach Aman Sharma", membershipFrom: 2000, address: "Main Road, near Gali No. 3, Gejha Village, Sector 93, Noida 201304" };

describe("daily marketing posts", () => {
  it("gives the same post for the same day and a different one the next day", () => {
    expect(dailyPost("2026-10-11", biz)).toEqual(dailyPost("2026-10-11", biz));
    expect(dailyPost("2026-10-12", biz).theme).not.toBe(dailyPost("2026-10-11", biz).theme);
  });

  it("runs 3½ months without repeating: every tip once, an offer every 7th day", () => {
    expect(CALENDAR_DAYS).toBeGreaterThanOrEqual(90);
    const posts = upcomingPosts("2026-10-16", biz, CALENDAR_DAYS);
    expect(new Set(posts.map((p) => p.theme)).size).toBe(CALENDAR_DAYS);
    expect(posts.filter((p) => p.category === "Offer")).toHaveLength(IDEA_COUNT);
    expect(posts.filter((p) => p.category !== "Offer")).toHaveLength(TIP_COUNT);
    expect(posts.map((p, i) => (p.category === "Offer" ? i % 7 : -1)).filter((x) => x >= 0).every((x) => x === 6)).toBe(true);
    // Then the calendar starts again from the top.
    expect(upcomingPosts("2026-10-16", biz, CALENDAR_DAYS + 1)[CALENDAR_DAYS].theme).toBe(posts[0].theme);
  });

  it("signs every post as the coach with the gym address, and fits the image", () => {
    for (const p of upcomingPosts("2026-10-16", biz, CALENDAR_DAYS)) {
      for (const text of [p.whatsapp, p.instagram, p.facebook]) {
        expect(text).toContain("— Coach Aman Sharma, Royal Fitness Club");
        expect(text).toContain("📍 Main Road, near Gali No. 3, Gejha Village, Sector 93, Noida 201304");
      }
      if (p.category === "Offer") continue;
      expect(p.points).toHaveLength(3);
      expect(p.title.length).toBeLessThanOrEqual(75);
      for (const pt of p.points) expect(pt.length).toBeLessThanOrEqual(120);
      expect(p.takeaway.length).toBeLessThanOrEqual(75);
      if (p.category === "Health & diet" || p.category === "Women's health") expect(p.instagram).toContain("not medical advice");
    }
  });

  it("tags every link with the channel and day so sales can be traced", () => {
    for (const p of upcomingPosts("2026-10-16", biz, CALENDAR_DAYS)) {
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
    const all = upcomingPosts("2026-10-16", biz, CALENDAR_DAYS).map((p) => `${p.whatsapp} ${p.instagram} ${p.google}`).join(" ");
    expect(all).not.toMatch(/\bcure|guarantee|100%|only \d+ (left|seats)|today only|limited time|lose \d+ ?kg/i);
  });

  it("emails the coach one copy per day", () => {
    const d = coachPostEmail(dailyPost("2026-10-11", biz), "coach@example.com", "https://example.in/admin/growth?tab=marketing");
    expect(d).toMatchObject({ channel: "email", kind: "coach-daily-post", dedupeKey: "coach-daily-post:2026-10-11" });
    expect(d.body).toContain("WHATSAPP STATUS");
    expect(d.body.length).toBeLessThan(6000);
  });
});
