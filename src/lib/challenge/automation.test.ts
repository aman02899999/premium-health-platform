import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/health/db", () => ({ pool: { query: vi.fn() }, isDbConfigured: false }));
vi.mock("@/lib/growth/daily", () => ({ business: async () => ({ phone: "+91 88518 30081" }) }));
vi.mock("@/lib/growth/hooks", () => ({ afterLeadSaved: vi.fn() }));
vi.mock("@/lib/growth/leads", () => ({ insertLead: vi.fn() }));
vi.mock("@/lib/growth/outbox", () => ({ enqueue: vi.fn() }));
const { winnerEmail, coachSummary, previousMonth, prizeLine } = await import("./automation");

describe("challenge automation", () => {
  it("finalises the month before the India month", () => {
    expect(previousMonth(new Date("2027-01-01T01:00:00+05:30"))).toBe("2026-12");
    expect(previousMonth(new Date("2026-12-31T23:30:00+05:30"))).toBe("2026-11");
  });

  it("tells a gym winner to bring the code and photo ID, with the calls number", () => {
    const d = winnerEmail({ email: "a@b.in", firstName: "Rahul", prize: "gym-3m", claimCode: "WIN-ABCD1234", month: "2026-12" }, "+91 88518 30081");
    expect(d.body).toContain("WIN-ABCD1234");
    expect(d.body).toContain("photo ID");
    expect(d.body).toContain("worth ₹5,000");
    expect(d.body).toContain("88518 30081");
    expect(d.body).not.toContain("92668");
    expect(d.dedupeKey).toBe("challenge-winner:WIN-ABCD1234");
  });

  it("sends a diet-plan winner to the coach instead of the gym", () => {
    const d = winnerEmail({ email: "a@b.in", firstName: "Asha", prize: "diet-1m", claimCode: "WIN-1", month: "2026-12" }, "+91 88518 30081");
    expect(d.body).not.toContain("photo ID");
    expect(d.body).toContain("worth ₹1,999");
  });

  it("lists winners for the coach once per month", () => {
    const d = coachSummary("2026-12", [{ firstName: "Rahul", prize: "gym-1m", claimCode: "WIN-1" }], "coach@x.in");
    expect(d.body).toContain("Rahul: 1 month free gym membership (WIN-1)");
    expect(d.dedupeKey).toBe("admin-challenge-winners:2026-12");
  });

  it("describes prizes without inventing a worth", () => {
    expect(prizeLine("pass-7d")).toBe("7-day free gym pass");
    expect(prizeLine("gym-15d")).toBe("15 days free gym plus a free diet consultation");
  });
});
