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
      "https://www.royalfitnesclub.in/admin/growth",
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

  it("reports campaign sends, held promotions and results, and stays quiet when there are none", () => {
    const base = { leads: [], payments: [], plansToReview: [], clientUpdates: 0, unanswered: [], expiringMembers: [], failedMessages: 0 };
    const d = adminDigest("2026-10-20", { ...base, campaigns: { sent: 180, held: 40, results: [{ name: "Comeback", buyers: 3, revenue: 4500 }] } }, "a@b.c", "u");
    expect(d.body).toContain("CAMPAIGNS\n• 180 campaign messages sent\n• 40 WhatsApp promotions waiting for tomorrow");
    expect(d.body).toContain("• Comeback: 3 paid within 14 days, ₹4,500");
    expect(adminDigest("2026-10-20", { ...base, campaigns: { sent: 0, held: 0, results: [] } }, "a@b.c", "u").body).not.toContain("CAMPAIGNS");
  });

  it("puts the call list near the top, names and reasons only, and counts it as needing you", () => {
    const base = { leads: [], payments: [], plansToReview: [], clientUpdates: 0, unanswered: [], expiringMembers: [], failedMessages: 0 };
    const list = Array.from({ length: 12 }, (_, i) => ({ name: `Person ${i + 1}`, why: "Replied to “Diwali offer”: “price?”" }));
    const d = adminDigest("2026-10-21", { ...base, callList: list }, "a@b.c", "u");
    expect(d.body).toContain("CALL TODAY (12)\n• Person 1: Replied to “Diwali offer”: “price?”");
    expect(d.body).toContain("• …and 2 more\n• Numbers and one-tap outcomes: Admin → Call list");
    expect(d.body).not.toContain("Person 11:");
    expect(d.body.indexOf("CALL TODAY")).toBeLessThan(d.body.indexOf("PAYMENTS"));
    expect(d.subject).toContain("1 need you");
    expect(adminDigest("2026-10-21", { ...base, callList: [] }, "a@b.c", "u").body).not.toContain("CALL TODAY");
  });

  it("carries the watchdog's site-health line right after what needs a person", () => {
    const data = { leads: [], payments: [], plansToReview: [], clientUpdates: 0, unanswered: [], expiringMembers: [], failedMessages: 0 };
    const d = adminDigest("2026-10-25", { ...data, health: ["Razorpay's webhook isn't reaching the site. Razorpay → Live mode → Webhooks."] }, "a@b.c", "u");
    expect(d.body).toContain("SITE HEALTH\n• Razorpay's webhook isn't reaching the site.");
    expect(d.body.indexOf("SITE HEALTH")).toBeLessThan(d.body.indexOf("PAYMENTS"));
    expect(adminDigest("2026-10-25", data, "a@b.c", "u").body).not.toContain("SITE HEALTH");
  });
});
