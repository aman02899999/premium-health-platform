import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "./content/defaults";
import { countdownLabel, igLanding } from "./ig-landing";

describe("igLanding", () => {
  it("leads with the festive offer and counts down to its last day", () => {
    const l = igLanding(DEFAULT_CONTENT, "2026-10-22");
    expect(l.badge).toBe("FESTIVE OFFER");
    expect(l.countdown).toBe("70 days left");
    expect(l.deal).toBe("Monthly ₹1,500 · 1 month + 5 bonus days + free diet consultation");
    expect(l.plans.every((p) => p.offer)).toBe(true);
    expect(l.plans.map((p) => p.price)).toEqual([...l.plans.map((p) => p.price)].sort((a, b) => a - b));
  });

  it("sells the free trial once the offer is over", () => {
    const l = igLanding(DEFAULT_CONTENT, "2027-01-01");
    expect(l.badge).toBe("FREE TRIAL");
    expect(l.countdown).toBe("");
    expect(l.endsOn).toBeNull();
    expect(l.plans.some((p) => p.offer)).toBe(false);
  });

  it("says when the offer ends today or tomorrow", () => {
    expect(countdownLabel("2026-12-31", "2026-12-31")).toBe("Ends today");
    expect(countdownLabel("2026-12-30", "2026-12-31")).toBe("1 day left");
  });
});
