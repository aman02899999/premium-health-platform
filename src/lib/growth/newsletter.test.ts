import { describe, expect, it } from "vitest";
import { CTA_RE } from "./nurture";
import { isSunday, weeklyNewsletter, weeklyPicks } from "./newsletter";

const lib = Array.from({ length: 15 }, (_, i) => ({ slug: `a${i}`, title: `Article ${i}`, excerpt: `Excerpt ${i} `.repeat(30) }));

describe("weekly newsletter", () => {
  it("knows Sundays", () => {
    expect(isSunday("2026-10-18")).toBe(true);
    expect(isSunday("2026-10-13")).toBe(false);
  });

  it("rotates through the whole library before repeating", () => {
    const seen = new Set<string>();
    for (let w = 0; w < 5; w++) {
      const day = new Date(Date.UTC(2026, 9, 18) + w * 7 * 86_400_000).toISOString().slice(0, 10);
      for (const a of weeklyPicks(day, lib)) seen.add(a.slug);
    }
    expect(seen.size).toBe(15);
    expect(weeklyPicks("2026-10-18", [])).toEqual([]);
  });

  it("builds a marketing email with tracked links, a disclaimer, a CTA and a per-week dedupe key", () => {
    const d = weeklyNewsletter("2026-10-18", "Reader@Example.com", lib, "https://www.royalfitnesclub.in")!;
    expect(d.kind.startsWith("nurture-")).toBe(true); // gets the unsubscribe link and headers
    expect(d.to).toBe("reader@example.com");
    expect(d.dedupeKey).toBe("weekly:2026-10-18:reader@example.com");
    expect(d.subject).toMatch(/^Indian Health Weekly: Article \d+$/);
    expect(d.body.match(/\/health\/blog\/a\d+\?utm_source=newsletter&utm_medium=email&utm_campaign=weekly-2026-10-18/g)).toHaveLength(3);
    expect(d.body).toContain("not medical advice");
    expect(CTA_RE.test(d.body)).toBe(true);
    expect(d.body.length).toBeLessThanOrEqual(2000); // message_outbox.body limit
  });
});
