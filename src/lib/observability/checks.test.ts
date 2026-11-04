import { describe, expect, it } from "vitest";
import { evaluate, expectedSocialChannels, healthLines, type Snapshot } from "./checks";
import { alertDraft, publicStatus } from "./alerts";

const now = new Date("2026-10-25T08:00:00Z");
const ago = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();

const healthy = (): Snapshot => ({
  db: true,
  dailyRun: { at: ago(5), ok: true },
  reelRun: { at: ago(16), ok: true },
  healthSyncAt: ago(7),
  reconcile: { at: ago(5), recovered: 0, mismatched: [], errors: [] },
  razorpay: { paidOrders14d: 3, events14d: 3, flagged24h: 0 },
  whatsapp: { sent: 6, withStatus: 6, failed: 0, topFailCode: null },
  email: { sent: 19, bounced: 0, failedToSend: 0 },
  social: { date: "2026-10-24", missing: [], failed: [] },
});
const keys = (s: Snapshot) => evaluate(s, now).map((p) => p.key);

describe("site watchdog rules", () => {
  it("is quiet when everything ran and looks normal", () => {
    expect(evaluate(healthy(), now)).toEqual([]);
    expect(healthLines([])).toEqual(["All checks passed: schedules ran, payments and messages look normal."]);
  });

  it("reports only the database when it is unreachable (everything else would be noise)", () => {
    expect(keys({ ...healthy(), db: false, dailyRun: null })).toEqual(["db-down"]);
  });

  it("flags a daily job that missed a day, failed, or never ran", () => {
    expect(keys({ ...healthy(), dailyRun: { at: ago(27), ok: true } })).toEqual(["daily-run-stale"]);
    expect(keys({ ...healthy(), dailyRun: { at: ago(25), ok: true } })).toEqual([]);
    expect(keys({ ...healthy(), reelRun: { at: ago(2), ok: false, summary: "Instagram token expired" } })).toEqual(["reel-run-failed"]);
    expect(evaluate({ ...healthy(), reelRun: { at: ago(2), ok: false, summary: "Instagram token expired" } }, now)[0].detail).toContain("Instagram token expired");
    expect(keys({ ...healthy(), dailyRun: null })).toEqual(["daily-run-missing"]);
    expect(keys({ ...healthy(), healthSyncAt: ago(30) })).toEqual(["health-sync-stale"]);
    expect(keys({ ...healthy(), healthSyncAt: null })).toEqual(["health-sync-stale"]);
  });

  it("flags payment mismatches and payments only the nightly check found", () => {
    expect(keys({ ...healthy(), reconcile: { at: ago(5), recovered: 0, mismatched: ["order_1: amount differs"], errors: [] } })).toEqual(["payments-mismatch"]);
    expect(keys({ ...healthy(), reconcile: { at: ago(5), recovered: 2, mismatched: [], errors: [] } })).toEqual(["payments-recovered"]);
    // An old reconcile result was already reported on its day.
    expect(keys({ ...healthy(), reconcile: { at: ago(40), recovered: 2, mismatched: [], errors: [] } })).toEqual([]);
  });

  it("flags a silent Razorpay webhook (production on 24 Oct: 3 paid orders, 0 events) and refused deliveries", () => {
    expect(keys({ ...healthy(), razorpay: { paidOrders14d: 3, events14d: 0, flagged24h: 0 } })).toEqual(["razorpay-webhook-silent"]);
    expect(keys({ ...healthy(), razorpay: { paidOrders14d: 0, events14d: 0, flagged24h: 0 } })).toEqual([]);
    expect(keys({ ...healthy(), razorpay: { paidOrders14d: 3, events14d: 4, flagged24h: 1 } })).toEqual(["razorpay-webhook-errors"]);
  });

  it("flags a WhatsApp failure spike like 200 of 200 on 24 Oct, naming Meta's billing error", () => {
    const [p] = evaluate({ ...healthy(), whatsapp: { sent: 202, withStatus: 202, failed: 202, topFailCode: "131042" } }, now);
    expect(p.key).toBe("whatsapp-failures");
    expect(p.title).toBe("202 of 202 WhatsApp messages failed");
    expect(p.detail).toContain("payment method");
    expect(keys({ ...healthy(), whatsapp: { sent: 100, withStatus: 100, failed: 10, topFailCode: "131026" } })).toEqual([]);
  });

  it("flags Meta's delivery reports going quiet (198 sent with no status on 20 Oct)", () => {
    expect(keys({ ...healthy(), whatsapp: { sent: 198, withStatus: 0, failed: 0, topFailCode: null } })).toEqual(["meta-webhook-silent"]);
    expect(keys({ ...healthy(), whatsapp: { sent: 5, withStatus: 0, failed: 0, topFailCode: null } })).toEqual([]);
  });

  it("flags email send failures and bounce spikes", () => {
    expect(keys({ ...healthy(), email: { sent: 0, bounced: 0, failedToSend: 12 } })).toEqual(["email-failures"]);
    expect(keys({ ...healthy(), email: { sent: 40, bounced: 10, failedToSend: 0 } })).toEqual(["email-bounces"]);
    expect(keys({ ...healthy(), email: { sent: 100, bounced: 4, failedToSend: 0 } })).toEqual([]);
  });
});

