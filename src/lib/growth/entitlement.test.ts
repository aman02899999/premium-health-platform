import { describe, expect, it } from "vitest";
import { entitlement, packageRules } from "./entitlement";

const base = { paidAt: "2026-10-01T05:00:00Z", extraGenerations: 0, accessUntil: null, revoked: false };
const v = (createdAt: string, status: "draft" | "sent" | "rejected" = "sent") => ({ createdAt, status });

describe("package rules (as sold)", () => {
  it("matches the checkout promises", () => {
    expect(packageRules("3m")).toEqual({ included: 6, everyDays: 15, months: 3 }); // updated every 2 weeks, 6 check-ins
    expect(packageRules("1m")).toEqual({ included: 2, everyDays: 15, months: 1 });
    expect(packageRules("6m")).toEqual({ included: 12, everyDays: 15, months: 6 });
    expect(packageRules("premium")).toEqual({ included: 12, everyDays: 7, months: 3 });
    expect(packageRules("trial")).toEqual({ included: 1, everyDays: 0, months: 0 });
    expect(packageRules("starter")).toEqual({ included: 1, everyDays: 0, months: 0 });
  });
});

describe("entitlement", () => {
  it("3-month: second plan opens 15 days after the first, then counts down", () => {
    const e = { ...base, plan: "3m", versions: [v("2026-10-01T06:00:00Z")] };
    expect(entitlement(e, new Date("2026-10-10T00:00:00Z"))).toMatchObject({ canUpdate: false, reason: "too-soon", nextAt: "2026-10-16", used: 1, remaining: 5 });
    expect(entitlement(e, new Date("2026-10-16T07:00:00Z"))).toMatchObject({ canUpdate: true, reason: "ok", accessUntil: "2026-12-30" });
  });

  it("stops when the package is used up, expired, revoked or a plan is in review", () => {
    const six = Array.from({ length: 6 }, (_, i) => v(new Date(Date.parse("2026-10-01T06:00:00Z") + i * 15 * 86_400_000).toISOString()));
    expect(entitlement({ ...base, plan: "3m", versions: six }, new Date("2026-12-20T00:00:00Z")).reason).toBe("none-left");
    expect(entitlement({ ...base, plan: "3m", versions: [v("2026-10-01T06:00:00Z")] }, new Date("2027-01-05T00:00:00Z")).reason).toBe("expired");
    expect(entitlement({ ...base, plan: "3m", revoked: true, versions: [v("2026-10-01T06:00:00Z")] }, new Date("2026-10-20T00:00:00Z")).reason).toBe("revoked");
    expect(entitlement({ ...base, plan: "3m", versions: [v("2026-10-01T06:00:00Z"), v("2026-10-16T06:00:00Z", "draft")] }, new Date("2026-11-20T00:00:00Z")).reason).toBe("in-review");
  });

  it("rejected versions don't use up the package; admin extras and end dates apply", () => {
    const e = { ...base, plan: "3m", versions: [v("2026-10-01T06:00:00Z"), v("2026-10-16T06:00:00Z", "rejected")] };
    expect(entitlement(e, new Date("2026-10-20T00:00:00Z"))).toMatchObject({ used: 1, canUpdate: true });
    expect(entitlement({ ...base, plan: "3m", extraGenerations: 2, accessUntil: "2027-02-01", versions: [] }, new Date("2027-01-15T00:00:00Z"))).toMatchObject({ allowed: 8, canUpdate: true });
  });

  it("single-plan packages never regenerate unless the admin grants extras", () => {
    expect(entitlement({ ...base, plan: "trial", versions: [v("2026-10-01T06:00:00Z")] }, new Date("2026-10-05T00:00:00Z")).reason).toBe("single-plan");
    expect(entitlement({ ...base, plan: "trial", extraGenerations: 1, versions: [v("2026-10-01T06:00:00Z")] }, new Date("2026-10-09T00:00:00Z")).canUpdate).toBe(true);
  });
});
