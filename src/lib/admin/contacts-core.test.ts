import { describe, expect, it } from "vitest";
import { contactKey, contactsCsv, mobile10, normAttr, normTag, segmentTag, tagSegment, type ContactRow } from "./contacts-core";

describe("contact keys", () => {
  it("normalises Indian mobiles in every format people use", () => {
    for (const p of ["9811111111", "+91 98111 11111", "919811111111", "098111-11111"]) expect(mobile10(p)).toBe("9811111111");
    expect(mobile10("12345")).toBeNull();
    expect(mobile10("5811111111")).toBeNull();
  });
  it("mobile first, else lowercase email", () => {
    expect(contactKey("9811111111", "A@b.com")).toBe("9811111111");
    expect(contactKey(null, " A@B.com ")).toBe("a@b.com");
    expect(contactKey(null, "nope")).toBeNull();
  });
});

describe("tags and attributes", () => {
  it("folds tags to a safe lowercase form", () => {
    expect(normTag("VIP Members!")).toBe("vip members");
    expect(normTag("  morning   batch ")).toBe("morning batch");
    expect(normTag("!!!")).toBeNull();
    expect(normTag("x".repeat(40))).toHaveLength(30);
    expect(normTag(5)).toBeNull();
  });
  it("tag segments round-trip and reject unfolded tags", () => {
    expect(segmentTag(tagSegment("vip"))).toBe("vip");
    expect(segmentTag("tag:VIP")).toBeNull();
    expect(segmentTag("current")).toBeNull();
  });
  it("attribute names become snake_case", () => {
    expect(normAttr("Preferred time")).toBe("preferred_time");
    expect(normAttr("1st goal")).toBe("st_goal");
    expect(normAttr("!!")).toBeNull();
  });
});

describe("csv", () => {
  it("quotes commas and neutralises spreadsheet formulas", () => {
    const row: ContactRow = { key: "9811111111", name: "=HYPERLINK(\"x\")", phone: "9811111111", email: null, kinds: ["member", "lead"], tags: ["vip"], lastAt: "2026-10-20T10:00:00.000Z", memberUntil: "2026-11-01", waBlocked: false, emailUnsubscribed: false };
    const csv = contactsCsv([row]).split("\n");
    expect(csv[0]).toBe("name,mobile,email,type,tags,member_until,last_activity,whatsapp_ok,email_ok");
    expect(csv[1]).toBe(`"'=HYPERLINK(""x"")",9811111111,,Member; Lead,vip,2026-11-01,2026-10-20,yes,no`);
  });
});
