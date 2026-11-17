import { describe, expect, it } from "vitest";
import { hindiKeyword, LONG_HINDI, longTitleHindiFirst, withHindi } from "./hindi";
import { LONG_VIDEOS } from "./long-videos";
import { SHORTS } from "./shorts-bank";
import { shortTitle } from "./shorts-core";

describe("Hindi-first titles", () => {
  it("adds Devanagari search words to a Short's title and stays inside 100 characters", () => {
    const s = SHORTS.find((x) => x.id === "viral-nimbu-pani")!;
    expect(shortTitle(s)).toBe("Nimbu garam paani se fat melt hota hai? | पेट की चर्बी #shorts");
    for (const x of SHORTS) {
      const t = shortTitle(x);
      expect([...t].length, x.id).toBeLessThanOrEqual(100);
      expect(t.endsWith("#shorts"), x.id).toBe(true);
    }
  });
  it("finds Hindi words for most of the bank", () => {
    const hits = SHORTS.filter((s) => hindiKeyword(s)).length;
    expect(hits / SHORTS.length).toBeGreaterThan(0.8);
  });
  it("leaves the title alone when the Hindi wouldn't fit", () => {
    expect(withHindi("x".repeat(95), "वजन कम करें", " #shorts")).toBe(`${"x".repeat(95)} #shorts`);
  });
  it("puts Hindi first on every upcoming long video, within 100 characters", () => {
    for (const id of Object.keys(LONG_HINDI)) {
      const v = LONG_VIDEOS.find((l) => l.id === id);
      expect(v, id).toBeDefined();
      const t = longTitleHindiFirst(id, v!.title);
      expect(t.startsWith(LONG_HINDI[id]), id).toBe(true);
      expect([...t].length, id).toBeLessThanOrEqual(100);
    }
    expect(longTitleHindiFirst("long-fitness-myths-10", "Same")).toBe("Same");
  });
  it("covers every long video still to come", () => {
    for (const v of LONG_VIDEOS.filter((l) => l.date >= "2026-11-18")) expect(LONG_HINDI[v.id], v.id).toBeTruthy();
  });
});
