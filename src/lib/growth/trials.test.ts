import { describe, expect, it } from "vitest";
import { adminDigest } from "./admin-digest";
import { TEMPLATES, dueMessages, isMarketingKind, trialBookedEmail, trialMessage, type LeadLike } from "./messages";
import { newLeadAlert, uncontactedAlert } from "./lead-alerts";
import { biggestLeak, funnelLines, funnelTotals } from "./funnel";
import { coversDay, formatTrial, parseTrialSlot, toInstant, trialSlots, trialStage } from "./trials";

const HOURS = [
  { days: "Monday – Saturday", open: "05:30", close: "11:00" },
  { days: "Monday – Saturday", open: "16:00", close: "22:00" },
];
const ist = (date: string, time: string) => new Date(toInstant(date, time));
const biz = { name: "Royal Fitness Club", phone: "+91 88518 30081", siteUrl: "https://example.in", mapsUrl: "https://maps.example/rfc" };
const lead = (o: Partial<LeadLike> = {}): LeadLike => ({ id: "l1", name: "Rahul Verma", phone: "9876543210", createdAt: "2026-10-19T05:00:00Z", status: "new", followUps: true, trialAt: null, showedUp: null, ...o });

describe("trial slots", () => {
  it("reads the opening days the admin typed", () => {
    expect([0, 1, 6].map((d) => coversDay("Monday – Saturday", d))).toEqual([false, true, true]);
    expect([0, 3].map((d) => coversDay("Daily", d))).toEqual([true, true]);
    expect([0, 1].map((d) => coversDay("Sunday", d))).toEqual([true, false]);
    expect([5, 6].map((d) => coversDay("Mon-Fri", d))).toEqual([true, false]);
  });
  it("offers hourly times inside opening hours, skips Sunday, and today only 2+ hours ahead", () => {
    // Monday 19 Oct 2026, 3:10 PM India time.
    const slots = trialSlots(HOURS, ist("2026-10-19", "15:10"));
    expect(slots[0]).toEqual({ date: "2026-10-19", label: "Today, Mon, 19 Oct", times: ["18:00", "19:00", "20:00", "21:00"] });
    expect(slots[1].times).toEqual(["06:00", "07:00", "08:00", "09:00", "10:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"]);
    expect(slots.map((s) => s.date)).not.toContain("2026-10-25"); // Sunday
    expect(slots.length).toBe(6);
  });
  it("accepts only a slot that is still open", () => {
    const now = ist("2026-10-19", "15:10");
    expect(parseTrialSlot("2026-10-20", "18:00", HOURS, now)).toBe("2026-10-20T12:30:00.000Z");
    expect(parseTrialSlot("2026-10-19", "16:00", HOURS, now)).toBeNull(); // under 2 hours away
    expect(parseTrialSlot("2026-10-20", "12:00", HOURS, now)).toBeNull(); // closed
    expect(parseTrialSlot("2026-10-25", "18:00", HOURS, now)).toBeNull(); // Sunday
    expect(parseTrialSlot(["x"], "18:00", HOURS, now)).toBeNull();
  });
  it("formats the time in India time", () => {
    expect(formatTrial("2026-10-20T12:30:00.000Z")).toBe("Tue, 20 Oct, 6:00 PM");
  });
});

