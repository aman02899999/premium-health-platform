import { describe, expect, it } from "vitest";
import { adLink, adMetrics, adRefFromText, adSlug, adVerdict, parseRupees, whatsappAdText } from "./ads-core";

describe("ad tags and links", () => {
  it("slugs names", () => {
    expect(adSlug("Diwali Offer – Sector 93!")).toBe("diwali-offer-sector-93");
    expect(adSlug("x".repeat(60))).toHaveLength(40);
  });
  it("website links carry paid utm tags; #anchors stay last", () => {
    expect(adLink("https://www.royalfitnesclub.in", "/contact#trial", "meta", "diwali")).toBe("https://www.royalfitnesclub.in/contact?utm_source=facebook&utm_medium=paid&utm_campaign=diwali#trial");
    expect(adLink("https://www.royalfitnesclub.in", "/membership", "google", "g1x")).toBe("https://www.royalfitnesclub.in/membership?utm_source=google&utm_medium=paid&utm_campaign=g1x");
  });
  it("the WhatsApp ad message ends with a tag the bot reads back", () => {
    expect(adRefFromText(whatsappAdText("diwali-offer"))).toBe("diwali-offer");
    expect(adRefFromText("hi (ad Diwali-Offer) ")).toBe("diwali-offer");
    expect(adRefFromText("(ad diwali) thanks")).toBeNull();
    expect(adRefFromText("hello")).toBeNull();
  });
});

describe("ad maths", () => {
  it("cost per lead, per sale, and return on spend", () => {
    expect(adMetrics({ spendPaise: 500000, leads: 20, orders: 2, netPaise: 1500000 })).toEqual({ cpl: 250, cpo: 2500, roas: 3 });
    expect(adMetrics({ spendPaise: 0, leads: 3, orders: 0, netPaise: 0 })).toEqual({ cpl: null, cpo: null, roas: null });
  });
  it("advice only once there is enough to judge", () => {
    const r = (spend: number, leads: number, orders: number, net: number) => ({ spendPaise: spend * 100, leads, orders, netPaise: net * 100 });
    const v = (x: ReturnType<typeof r>) => adVerdict(x, adMetrics(x));
    expect(v(r(500, 2, 0, 0))).toBeNull();
    expect(v(r(3000, 0, 0, 0))).toMatch(/no leads/);
    expect(v(r(3000, 12, 0, 0))).toMatch(/follow-up is the leak/);
    expect(v(r(3000, 12, 2, 12000))).toMatch(/3×/);
    expect(v(r(3000, 12, 1, 4000))).toMatch(/Paying for itself/);
    expect(v(r(3000, 6, 1, 1500))).toMatch(/Costing more/);
  });
  it("reads rupees the way people type them", () => {
    expect(parseRupees("₹ 12,500")).toBe(12500);
    expect(parseRupees("99.5")).toBe(100);
    expect(parseRupees(800)).toBe(800);
    expect(parseRupees("-5")).toBeNull();
    expect(parseRupees("abc")).toBeNull();
  });
});
