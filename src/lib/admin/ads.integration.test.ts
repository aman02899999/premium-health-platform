// Ads Manager on a real Postgres:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/admin/ads.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("ads on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let ads: typeof import("./ads");

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    pool = (await import("@/health/db")).pool;
    ads = await import("./ads");
  });
  beforeEach(async () => {
    await pool.query("truncate public.ad_campaigns, public.leads, public.membership_orders, public.diet_orders, public.shop_orders, public.book_orders, public.payment_requests cascade");
  });
  afterAll(async () => {
    await pool.end();
  });

  it("create, validate, unique tags", async () => {
    const a = await ads.createAd({ name: "Diwali Offer", platform: "meta", landing: "/membership", spend: "₹2,000" }, "admin");
    expect(a).toMatchObject({ ok: true, slug: "diwali-offer" });
    const b = await ads.createAd({ name: "Diwali offer!", platform: "meta", landing: "/membership" }, "admin");
    expect(b.ok && b.slug).toMatch(/^diwali-offer-\d{4}$/);
    expect(await ads.createAd({ name: "x", platform: "tv", landing: "/membership" }, "admin")).toMatchObject({ ok: false });
    expect(await ads.createAd({ name: "Ok name", platform: "meta", landing: "https://evil.example" }, "admin")).toMatchObject({ ok: false });
    expect((await ads.listAds()).find((x) => x.slug === "diwali-offer")?.spendPaise).toBe(200000);
  });

  it("results: WhatsApp-ad leads, tagged web leads, their later orders, tagged orders; nothing else", async () => {
    await ads.createAd({ name: "Diwali offer", platform: "meta", landing: "/membership", spend: 5000 }, "admin");
    const tag = (campaign: string) => JSON.stringify({ first: { source: "facebook", medium: "paid", campaign }, last: { source: "facebook", medium: "paid", campaign } });
    await pool.query(`insert into public.leads (name, phone, source, created_at) values ('Chat Lead', '9811111111', 'ad:diwali-offer', now() - interval '2 days')`);
    await pool.query(`insert into public.leads (name, phone, source, attribution) values ('Web Lead', '9822222222', 'home', $1)`, [tag("diwali-offer")]);
    await pool.query(`insert into public.leads (name, phone, source) values ('Other Lead', '9833333333', 'home')`);
    await pool.query(
      `insert into public.membership_orders (razorpay_order_id, status, plan_id, plan_name, duration, amount_paise, refunded_paise, name, phone, paid_at, attribution) values
        ('o1', 'paid', 'm', 'Quarterly', '3 months', 600000, 0, 'Chat Lead', '+91 98111 11111', now() - interval '1 day', null),
        ('o2', 'paid', 'm', 'Monthly', '1 month', 200000, 50000, 'Stranger', '9844444444', now(), $1),
        ('o3', 'paid', 'm', 'Monthly', '1 month', 200000, 0, 'Other Lead', '9833333333', now(), null),
        ('o4', 'paid', 'm', 'Monthly', '1 month', 200000, 0, 'Too early', '9811111111', now() - interval '5 days', null)`,
      [tag("diwali-offer")],
    );
    const a = (await ads.listAds())[0];
    expect(a).toMatchObject({ leads: 2, orders: 2, netPaise: 600000 + 150000, spendPaise: 500000 });
  });

  it("update spend and end/restart", async () => {
    const r = (await ads.createAd({ name: "Google search", platform: "google", landing: "/contact#trial" }, "admin")) as { id: string };
    expect(await ads.updateAd(r.id, { spend: "1,250" })).toBeNull();
    expect(await ads.updateAd(r.id, { spend: "lots" })).toMatch(/number/);
    await ads.updateAd(r.id, { active: false });
    let a = (await ads.listAds())[0];
    expect(a).toMatchObject({ spendPaise: 125000, active: false });
    expect(a.endOn).not.toBeNull();
    await ads.updateAd(r.id, { active: true });
    a = (await ads.listAds())[0];
    expect(a).toMatchObject({ active: true, endOn: null });
  });

  it("only real tags become a lead source", async () => {
    await ads.createAd({ name: "Diwali offer", platform: "meta", landing: "/membership" }, "admin");
    expect(await ads.adLeadSource("diwali-offer")).toBe("ad:diwali-offer");
    expect(await ads.adLeadSource("made-up")).toBeNull();
    expect(await ads.adLeadSource(null)).toBeNull();
  });
});
