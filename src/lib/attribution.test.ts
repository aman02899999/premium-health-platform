import { describe, expect, it } from "vitest";
import { attributionFromRequest, channelOf, mergeTouch, parseAttribution, serializeAttribution, touchFrom } from "./attribution";

const NOW = new Date("2026-10-19T10:00:00Z");
const visit = (url: string, referrer = "") => touchFrom(new URL(url), referrer, "royalfitness.in", NOW);

describe("attribution", () => {
  it("sorts touches into channels without inventing any", () => {
    const c = (o: Partial<Parameters<typeof channelOf>[0]>) => channelOf({ source: null, medium: null, referrer: null, clickId: null, ...o });
    expect(c({ source: "instagram", medium: "cpc" })).toBe("paid");
    expect(c({ clickId: "gclid" })).toBe("paid");
    expect(c({ source: "instagram", medium: "social" })).toBe("social");
    expect(c({ source: "instagram" })).toBe("social");
    expect(c({ source: "email", medium: "email" })).toBe("email");
    expect(c({ source: "whatsapp" })).toBe("messaging");
    expect(c({ referrer: "google.com" })).toBe("organic");
    expect(c({ referrer: "l.instagram.com" })).toBe("social");
    expect(c({ referrer: "wa.me" })).toBe("messaging");
    expect(c({ referrer: "justdial.com" })).toBe("referral");
    expect(c({ source: "flyer" })).toBe("other");
    expect(c({})).toBe("direct");
  });

  it("records a tagged landing and ignores internal or untagged views", () => {
    const t = visit("https://royalfitness.in/membership?utm_source=Instagram&utm_medium=social&utm_campaign=Diwali%20Offer&fbclid=abc");
    expect(t).toMatchObject({ source: "instagram", medium: "social", campaign: "diwali offer", landing: "/membership", clickId: "fbclid", channel: "paid", at: NOW.toISOString() });
    expect(JSON.stringify(t)).not.toContain("abc"); // the click id's value isn't kept
    expect(visit("https://royalfitness.in/join", "https://www.royalfitness.in/")).toBeNull();
    expect(visit("https://royalfitness.in/join")).toBeNull();
    expect(visit("https://royalfitness.in/join", "https://www.google.com/search?q=gym")).toMatchObject({ referrer: "google.com", channel: "organic" });
  });

  it("keeps the first touch and replaces the last", () => {
    const first = visit("https://royalfitness.in/?utm_source=google&utm_medium=cpc")!;
    const second = visit("https://royalfitness.in/shop?utm_source=whatsapp&utm_campaign=restock")!;
    const a = mergeTouch(mergeTouch(null, first), second)!;
    expect(a.first.channel).toBe("paid");
    expect(a.last).toMatchObject({ channel: "messaging", campaign: "restock", landing: "/shop" });
    expect(mergeTouch(a, null)).toBe(a);
    expect(parseAttribution(serializeAttribution(a))).toEqual(a);
  });

  it("re-validates an edited cookie instead of trusting it", () => {
    const forged = encodeURIComponent(JSON.stringify({ first: { source: "<script>", medium: "email", channel: "paid", landing: "https://evil.example", referrer: "javascript:alert(1)", clickId: "x", at: "2026-10-01T00:00:00Z" } }));
    const a = parseAttribution(forged)!;
    expect(a.first).toMatchObject({ source: null, medium: "email", channel: "email", landing: "/", clickId: null });
    expect(a.last).toEqual(a.first);
    expect(parseAttribution("not json")).toBeNull();
    expect(parseAttribution(encodeURIComponent(JSON.stringify({ first: { at: "yesterday" } })))).toBeNull();
    expect(parseAttribution("x".repeat(4000))).toBeNull();
  });

  it("reads the cookie from a request", () => {
    const a = mergeTouch(null, visit("https://royalfitness.in/?utm_source=newsletter")!)!;
    const req = new Request("https://royalfitness.in/api/leads", { headers: { cookie: `theme=dark; rfc_attr=${serializeAttribution(a)}` } });
    expect(attributionFromRequest(req)?.first.channel).toBe("email");
    expect(attributionFromRequest(new Request("https://royalfitness.in/api/leads"))).toBeNull();
  });
});