describe("social posts watchdog", () => {
  it("expects the Reel and Story every day, and the month plan's six extra posts only inside the plan", () => {
    const on = { instagram: true, facebook: true, monthPlan: true };
    expect(expectedSocialChannels("2026-10-31", on)).toEqual(["instagram", "facebook", "instagram-story"]);
    expect(expectedSocialChannels("2026-11-01", on)).toEqual([
      "instagram", "facebook", "instagram-story",
      "instagram-am", "facebook-am", "instagram-pm", "facebook-pm", "instagram-reel2", "facebook-reel2",
    ]);
    expect(expectedSocialChannels("2026-12-01", on)).toHaveLength(3);
    // SOCIAL_MONTH_PLAN=off, or a channel without a token, isn't expected to post.
    expect(expectedSocialChannels("2026-11-01", { ...on, monthPlan: false })).toEqual(["instagram", "facebook", "instagram-story"]);
    expect(expectedSocialChannels("2026-11-01", { instagram: false, facebook: true, monthPlan: true })).toEqual(["facebook", "facebook-am", "facebook-pm", "facebook-reel2"]);
  });

  it("flags yesterday's posts that failed even after the retries, naming Meta's error", () => {
    const [p] = evaluate({ ...healthy(), social: { date: "2026-11-01", missing: [], failed: [{ channel: "instagram-am", error: "Error validating access token: Session has expired" }] } }, now);
    expect(p.key).toBe("social-posts-failed");
    expect(p.title).toBe("1 Instagram/Facebook post failed on 2026-11-01");
    expect(p.detail).toContain("instagram-am");
    expect(p.detail).toContain("Session has expired");
    expect(p.fix).toContain("token");
  });

  it("flags posts that never ran (a schedule that didn't fire leaves no record at all)", () => {
    const [p] = evaluate({ ...healthy(), social: { date: "2026-11-01", missing: ["instagram-reel2", "facebook-reel2"], failed: [] } }, now);
    expect(p.key).toBe("social-posts-missing");
    expect(p.title).toBe("2 Instagram/Facebook posts didn't go out on 2026-11-01");
    expect(p.detail).toContain("instagram-reel2, facebook-reel2");
  });
});

describe("alert email", () => {
  it("goes to the owner once per problem per India day, with the fix", () => {
    const [p] = evaluate({ ...healthy(), dailyRun: { at: ago(30), ok: true } }, now);
    const d = alertDraft(p, "owner@example.com", "2026-10-25", "https://www.royalfitnesclub.in/admin/growth");
    expect(d.channel).toBe("email");
    expect(d.kind).toBe("admin-alert");
    expect(d.dedupeKey).toBe("admin-alert:daily-run-stale:2026-10-25");
    expect(d.subject).toMatch(/^Site alert: /);
    expect(d.body).toContain("What to do:");
  });

  it("tells the public only problem keys, never details", () => {
    expect(publicStatus([])).toEqual({ ok: true, failing: [] });
    const problems = evaluate({ ...healthy(), reconcile: { at: ago(5), recovered: 0, mismatched: ["order_X: secret detail"], errors: [] } }, now);
    expect(JSON.stringify(publicStatus(problems))).not.toContain("order_X");
    expect(publicStatus(problems)).toEqual({ ok: false, failing: ["payments-mismatch"] });
  });
});
