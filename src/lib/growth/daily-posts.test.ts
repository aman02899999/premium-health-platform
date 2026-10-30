import { describe, expect, it } from "vitest";
import { CALENDAR_DAYS, coachPostEmail, dailyPost, IDEA_COUNT, TIP_COUNT, upcomingPosts, type PostBiz } from "./daily-posts";

const biz: PostBiz = { name: "Royal Fitness Club", phone: "+91 88518 30081", siteUrl: "https://example.in", coach: "Coach Aman Sharma", membershipFrom: 2000, address: "Main Road, near Gali No. 3, Gejha Village, Sector 93, Noida 201304" };

describe("daily marketing posts", () => {
  it("supplement tips link to the store only while it's switched on", () => {
    const supp = (b: PostBiz) => upcomingPosts("2026-10-16", b, CALENDAR_DAYS).filter((p) => p.category === "Supplements");
    expect(supp(biz).length).toBeGreaterThan(0);
    for (const p of supp(biz)) {
      expect(p.path).toBe("/contact");
      expect(Object.values(p.links).join(" ")).not.toContain("/shop");
    }
    for (const p of supp({ ...biz, shopOpen: true })) expect(p.path).toBe("/shop");
  });

  it("gives the same post for the same day and a different one the next day", () => {
    expect(dailyPost("2026-10-11", biz)).toEqual(dailyPost("2026-10-11", biz));
    expect(dailyPost("2026-10-12", biz).theme).not.toBe(dailyPost("2026-10-11", biz).theme);
  });

  it("runs ~4 months of tips: 5 tips, 1 shop post and 1 gym offer every week", () => {
    expect(CALENDAR_DAYS).toBeGreaterThanOrEqual(120);
    const posts = upcomingPosts("2026-10-16", biz, CALENDAR_DAYS);
    posts.forEach((p, i) => expect(p.category === "Shop" ? 2 : p.category === "Offer" ? 6 : -1).toBe(i % 7 === 2 ? 2 : i % 7 === 6 ? 6 : -1));
    const tips = posts.filter((p) => p.category !== "Offer" && p.category !== "Shop");
    expect(new Set(tips.slice(0, TIP_COUNT).map((p) => p.theme)).size).toBe(TIP_COUNT);
    const shop = posts.filter((p) => p.category === "Shop");
    expect(new Set(shop.map((p) => p.theme)).size).toBe(shop.length);
    expect(new Set(posts.filter((p) => p.category === "Offer").slice(0, IDEA_COUNT).map((p) => p.theme)).size).toBe(IDEA_COUNT);
    // The first post (16 Oct 2026) is a tip; the cycle starts again after CALENDAR_DAYS.
    expect(posts[0].category).not.toBe("Shop");
    expect(upcomingPosts("2026-10-16", biz, CALENDAR_DAYS + 1)[CALENDAR_DAYS].theme).toBe(posts[0].theme);
  });

  it("shop posts show the product, its price and a link to buy it", () => {
    for (const p of upcomingPosts("2026-10-16", biz, CALENDAR_DAYS).filter((x) => x.category === "Shop")) {
      expect(p.points).toHaveLength(3);
      expect(p.takeaway).toMatch(/^₹[\d,]+/);
      expect(p.instagram).toContain(p.takeaway);
      expect(p.path).toMatch(/^\/(diet-chart\?plan=|library)/);
      expect(new URL(p.links.facebook).searchParams.get("utm_source")).toBe("facebook");
    }
  });

  it("signs every post as the coach with the gym address, and fits the image", () => {
    for (const p of upcomingPosts("2026-10-16", biz, CALENDAR_DAYS)) {
      for (const text of [p.whatsapp, p.instagram, p.facebook]) {
        expect(text).toContain("— Coach Aman Sharma, Royal Fitness Club");
        expect(text).toContain("📍 Main Road, near Gali No. 3, Gejha Village, Sector 93, Noida 201304");
      }
      if (p.category === "Offer" || p.category === "Shop") continue;
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
