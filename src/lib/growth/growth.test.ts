import { describe, expect, it } from "vitest";
import { addDays, addMonths, daysBetween, expiryFor, formatDate, isIsoDate, parseDuration, renewalStart, todayIST } from "./dates";
import { looksLikeReferralCode, makeReferralCode } from "./config";
import { dueMessages, leadMessage, renewalMessage, waLink, type LeadLike, type MemberLike } from "./messages";

describe("dates (IST)", () => {
  it("today is the Indian date, not UTC", () => {
    expect(todayIST(new Date("2026-10-08T18:29:00Z"))).toBe("2026-10-08"); // 23:59 IST
    expect(todayIST(new Date("2026-10-08T18:30:00Z"))).toBe("2026-10-09"); // 00:00 IST
  });
  it("adds months, clamping to month end", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonths("2026-10-08", 3)).toBe("2027-01-08");
    expect(addMonths("2026-12-15", 15)).toBe("2028-03-15");
  });
  it("membership expiry is the last valid day, inclusive", () => {
    expect(expiryFor("2026-10-08", { months: 1, days: 0 })).toBe("2026-11-07");
    expect(expiryFor("2026-01-01", { months: 12, days: 0 })).toBe("2026-12-31");
    expect(expiryFor("2026-10-08", { months: 0, days: 7 })).toBe("2026-10-14");
  });
  it("reads plan durations only when certain", () => {
    expect(parseDuration("1 month")).toEqual({ months: 1, days: 0 });
    expect(parseDuration("3 Months")).toEqual({ months: 3, days: 0 });
    expect(parseDuration("1 year")).toEqual({ months: 12, days: 0 });
    expect(parseDuration("15 months")).toEqual({ months: 15, days: 0 });
    expect(parseDuration("2 weeks")).toEqual({ months: 0, days: 14 });
    expect(parseDuration("about a month")).toBeNull();
    expect(parseDuration("0 months")).toBeNull();
    expect(parseDuration("3-6 months")).toBeNull();
  });
  it("renewals never lose paid days", () => {
    expect(renewalStart("2026-10-08", null, "2026-10-20")).toBe("2026-10-21"); // early renewal
    expect(renewalStart("2026-10-08", null, "2026-09-01")).toBe("2026-10-08"); // lapsed
    expect(renewalStart("2026-10-08", "2026-10-15", null)).toBe("2026-10-15"); // chosen start
    expect(renewalStart("2026-10-08", "2026-10-01", null)).toBe("2026-10-08"); // past start ignored
    expect(renewalStart("2026-10-08", "2026-10-15", "2026-10-30")).toBe("2026-10-31");
  });
  it("helpers", () => {
    expect(daysBetween("2026-10-08", "2026-11-07")).toBe(30);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-02-28")).toBe(true);
    expect(formatDate("2026-11-07")).toBe("7 Nov 2026");
  });
});

describe("referral codes", () => {
  it("are readable and validated", () => {
    let i = 0;
    const seq = [0, 0.1, 0.5, 0.99];
    const code = makeReferralCode("Aman Sharma", () => seq[i++ % seq.length]);
    expect(code).toMatch(/^RFC-AMAN-[2-9A-HJKMNP-Z]{4}$/);
    expect(looksLikeReferralCode(code.toLowerCase())).toBe(true);
    expect(looksLikeReferralCode("Rahul from the gym")).toBe(false);
    expect(makeReferralCode("अमन")).toMatch(/^RFC-FIT-/);
  });
});

const biz = { name: "Royal Fitness Club", phone: "+91 88518 30081", siteUrl: "https://example.in" };
const member = (expiresOn: string, extra: Partial<MemberLike> = {}) => ({ id: "m1", name: "Aman Sharma", phone: "9876543210", planName: "Monthly", expiresOn, reminders: true, referralCode: "RFC-AMAN-2345", renewToken: "tok", ...extra });
const lead = (createdAt: string, extra: Partial<LeadLike> = {}): LeadLike => ({ id: "l1", name: "Priya", phone: "98765 43210", createdAt, status: "new", followUps: true, ...extra });

