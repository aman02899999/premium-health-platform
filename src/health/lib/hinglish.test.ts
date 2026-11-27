import { describe, it, expect } from "vitest";
import { expandHinglish, hinglishSearch } from "./hinglish";

describe("Hinglish search", () => {
  it("maps Hindi and Hinglish words to the English term", () => {
    expect(expandHinglish("madhumeh diet").term).toBe("diabetes");
    expect(expandHinglish("high bp gharelu").term).toBe("hypertension");
    expect(expandHinglish("haldi benefits").term).toBe("turmeric");
    expect(expandHinglish("random words").term).toBeNull();
  });

  it("finds the site's own pages for a Hinglish query", () => {
    const r = hinglishSearch("madhumeh");
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((x) => x.href.startsWith("/health/"))).toBe(true);
    expect(r.some((x) => /diabet/i.test(x.title))).toBe(true);
  });

  it("finds turmeric pages for haldi", () => {
    expect(hinglishSearch("haldi").some((x) => /turmeric|haldi/i.test(`${x.title} ${x.hindi ?? ""}`))).toBe(true);
  });
});
