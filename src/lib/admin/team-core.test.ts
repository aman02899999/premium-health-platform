import { describe, expect, it } from "vitest";
import { allowed, growthActionAllowed, initials, normEmail, roleGate, teamChangeError, type Member } from "./team-core";
import { HUB_SECTIONS, sectionsFor } from "./hub";

describe("who may open what", () => {
  it("owners open everything", () => {
    for (const p of ["/admin", "/admin/team", "/api/admin/team", "/admin/shop", "/api/admin/payments", "/admin/website"]) expect(allowed("owner", p)).toBe(true);
  });
  it("managers open everything except the team", () => {
    expect(allowed("manager", "/admin/team")).toBe(false);
    expect(allowed("manager", "/api/admin/team")).toBe(false);
    for (const p of ["/admin/shop", "/api/admin/audience", "/admin/ads", "/admin/website", "/admin/ai-agent"]) expect(allowed("manager", p)).toBe(true);
  });
  it("only owners open members' saved blood reports; managers run the rest of the analyser", () => {
    expect(allowed("owner", "/api/admin/blood-report/reports")).toBe(true);
    expect(allowed("manager", "/api/admin/blood-report/reports")).toBe(false);
    expect(allowed("manager", "/api/admin/blood-report")).toBe(true);
    expect(allowed("agent", "/admin/blood-report")).toBe(false);
  });
  it("agents get the desk's work only", () => {
    for (const p of ["/admin", "/admin/", "/admin/chats", "/api/admin/chats/919811111111", "/admin/contacts", "/api/admin/contacts", "/admin/growth", "/api/admin/growth", "/admin/qr", "/api/admin/me", "/admin/login", "/api/admin/logout"])
      expect([p, allowed("agent", p)]).toEqual([p, true]);
    for (const p of ["/admin/team", "/admin/shop", "/api/admin/shop/orders", "/admin/audience", "/api/admin/audience", "/admin/ads", "/admin/website", "/api/admin/content", "/api/admin/payments", "/admin/analytics", "/api/admin/whatsapp-templates", "/admin/ai-agent", "/api/admin/ai-agent"])
      expect([p, allowed("agent", p)]).toEqual([p, false]);
  });
  it("agents can't send diet plans or upload member lists", () => {
    for (const p of ["/api/admin/growth/diet-plan", "/api/admin/growth/diet-order", "/api/admin/members/import"]) expect([p, allowed("agent", p)]).toEqual([p, false]);
    expect(allowed("manager", "/api/admin/growth/diet-plan")).toBe(true);
    expect(allowed("manager", "/api/admin/members/import")).toBe(true);
  });
  it("in Growth, agents save members, update leads and send today's messages; the rest is for managers", () => {
    for (const a of ["save-member", "lead", "message"]) expect(growthActionAllowed("agent", a)).toBe(true);
    for (const a of ["run-daily", "post-reel", "delete-member", "diet-send", "diet-regenerate", "diet-stage", "client-access", "version-reject", "apply-order"]) {
      expect([a, growthActionAllowed("agent", a)]).toEqual([a, false]);
      expect(growthActionAllowed("manager", a)).toBe(true);
    }
  });
  it("prefixes match whole path segments only", () => {
    expect(allowed("agent", "/admin/chatsabc")).toBe(false);
    expect(allowed("manager", "/admin/teamwork")).toBe(true);
  });
  it("non-admin paths are left to their pages", () => {
    expect(allowed("agent", "/membership")).toBe(true);
  });
  it("the hub only shows tiles the role can open", () => {
    const tiles = (role: "owner" | "manager" | "agent") => sectionsFor(role).flatMap((s) => s.tiles.map((t) => t.id));
    expect(tiles("owner")).toContain("team");
    expect(tiles("manager")).not.toContain("team");
    expect(tiles("agent")).toEqual(expect.arrayContaining(["chats", "contacts", "leads", "members", "qr", "today"]));
    for (const id of ["broadcast", "ads", "shop", "payments", "website", "analytics", "team"]) expect(tiles("agent")).not.toContain(id);
    expect(tiles("owner").length).toBe(HUB_SECTIONS.flatMap((s) => s.tiles).length);
  });
});

describe("team changes", () => {
  const m = (email: string, role: Member["role"]): Member => ({ email, name: "", role, createdAt: "", addedBy: "" });
  const team = [m("a@x.in", "owner"), m("b@x.in", "manager"), m("c@x.in", "agent")];
  it("keeps at least one owner and stops self-lockout", () => {
    expect(teamChangeError(team, "a@x.in", { kind: "remove", email: "a@x.in" })).toMatch(/yourself/);
    expect(teamChangeError(team, "a@x.in", { kind: "role", email: "a@x.in", role: "agent" })).toMatch(/your own role/);
    expect(teamChangeError([m("a@x.in", "owner"), m("d@x.in", "owner")], "a@x.in", { kind: "role", email: "d@x.in", role: "agent" })).toBeNull();
    expect(teamChangeError(team, "a@x.in", { kind: "remove", email: "c@x.in" })).toBeNull();
    expect(teamChangeError(team, "a@x.in", { kind: "remove", email: "z@x.in" })).toMatch(/isn't on the team/);
  });
  it("normalises emails and initials", () => {
    expect(normEmail(" Ritu@Gmail.com ")).toBe("ritu@gmail.com");
    expect(normEmail("nope")).toBeNull();
    expect(initials("Ritu Sharma", "r@x.in")).toBe("RS");
    expect(initials("", "desk.team@x.in")).toBe("DT");
    expect(initials("Ritu (front desk)", "r@x.in")).toBe("RF");
  });
});

describe("roleGate (the proxy's decision for admin requests)", () => {
  it("lets each role through only where it may go", () => {
    expect(roleGate("/api/admin/payments", { role: "manager" }, false)).toBe("allow");
    expect(roleGate("/api/admin/payments", { role: "agent" }, false)).toBe("deny");
    expect(roleGate("/api/admin/team", { role: "manager" }, false)).toBe("deny");
    expect(roleGate("/admin/chats", { role: "agent" }, false)).toBe("allow");
  });

  it("leaves non-admins to the route, which refuses them", () => {
    expect(roleGate("/api/admin/payments", null, false)).toBe("allow");
  });

  it("fails closed on admin APIs when the role can't be read, but keeps sign-in, sign-out and pages working", () => {
    expect(roleGate("/api/admin/payments", null, true)).toBe("unavailable");
    expect(roleGate("/api/admin/team", null, true)).toBe("unavailable");
    expect(roleGate("/api/admin/login", null, true)).toBe("allow");
    expect(roleGate("/api/admin/logout", null, true)).toBe("allow");
    // Pages only show what the admin APIs return, so they can still load.
    expect(roleGate("/admin/payments", null, true)).toBe("allow");
  });
});