describe("scheduled messages", () => {
  const kinds = (today: string, members = [member("2026-10-15")], leads: LeadLike[] = []) => dueMessages(today, members, leads, biz).map((d) => d.kind);
  it("renewal reminders 7 days before, 1 day before, and after expiry", () => {
    expect(kinds("2026-10-08")).toEqual(["renew-7"]); // 7 days left
    expect(kinds("2026-10-07")).toEqual([]); // 8 days left
    expect(kinds("2026-10-13")).toEqual(["renew-7"]); // 2 left (catch-up window)
    expect(kinds("2026-10-14")).toEqual(["renew-1"]);
    expect(kinds("2026-10-15")).toEqual(["renew-1"]); // last day
    expect(kinds("2026-10-16")).toEqual([]);
    expect(kinds("2026-10-18")).toEqual(["expired-3"]);
    expect(kinds("2026-10-26")).toEqual([]); // gave up after 10 days
    expect(kinds("2026-10-08", [member("2026-10-15", { reminders: false })])).toEqual([]);
  });
  it("one key per member per expiry, so each reminder goes once", () => {
    const a = renewalMessage("renew-7", member("2026-10-15"), biz);
    const b = renewalMessage("renew-7", member("2026-10-15"), biz);
    const renewed = renewalMessage("renew-7", member("2026-11-15"), biz);
    expect(a.dedupeKey).toBe(b.dedupeKey);
    expect(renewed.dedupeKey).not.toBe(a.dedupeKey);
    expect(a.to).toBe("919876543210");
    expect(a.body).toBe("Hi Aman, your Monthly membership at Royal Fitness Club ends on 15 Oct 2026. Renew in one tap to keep your spot: https://example.in/join?renew=tok");
    expect(a.params).toHaveLength(5);
    // The last-day reminder names the date, so it reads right on either day of its window.
    expect(renewalMessage("renew-1", member("2026-10-15"), biz).body).toContain("ends on 15 Oct 2026");
  });
  it("lead follow-ups on day 0, 2 and 5 while the lead is open", () => {
    const at = "2026-10-08T04:00:00Z";
    expect(kinds("2026-10-08", [], [lead(at)])).toEqual(["lead-0"]);
    expect(kinds("2026-10-10", [], [lead(at)])).toEqual(["lead-2"]);
    expect(kinds("2026-10-13", [], [lead(at)])).toEqual(["lead-5"]);
    expect(kinds("2026-10-20", [], [lead(at)])).toEqual([]);
    expect(kinds("2026-10-10", [], [lead(at, { status: "joined" })])).toEqual([]);
    expect(kinds("2026-10-10", [], [lead(at, { followUps: false })])).toEqual([]);
    // Lead at 23:00 IST on the 8th is a day-0 lead on the 8th, not the 9th.
    expect(kinds("2026-10-10", [], [lead("2026-10-08T17:30:00Z")])).toEqual(["lead-2"]);
  });
  it("skips numbers that can't receive WhatsApp", () => {
    expect(leadMessage("lead-0", lead("2026-10-08T04:00:00Z", { phone: "12345" }), biz)).toBeNull();
    expect(leadMessage("lead-0", lead("2026-10-08T04:00:00Z", { phone: "+91 98765-43210" }), biz)?.to).toBe("919876543210");
  });
  it("click-to-chat links encode the text", () => {
    expect(waLink("919876543210", "Hi & bye")).toBe("https://wa.me/919876543210?text=Hi%20%26%20bye");
  });
});

describe("diet chart intake", async () => {
  const { parseDietOrder, intakeToProfile } = await import("./diet-intake");
  const ok = { name: "Priya Verma", phone: "+91 98765 43210", email: "", age: "29", sex: "female", heightCm: 160, weightKg: "62.4", goal: "fat-loss", diet: "veg", cuisine: "south", activity: "light", mealsPerDay: 4, wakeTime: "07:15", conditions: ["pcos", "pcos", "made-up"], allergies: ["nuts"], notes: "  night   shifts ", consent: true };
  it("accepts a valid form and cleans it", () => {
    const r = parseDietOrder(ok);
    if (typeof r === "string") throw new Error(r);
    expect(r.buyer).toEqual({ name: "Priya Verma", phone: "9876543210", email: null, marketing: false });
    expect(r.intake).toMatchObject({ age: 29, sex: "female", heightCm: 160, weightKg: 62.4, cuisine: "south", mealsPerDay: 4, wakeTime: "07:15", conditions: ["pcos"], allergies: ["nuts"], notes: "night shifts" });
  });
  it("rejects what a coach can't plan safely", () => {
    expect(parseDietOrder({ ...ok, consent: false })).toMatch(/consent/);
    expect(parseDietOrder({ ...ok, age: 12 })).toMatch(/16 to 80/);
    expect(parseDietOrder({ ...ok, age: "29.5" })).toMatch(/age/);
    expect(parseDietOrder({ ...ok, heightCm: 5.4 })).toMatch(/centimetres/);
    expect(parseDietOrder({ ...ok, phone: "12345" })).toMatch(/mobile/);
    expect(parseDietOrder({ ...ok, goal: "bulk" })).toMatch(/every question/);
    expect(parseDietOrder({ ...ok, sex: "male", conditions: ["pregnant"] })).toMatch(/conditions/);
  });
  it("falls back to safe defaults for optional fields", () => {
    const r = parseDietOrder({ ...ok, cuisine: "mars", mealsPerDay: 9, wakeTime: "25:00" });
    if (typeof r === "string") throw new Error(r);
    expect(r.intake).toMatchObject({ cuisine: "any", mealsPerDay: 5, wakeTime: "06:30" });
  });
  it("maps to a Diet Calculator profile with the right diet style", async () => {
    const r = parseDietOrder(ok);
    if (typeof r === "string") throw new Error(r);
    const base = { style: "balanced", m: { waist: 90 }, overrides: {} } as never;
    const p = intakeToProfile("Priya", r.intake, base);
    expect(p).toMatchObject({ name: "Priya", sex: "female", style: "pcos", cuisine: "south", wakeTime: "07:15", m: {} });
    expect(p.conditions.pcos).toBe(true);
    expect(p.conditions.diabetes).toBe(false);
  });
});
