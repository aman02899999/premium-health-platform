import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/health/db", () => ({ pool: {} }));

import { trialReviewDrafts } from "./trial-review";
import { TEMPLATES } from "./messages";

const BIZ = { name: "Royal Fitness Club", phone: "+91 88518 30081", siteUrl: "https://example.in" };
const COACH = "Coach Aman Sharma";

describe("Day-7 review reminder for 7-day trial buyers", () => {
  it("sends WhatsApp and email once per order, pointing to the number a person answers", () => {
    const drafts = trialReviewDrafts([{ id: "o1", name: "Priya Singh", phone: "+91 98765 43210", email: "Priya@Example.com" }], BIZ, COACH, new Set());
    expect(drafts.map((d) => [d.channel, d.to, d.kind, d.dedupeKey])).toEqual([
      ["whatsapp", "919876543210", "diet-trial-review", "diet-trial-review:o1"],
      ["email", "priya@example.com", "diet-trial-review-email", "diet-trial-review-email:o1"],
    ]);
    const wa = drafts[0];
    expect(wa.template).toBe(TEMPLATES["diet-trial-review"].name);
    expect(wa.params).toEqual(["Priya", "Royal Fitness Club", COACH, "+91 88518 30081"]);
    expect(wa.body).toContain("88518 30081");
    expect(drafts[1].body).toContain("88518 30081");
  });

  it("is a Utility template: about the buyer's own plan, with no offer in it", () => {
    const t = TEMPLATES["diet-trial-review"];
    expect(t.category).toBe("UTILITY");
    expect(t.text).not.toMatch(/₹|offer|discount|upgrade|buy/i);
  });

  it("skips numbers that can't get WhatsApp and emails that unsubscribed", () => {
    const drafts = trialReviewDrafts(
      [
        { id: "o1", name: "A", phone: "12345", email: "a@example.com" },
        { id: "o2", name: "B", phone: "9876543210", email: "b@example.com" },
        { id: "o3", name: "C", phone: "9876500000", email: null },
      ],
      BIZ,
      COACH,
      new Set(["b@example.com"]),
    );
    expect(drafts.map((d) => `${d.channel}:${d.to}`)).toEqual(["email:a@example.com", "whatsapp:919876543210", "whatsapp:919876500000"]);
  });
});
