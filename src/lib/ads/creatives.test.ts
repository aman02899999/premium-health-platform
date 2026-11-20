import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { FESTIVE_2026 } from "@/lib/offers";
import type { SiteContent } from "@/lib/content/types";
import { adCreatives, parseCreativeFile } from "./creatives";

const content = { ...DEFAULT_CONTENT, offers: [FESTIVE_2026] } as SiteContent;
const ids = (today: string, c: SiteContent = content) => adCreatives(c, today).map((x) => x.id);
const all = (today: string) => JSON.stringify(adCreatives(content, today));

describe("adCreatives", () => {
  it("uses the live festive prices the join page charges", () => {
    const prices = adCreatives(content, "2026-11-20").find((c) => c.id === "offer-prices")!;
    expect(prices.rows.map((r) => [r.label, r.price, r.was])).toEqual([
      ["Monthly", "₹1,500", "₹2,000"],
      ["Quarterly", "₹4,000", "₹5,000"],
      ["Half-Yearly", "₹7,000", "₹8,000"],
      ["Annual", "₹14,000", undefined],
    ]);
    expect(prices.headline).toBe("Join from ₹1,500");
    expect(prices.validUntil).toBe("2026-12-31");
    expect(prices.primaryText).toContain("31 Dec 2026");
    expect(prices.primaryText).toContain("Couple prices standard");
  });

  it("has the Female's Special and Annual creatives during the offer", () => {
    const list = adCreatives(content, "2026-11-20");
    expect(list.find((c) => c.id === "female-special")!.headline).toBe("Female's Special ₹7,000");
    expect(list.find((c) => c.id === "annual-value")!.sub).toContain("14 months");
    expect(list.find((c) => c.id === "annual-value")!.rows.map((r) => r.label)).not.toContainEqual(expect.stringMatching(/^Everything in/));
  });

  it("shows a deadline only in the offer's last two weeks, with a true count", () => {
    expect(ids("2026-12-16")).not.toContain("offer-ends");
    expect(adCreatives(content, "2026-12-17").find((c) => c.id === "offer-ends")!.kicker).toBe("15 days left");
    expect(adCreatives(content, "2026-12-30").find((c) => c.id === "offer-ends")!.kicker).toBe("Ends tomorrow");
    expect(adCreatives(content, "2026-12-31").find((c) => c.id === "offer-ends")!.kicker).toBe("Last day today");
  });

  it("drops every offer creative the day after the offer ends", () => {
    expect(ids("2027-01-01")).toEqual(["free-trial", "diet-trial"]);
    expect(all("2027-01-01")).not.toMatch(/festive|1,500|31 Dec/i);
    expect(ids("2026-11-20", { ...content, offers: [] })).toEqual(["free-trial", "diet-trial"]);
  });

  it("names Justdial with the rating and never claims member reviews", () => {
    const text = all("2026-11-20");
    expect(text).toContain("4.7★ on Justdial (303+ ratings)");
    expect(text).not.toMatch(/member review|guarantee|lose \d+\s?kg|before.{0,5}after/i);
  });

  it("keeps Ads Manager headlines within 40 characters", () => {
    for (const day of ["2026-11-20", "2026-12-30", "2027-01-05"]) for (const c of adCreatives(content, day)) expect(c.adHeadline.length).toBeLessThanOrEqual(40);
  });

  it("sends calls and chats to the human number", () => {
    expect(all("2026-11-20")).toContain("+91 88518 30081");
    expect(all("2026-11-20")).not.toContain("92668");
  });
});

describe("parseCreativeFile", () => {
  it("reads id and size", () => {
    expect(parseCreativeFile("offer-prices-feed.jpg")).toEqual({ id: "offer-prices", size: "feed" });
    expect(parseCreativeFile("free-trial-story.jpg")).toEqual({ id: "free-trial", size: "story" });
    expect(parseCreativeFile("x-feed.png")).toBeNull();
    expect(parseCreativeFile("../etc-feed.jpg")).toBeNull();
  });
});
