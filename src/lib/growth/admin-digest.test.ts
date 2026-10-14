import { describe, expect, it } from "vitest";
import { adminDigest } from "./admin-digest";

describe("admin morning email", () => {
  it("leads with money and what needs a person, and never carries health details", () => {
    const d = adminDigest(
      "2026-10-14",
      {
        leads: [{ name: "Rahul", source: "whatsapp-inbound" }],
        payments: [
          { kind: "Membership", name: "Asha", what: "Monthly", rupees: 1500 },
          { kind: "Diet plan", name: "Priya", what: "3-Month Transformation", rupees: 2999 },
        ],
        plansToReview: [{ name: "Priya", plan: "3-Month Transformation" }],
        clientUpdates: 2,
        unanswered: [{ channel: "instagram", name: "fit_ravi", text: "Do you have a women's batch?" }],
        expiringMembers: [{ name: "Vikas", expiresOn: "2026-10-18" }],
        failedMessages: 0,
      },
      "admin@example.com",
      "https://www.royalfitnessclub.in/admin/growth",
    );
    expect(d.subject).toBe("2026-10-14: ₹4,499 from 2 payments · 1 new lead · 2 need you");
    expect(d.body).toContain("• Review Priya's 3-Month Transformation (health details shared)");
    expect(d.body).toContain('• Reply to fit_ravi on instagram: "Do you have a women\'s batch?"');
    expect(d.body).toContain("• Membership: Asha, Monthly, ₹1,500");
    expect(d.body).toContain("Clients built 2 updated plans");
    expect(d.dedupeKey).toBe("admin-digest:2026-10-14");
    expect(d.body.length).toBeLessThanOrEqual(2000);
  });

  it("says plainly when nothing happened", () => {
    const d = adminDigest("2026-10-14", { leads: [], payments: [], plansToReview: [], clientUpdates: 0, unanswered: [], expiringMembers: [], failedMessages: 0 }, "a@b.c", "u");
    expect(d.subject).toBe("2026-10-14: no payments · 0 new leads");
    expect(d.body).toContain("Nothing: the automation handled everything.");
  });
});