describe("trial messages", () => {
  const at = toInstant("2026-10-21", "18:00");
  const kinds = (today: string, l: LeadLike) => dueMessages(today, [], [l], biz).map((d) => d.kind);

  it("confirms the booking with the time and directions", () => {
    const d = trialMessage("trial-booked", { ...lead(), trialAt: at }, biz)!;
    expect(d.template).toBe("rfc_trial_booked_v1");
    expect(d.to).toBe("919876543210");
    expect(d.body).toBe("Hi Rahul, your free trial at Royal Fitness Club is booked for Wed, 21 Oct, 6:00 PM. Directions: https://maps.example/rfc. To change the time, reply to this message.");
    const e = trialBookedEmail({ id: "l1", name: "Rahul", email: "R@X.in", trialAt: at }, { ...biz, address: "Gejha, Noida" });
    expect(e).toMatchObject({ channel: "email", to: "r@x.in", kind: "trial-booked-email", subject: "Your free trial: Wed, 21 Oct, 6:00 PM" });
  });
  it("replaces the 'please book' reminders: only a reminder on the day while booked", () => {
    const l = lead({ trialAt: at });
    expect(kinds("2026-10-20", l)).toEqual([]);
    expect(kinds("2026-10-21", l)).toEqual(["trial-today"]);
    expect(dueMessages("2026-10-21", [], [l], biz)[0].body).toContain("see you today at 6:00 PM");
    expect(kinds("2026-10-22", l)).toEqual([]); // nobody marked the visit: no guessing
  });
  it("no-show gets a rebooking link; came gets the plans on day 1–3 and a last nudge on day 4–7", () => {
    expect(kinds("2026-10-22", lead({ trialAt: at, showedUp: false }))).toEqual(["trial-missed"]);
    expect(kinds("2026-10-27", lead({ trialAt: at, showedUp: false }))).toEqual([]);
    const came = lead({ trialAt: at, status: "trial", showedUp: true });
    expect(["2026-10-21", "2026-10-22", "2026-10-24", "2026-10-25", "2026-10-28", "2026-10-29"].map((d) => kinds(d, came))).toEqual([[], ["trial-join"], ["trial-join"], ["trial-join-last"], ["trial-join-last"], []]);
  });
  it("stops once they join, are closed, or follow-ups are off", () => {
    for (const o of [{ status: "joined" }, { status: "lost" }, { followUps: false, status: "trial" }]) expect(kinds("2026-10-22", lead({ trialAt: at, showedUp: true, ...o }))).toEqual([]);
  });
  it("keys include the trial time, so a rebooked trial is confirmed and reminded again", () => {
    const a = trialMessage("trial-today", { ...lead(), trialAt: at }, biz)!;
    const b = trialMessage("trial-today", { ...lead(), trialAt: toInstant("2026-10-23", "07:00") }, biz)!;
    expect(a.dedupeKey).not.toBe(b.dedupeKey);
  });
  it("visit reminders are Utility; after-trial selling is Marketing", () => {
    expect(["trial-booked", "trial-today", "trial-missed"].some(isMarketingKind)).toBe(false);
    expect(["trial-join", "trial-join-last"].every(isMarketingKind)).toBe(true);
    const vars = (t: string) => new Set(t.match(/\{\{\d+\}\}/g)).size;
    for (const k of ["trial-booked", "trial-today", "trial-missed", "trial-join", "trial-join-last"] as const) expect(trialMessage(k, { ...lead(), trialAt: at }, biz)!.params, k).toHaveLength(vars(TEMPLATES[k].text));
  });
  it("reads the stage from what the desk marked", () => {
    expect(trialStage({ status: "new", trialAt: at, showedUp: null }, "2026-10-21")).toBe("booked");
    expect(trialStage({ status: "new", trialAt: at, showedUp: null }, "2026-10-22")).toBe("unmarked");
    expect(trialStage({ status: "contacted", trialAt: at, showedUp: false }, "2026-10-22")).toBe("no-show");
    expect(trialStage({ status: "trial", trialAt: at, showedUp: null }, "2026-10-22")).toBe("came");
    expect(trialStage({ status: "new", trialAt: null, showedUp: null }, "2026-10-22")).toBeNull();
  });
});

describe("morning email: trials", () => {
  it("lists today's trials and asks the desk to mark earlier ones", () => {
    const d = adminDigest(
      "2026-10-21",
      { leads: [], trials: [{ name: "Neha", at: toInstant("2026-10-20", "07:00") }, { name: "Rahul", at: toInstant("2026-10-21", "18:00") }], payments: [], plansToReview: [], clientUpdates: 0, unanswered: [], expiringMembers: [], failedMessages: 0 },
      "admin@example.com",
      "https://example.in/admin/growth",
    );
    expect(d.subject).toContain("1 need you");
    expect(d.body).toContain("Did Neha come for the trial on Tue, 20 Oct, 7:00 AM? Mark Came or No-show in Leads");
    expect(d.body).toContain("TRIALS TODAY (1)\n• 6:00 PM: Rahul");
  });
});

