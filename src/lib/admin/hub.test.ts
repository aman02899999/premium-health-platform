import { describe, expect, it } from "vitest";
import { HUB_SECTIONS, analyticsRange, attention, badgeText, change, fillDays, filterSections, totals, type Counters } from "./hub";

const zero: Counters = {
  chatsWaiting: 0, leadsToday: 0, leadsUncontacted: 0, trialsToday: 0, activeMembers: 0, expiring7: 0, plansToReview: 0,
  pending: 0, failed7: 0, revenueToday: 0, revenue30: 0, campaign7: { sent: 0, delivered: 0, read: 0, clicked: 0 }, shopToShip: 0, reviewsPending: 0, callList: 0,
};

describe("command center tiles", () => {
  it("has unique ids and only internal links", () => {
    const tiles = HUB_SECTIONS.flatMap((s) => s.tiles);
    expect(new Set(tiles.map((t) => t.id)).size).toBe(tiles.length);
    for (const t of tiles) expect(t.href.startsWith("/")).toBe(true);
  });

  it("every admin area is reachable from the hub", () => {
    const hrefs = HUB_SECTIONS.flatMap((s) => s.tiles.map((t) => t.href.split(/[?#]/)[0]));
    for (const p of ["/admin/chats", "/admin/audience", "/admin/contacts", "/admin/qr", "/admin/ads", "/admin/growth", "/admin/reviews", "/admin/shop", "/admin/diet-pro", "/admin/website", "/admin/analytics"]) expect(hrefs).toContain(p);
  });

  it("search matches title, hint, keywords; every word must match", () => {
    expect(filterSections("broadcast").flatMap((s) => s.tiles.map((t) => t.id))).toEqual(expect.arrayContaining(["broadcast", "campaigns"]));
    expect(filterSections("RENEW").flatMap((s) => s.tiles.map((t) => t.id))).toContain("members");
    expect(filterSections("meta approval").flatMap((s) => s.tiles.map((t) => t.id))).toEqual(["templates"]);
    expect(filterSections("zzz")).toEqual([]);
    expect(filterSections("  ")).toBe(HUB_SECTIONS);
  });

  it("badges show non-zero numbers only, money as rupees", () => {
    const chats = HUB_SECTIONS[0].tiles.find((t) => t.id === "chats")!;
    const analytics = HUB_SECTIONS.flatMap((s) => s.tiles).find((t) => t.id === "analytics")!;
    expect(badgeText(chats, zero)).toBeNull();
    expect(badgeText(chats, { ...zero, chatsWaiting: 3 })).toBe("3");
    expect(badgeText(analytics, { ...zero, revenue30: 125000 })).toBe("₹1,25,000");
    expect(badgeText(chats, null)).toBeNull();
  });

  it("attention lists what needs a person, urgent first, with grammar", () => {
    expect(attention(zero)).toEqual([]);
    const a = attention({ ...zero, chatsWaiting: 1, expiring7: 4, leadsUncontacted: 2 });
    expect(a.map((x) => x.text)).toEqual(["1 WhatsApp chat is waiting for a reply", "2 leads haven't been called yet", "4 memberships end in the next 7 days"]);
    expect(a[0].tone).toBe("red");
  });
});

describe("analytics maths", () => {
  it("fills every day of the range, zeros for gaps", () => {
    const rows = fillDays([{ day: "2026-10-02", leads: 3, revenue: 999 }], "2026-10-01", "2026-10-03");
    expect(rows.map((r) => r.day)).toEqual(["2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(rows[1]).toMatchObject({ leads: 3, revenue: 999, sent: 0 });
    expect(totals(rows)).toMatchObject({ leads: 3, revenue: 999 });
  });

  it("crosses month ends", () => {
    expect(fillDays([], "2026-10-30", "2026-11-02")).toHaveLength(4);
  });

  it("range is 7, 30 or 90; anything else is 30", () => {
    expect(analyticsRange("7")).toBe(7);
    expect(analyticsRange("90")).toBe(90);
    expect(analyticsRange("365")).toBe(30);
    expect(analyticsRange(undefined)).toBe(30);
  });

  it("change is a whole percent, null without a base", () => {
    expect(change(150, 100)).toBe(50);
    expect(change(50, 100)).toBe(-50);
    expect(change(5, 0)).toBeNull();
  });
});
