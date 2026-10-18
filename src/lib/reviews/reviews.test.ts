import { describe, expect, it } from "vitest";
import { displayName, parseReview, summary } from "./validate";

const ok = { name: "Rahul Kumar Sharma", phone: "+91 98765 43210", rating: 5, body: "Lost 6 kg in three months with the diet chart and evening batch.", consent: true };

describe("verified reviews: input", () => {
  it("accepts a real review and normalises the phone", () => {
    expect(parseReview(ok)).toMatchObject({ name: "Rahul Kumar Sharma", phone: "9876543210", rating: 5, city: "", title: "" });
  });
  it("rejects missing rating, short text, links, bad numbers and no consent", () => {
    expect(parseReview({ ...ok, rating: 0 })).toMatch(/star rating/);
    expect(parseReview({ ...ok, rating: 4.5 })).toMatch(/star rating/);
    expect(parseReview({ ...ok, body: "Great gym" })).toMatch(/couple of sentences/);
    expect(parseReview({ ...ok, body: "Best gym ever, see https://spam.example for more deals" })).toMatch(/links/);
    expect(parseReview({ ...ok, phone: "12345" })).toMatch(/10-digit/);
    expect(parseReview({ ...ok, consent: "yes" })).toMatch(/confirm/);
  });
  it("shows first name and surname initial only", () => {
    expect(displayName("Rahul Kumar Sharma")).toBe("Rahul S.");
    expect(displayName("priya")).toBe("priya");
  });
  it("summarises every rating, low ones included", () => {
    expect(summary([{ rating: 5 }, { rating: 4 }, { rating: 2 }])).toEqual({ count: 3, average: 3.7, byStars: [0, 1, 0, 1, 1] });
    expect(summary([])).toEqual({ count: 0, average: 0, byStars: [0, 0, 0, 0, 0] });
  });
});
