// Revenue report and attribution storage on Postgres:
//   TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5433/rfc_test npx vitest run src/lib/revenue
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { mergeTouch, touchFrom, type Attribution } from "@/lib/attribution";

vi.mock("server-only", () => ({}));

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("revenue report", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let report: typeof import("./report");
  let store: typeof import("@/lib/attribution-store");

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    pool = (await import("@/health/db")).pool;
    report = await import("./report");
    store = await import("@/lib/attribution-store");
  });
  beforeEach(async () => {
    await pool.query("truncate public.leads, public.membership_orders, public.diet_orders, public.shop_orders, public.book_orders, public.payment_requests cascade");
  });
  afterAll(async () => {
    await pool.end();
  });

  const touch = (q: string, at: string) => touchFrom(new URL(`https://royalfitness.in/?${q}`), "", "royalfitness.in", new Date(at))!;
  const insta: Attribution = mergeTouch(null, touch("utm_source=instagram&utm_medium=cpc&utm_campaign=diwali", "2026-10-01T00:00:00Z"))!;
  const wa: Attribution = mergeTouch(insta, touch("utm_source=whatsapp&utm_campaign=restock", "2026-10-05T00:00:00Z"))!;

  const membership = (rzp: string, phone: string, paise: number, paidAt: string | null, status = "paid") =>
    pool.query(
      `insert into public.membership_orders (razorpay_order_id, status, plan_id, plan_name, duration, amount_paise, name, phone, created_at, paid_at) values ($1, $2, 'monthly', 'Monthly', '1 month', $3, 'Buyer', $4, coalesce($5::timestamptz, '2026-10-15T06:00:00Z'), $5)`,
      [rzp, status, paise, phone, paidAt],
    );

  it("stores attribution once and never overwrites it", async () => {
    const { rows } = await pool.query<{ id: string }>(`insert into public.leads (name, phone, source, status) values ('Asha', '9000000201', 'website', 'new') returning id`);
    await store.saveAttribution("lead", rows[0].id, insta);
    await store.saveAttribution("lead", rows[0].id, wa);
    await store.saveAttribution("lead", rows[0].id, null);
    const saved = (await pool.query(`select attribution from public.leads`)).rows[0].attribution;
    expect(saved).toEqual(JSON.parse(JSON.stringify(insta)));

    await membership("order_m1", "9000000201", 150000, null, "created");
    await store.saveAttribution("membership", "order_m1", wa);
    expect((await pool.query(`select attribution->'last'->>'channel' as c from public.membership_orders`)).rows[0].c).toBe("messaging");
    // A failure (no such table row is fine; a bad target id type is swallowed and logged).
    await expect(store.attributeFromRequest(new Request("https://x.in", { headers: { cookie: "rfc_attr=garbage" } }), "shop", "nope")).resolves.toBeUndefined();
  });

  it("reports collected, refunded and net money by product and channel, in IST days", async () => {
    // 18 Oct 23:00 IST = 17:30 UTC: inside a period ending 18 Oct.
    await membership("order_a", "+91 90000 00301", 150000, "2026-10-18T17:30:00Z");
    // 19 Oct 00:30 IST = 18 Oct 19:00 UTC: outside it.
    await membership("order_b", "9000000302", 200000, "2026-10-18T19:00:00Z");
    await membership("order_c", "9000000303", 99900, null, "created");
    await pool.query(`update public.membership_orders set attribution = $1 where razorpay_order_id = 'order_a'`, [JSON.stringify(wa)]);
    await pool.query(
      `insert into public.shop_orders (number, razorpay_order_id, status, name, email, phone, address, items, list_total, discount_total, total, refunded_paise, paid_at, created_at)
       values ('RS-REV001', 'order_s', 'paid', 'Ravi', 'ravi@example.com', '9000000301', '{}', '[]', 2000, 0, 2000, 50000, '2026-10-10T06:00:00Z', '2026-10-10T05:00:00Z')`,
    );
    // 9000000302 paid in August too, so their October order makes them a returning buyer.
    await membership("order_old", "9000000302", 100000, "2026-08-01T06:00:00Z");
    await membership("order_d", "9000000302", 100000, "2026-10-12T06:00:00Z");
    await pool.query(`insert into public.leads (name, phone, source, status, created_at, attribution) values ('Lead A', '90000 00301', 'website', 'new', '2026-10-09T06:00:00Z', $1), ('Lead B', '9000000399', 'website', 'new', '2026-10-09T06:00:00Z', null)`, [JSON.stringify(insta)]);

    const r = await report.revenueReport({ from: "2026-10-01", to: "2026-10-18" });
    const line = (k: string) => r.lines.find((l) => l.line === k)!;
    expect(line("membership")).toMatchObject({ orders: 2, grossPaise: 250000, refundedPaise: 0, netPaise: 250000 });
    expect(line("shop")).toMatchObject({ orders: 1, grossPaise: 200000, refundedPaise: 50000, netPaise: 150000 });
    expect(line("diet").orders).toBe(0);
    expect(r.totals).toMatchObject({ orders: 3, grossPaise: 450000, refundedPaise: 50000, netPaise: 400000, averageOrderPaise: 150000, pendingOrders: 1, failedOrders: 0 });
    expect(r.buyers).toMatchObject({ total: 2, returning: 1 });
    expect(r.leads).toMatchObject({ total: 2, converted: 1, conversionRate: 0.5, attributed: 1 });
    expect(r.byLastChannel.find((c) => c.key === "messaging")).toMatchObject({ orders: 1, netPaise: 150000, leads: 0 });
    expect(r.byFirstChannel.find((c) => c.key === "paid")).toMatchObject({ leads: 1, orders: 1, netPaise: 150000 });
    expect(r.byFirstChannel.find((c) => c.key === "unknown")).toMatchObject({ leads: 1, orders: 2, netPaise: 250000 });
    expect(r.byCampaign.find((c) => c.key === "diwali")).toMatchObject({ orders: 1 });
    expect(r.unavailable.length).toBeGreaterThan(0);
  });

  it("gives no average or rates when there is nothing to divide by", async () => {
    const r = await report.revenueReport({ from: "2026-10-01", to: "2026-10-18" });
    expect(r.totals.averageOrderPaise).toBeNull();
    expect(r.leads.conversionRate).toBeNull();
    expect(r.buyers.returningRate).toBeNull();
  });

  it("parses a period safely", () => {
    expect(report.parsePeriod(null, null, "2026-10-19")).toEqual({ from: "2026-09-20", to: "2026-10-19" });
    expect(report.parsePeriod("2026-10-01", "2026-12-01", "2026-10-19")).toEqual({ from: "2026-10-01", to: "2026-10-19" });
    expect(report.parsePeriod("2024-01-01", "2026-10-19", "2026-10-19").from).toBe("2026-09-20");
    expect(report.parsePeriod("2026-10-10", "2026-10-05", "2026-10-19")).toEqual({ from: "2026-09-06", to: "2026-10-05" });
  });
});