describe("speed to lead", () => {
  const l = { id: "l9", name: "Rahul Verma", phone: "98765 43210", goal: "Fat loss", message: "Knee pain", source: "home", trialAt: toInstant("2026-10-21", "18:00"), createdAt: "2026-10-19T10:00:00Z" };
  it("the instant alert carries the details and a ready WhatsApp reply", () => {
    const d = newLeadAlert(l, "coach@x.in", "Royal Fitness Club", "https://example.in/admin/growth");
    expect(d).toMatchObject({ channel: "email", to: "coach@x.in", kind: "admin-lead-alert", subject: "New lead: Rahul Verma, trial Wed, 21 Oct, 6:00 PM", dedupeKey: "admin-lead-alert:l9" });
    expect(d.body).toContain("• Note: \"Knee pain\"");
    expect(d.body).toMatch(/\[\[CTA:WhatsApp Rahul now\|https:\/\/wa\.me\/919876543210\?text=Hi%20Rahul/);
    expect(newLeadAlert({ ...l, trialAt: null }, "c@x.in", "RFC", "u").subject).toBe("New lead: Rahul Verma, wants a call");
  });
  it("the evening list goes out once a day and only when someone is waiting", () => {
    const now = new Date("2026-10-19T13:20:00Z");
    expect(uncontactedAlert([], "c@x.in", "RFC", "u", now, "2026-10-19")).toBeNull();
    const d = uncontactedAlert([l, { ...l, id: "l10", name: "Neha", trialAt: null }], "c@x.in", "RFC", "u", now, "2026-10-19")!;
    expect(d.subject).toBe("2 leads still waiting for you");
    expect(d.dedupeKey).toBe("admin-lead-escalation:2026-10-19");
    expect(d.body).toContain("• Rahul Verma, 98765 43210, waiting 3 h 20 min, trial Wed, 21 Oct, 6:00 PM");
  });
  it("the morning email flags leads nobody has contacted", () => {
    const d = adminDigest("2026-10-21", { leads: [], uncontacted: 2, payments: [], plansToReview: [], clientUpdates: 0, unanswered: [], expiringMembers: [], failedMessages: 0 }, "a@x.in", "u");
    expect(d.body).toContain("2 leads have had no call or message yet (Leads → New)");
  });
});

describe("funnel scoreboard", () => {
  const rows = [
    { source: "home", leads: 20, booked: 12, came: 6, joined: 3, onlineRupees: 4500 },
    { source: "whatsapp-inbound", leads: 5, booked: 0, came: 0, joined: 1, onlineRupees: 0 },
  ];
  it("totals the sources and names the weakest step", () => {
    expect(funnelTotals(rows)).toEqual({ source: "All", leads: 25, booked: 12, came: 6, joined: 4, onlineRupees: 4500 });
    expect(biggestLeak(funnelTotals(rows))).toBe("Only 48% of leads book a trial. Call new leads within minutes and offer two times.");
    expect(biggestLeak({ ...funnelTotals(rows), leads: 9 })).toBeNull(); // too few to judge
  });
  it("reads as one line per source in the Monday email", () => {
    const lines = funnelLines(rows);
    expect(lines[0]).toBe("All sources: 25 leads → 12 booked (48%) → 6 came → 4 joined (16%), ₹4,500 online");
    expect(lines[1]).toBe("Website: home page form: 20 leads → 12 booked (60%) → 6 came → 3 joined (15%), ₹4,500 online");
    expect(lines[2]).toBe("WhatsApp chat: 5 leads → 0 booked (0%) → 0 came → 1 joined (20%)");
    expect(funnelLines([])).toEqual([]);
  });
});
