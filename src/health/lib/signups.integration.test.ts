// Real-database test; see src/lib/growth/db.integration.test.ts for how to run it.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("health sign-ups are stored durably", () => {
  let s: typeof import("./signups");
  let pool: import("pg").Pool;
  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    pool = (await import("@/health/db")).pool;
    s = await import("./signups");
    await pool.query("truncate public.marketing_contacts, public.push_subscriptions, public.affiliate_clicks, public.health_referrals");
  });
  afterAll(async () => {
    await pool.end();
  });

  it("contacts dedupe per channel and re-subscribe after an opt-out", async () => {
    expect(await s.saveContact("email", "a@b.in", { utm_source: "google" })).toBe("added");
    expect(await s.saveContact("email", "a@b.in", {})).toBe("exists");
    expect(await s.saveContact("whatsapp", "919876543210", {})).toBe("added");
    await pool.query("update public.marketing_contacts set unsubscribed_at = now() where address = 'a@b.in'");
    expect((await s.contactStats()).email).toBe(0);
    await s.saveContact("email", "a@b.in", {});
    const stats = await s.contactStats();
    expect(stats).toMatchObject({ email: 1, whatsapp: 1 });
    expect(stats.recent.find((r) => r.address === "a@b.in")?.source).toBe("google");
  });

  it("affiliate clicks, push subscriptions and referrals", async () => {
    await s.saveAffiliateClick("glucometer", { utm_source: "blog" });
    await s.saveAffiliateClick("glucometer", {});
    await s.saveAffiliateClick("bp-monitor", {});
    expect(await s.affiliateClickStats(null)).toEqual({ total: 3, byProduct: { glucometer: 2, "bp-monitor": 1 } });
    expect((await s.affiliateClickStats("glucometer")).total).toBe(2);
    await s.savePushSubscription("https://push.example/abc123456789", { p256dh: "k", auth: "a" }, null);
    await s.savePushSubscription("https://push.example/abc123456789", { p256dh: "k2", auth: "a" }, null);
    expect(await s.countPushSubscriptions()).toBe(1);
    expect(await s.saveReferral("me@x.in", "friend@x.in")).toBe(true);
    expect(await s.saveReferral("me@x.in", "friend@x.in")).toBe(false);
    expect(await s.referralsBy("me@x.in")).toHaveLength(1);
    await expect(s.saveReferral("me@x.in", "me@x.in")).rejects.toThrow();
  });
});
