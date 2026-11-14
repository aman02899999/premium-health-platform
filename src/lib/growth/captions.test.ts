import { describe, expect, it } from "vitest";
import { socialCaption } from "./captions";

const biz = { name: "Royal Fitness Club", phone: "+91 88518 30081", coach: "Coach Aman Sharma" };
const input = { hook: "Hook", description: "Body", cta: "Book a free trial", link: "https://www.example.in/x", keywords: ["Fat loss tips"], tags: ["fatloss"] };

describe("social captions", () => {
  it("point Instagram and Facebook followers to the YouTube channel", () => {
    for (const ch of ["instagram", "facebook"] as const) {
      const cap = socialCaption(input, biz, ch);
      expect(cap).toMatch(/YouTube/);
      expect(cap).toContain("youtube.com/@RoyalFitnessTV");
      expect(cap).not.toMatch(/\d[\d,.]*\s*(k|lakh)?\s*subscribers/i);
    }
  });
});
