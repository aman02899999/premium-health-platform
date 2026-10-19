// The sales emails inside the real daily run, on Postgres:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/growth/sales.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/content/store", () => ({
  getContent: async () => ({ business: { name: "Royal Fitness Club", phone: "+91 88518 30081", address: { street: "Main Road, Gejha Village", locality: "Sector 93", city: "Noida", postalCode: "201304" } } }),
}));

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("sales automation in the daily run", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let daily: typeof import("./daily");

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    for (const k of ["WHATSAPP_TOKEN", "RESEND_API_KEY", "EMAIL_FROM", "INSTAGRAM_ACCESS_TOKEN", "FACEBOOK_PAGE_ID", "FACEBOOK_PAGE_TOKEN", "COACH_EMAIL"]) delete process.env[k];
    pool = (await import("@/health/db")).pool;
    daily = await import("./daily");
  });
  beforeEach(async () => {
    await pool.query("truncate public.message_outbox, public.diet_orders, public.book_orders, public.shop_orders, public.membership_orders, public.members, public.shop_products, public.marketing_contacts, public.social_posts cascade");
  });
  afterAll(async () => {
    await pool.end();
  });

  const NOW = new Date("2026-10-21T02:15:00Z"); // a Wednesday morning in India
  const ago = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();
  const diet = (rzp: string, o: { email?: string | null; phone?: string; status?: string; hours: number; plan?: string }) =>
    pool.query(
      `insert into public.diet_orders (razorpay_order_id, status, amount_paise, name, phone, email, intake, consent_at, plan, created_at)
       values ($1, $2, 299900, 'Asha Rao', $3, $4, '{}'::jsonb, now(), $5, $6)`,
      [rzp, o.status ?? "created", o.phone ?? "9876543210", o.email === undefined ? "asha@example.com" : o.email, o.plan ?? "3m", ago(o.hours)],
    );
  // remind: the buyer ticked "remind me if my payment doesn't go through".
  const book = (rzp: string, email: string, hours: number, status = "created", remind = true) =>
    pool.query(
      `insert into public.book_orders (razorpay_order_id, status, item_id, title, slugs, amount_paise, name, email, phone, access_token, created_at, reminder_consent_at)
       values ($1, $2, '01-foundations-of-strength', 'Vol. 1 · The Foundations of Strength', '{01-foundations-of-strength}', 69900, 'Ravi Kumar', $3, '9123456780', $4, $5, case when $6 then now() end)`,
      [rzp, status, email, `tok-${rzp}`, ago(hours), remind],
    );
  const consent = (...emails: string[]) =>
    pool.query(`insert into public.marketing_contacts (channel, address, source, consent_at) select 'email', unnest($1::text[]), 'diet-checkout', now()`, [emails]);
  const outbox = async () => (await pool.query(`select kind, to_address, subject from public.message_outbox order by kind, to_address`)).rows;

  it("reminds people who didn't finish paying, once, and nobody else", async () => {
    await diet("d-abandoned", { hours: 5 }); // reminded
    await diet("d-too-new", { hours: 1, email: "new@example.com", phone: "9000000001" }); // still deciding
    await diet("d-too-old", { hours: 100, email: "old@example.com", phone: "9000000002" }); // long gone
    await diet("d-no-email", { hours: 5, email: null, phone: "9000000003" });
    await diet("d-paid-later", { hours: 6, email: "paid@example.com", phone: "9000000004" });
    await diet("d-paid", { hours: 4, email: "paid@example.com", phone: "9000000004", status: "paid" });
    await diet("d-unsub", { hours: 5, email: "gone@example.com", phone: "9000000005" });
    await pool.query(`insert into public.marketing_contacts (channel, address, source, consent_at, unsubscribed_at) values ('email', 'gone@example.com', 'unsubscribe', now(), now())`);
    await diet("d-no-consent", { hours: 5, email: "quiet@example.com", phone: "9000000006" }); // never ticked the marketing box
    await consent("asha@example.com", "new@example.com", "old@example.com", "paid@example.com");
    await book("b-abandoned", "ravi@example.com", 30);
    await book("b-paid-later", "reader@example.com", 30);
    await book("b-paid", "reader@example.com", 20, "paid");
    await book("b-no-tick", "silent@example.com", 30, "created", false);

    const out = await daily.runDaily(NOW);
    expect(out.story).toBe("off"); // Instagram not configured in tests
    const rows = (await outbox()).filter((r) => r.kind === "nurture-checkout");
    expect(rows).toEqual([
      { kind: "nurture-checkout", to_address: "asha@example.com", subject: "Asha, your 3-Month Transformation is one step away" },
      { kind: "nurture-checkout", to_address: "ravi@example.com", subject: "Ravi, your The Foundations of Strength is one step away" },
    ]);

    // Six hours later: the order that was too new is now 7 hours old and gets its reminder;
    // nobody already reminded gets a second one.
    await daily.runDaily(new Date(NOW.getTime() + 6 * 3_600_000));
    const after = async () => (await outbox()).filter((r) => r.kind === "nurture-checkout").map((r) => r.to_address);
    expect(await after()).toEqual(["asha@example.com", "new@example.com", "ravi@example.com"]);
    // Asha starts another checkout the next day and stops again: still no second email (14-day rule).
    await diet("d-again", { hours: -20 });
    await daily.runDaily(new Date(NOW.getTime() + 26 * 3_600_000));
    expect(await after()).toEqual(["asha@example.com", "new@example.com", "ravi@example.com"]);
  });

  it("reminds supplement shoppers too, but never to buy something out of stock or cancelled", async () => {
    const product = async (slug: string, stock: number, active = true) =>
      (await pool.query<{ id: string }>(`insert into public.shop_products (slug, name, list_price, stock, active) values ($1, $2, 2000, $3, $4) returning id`, [slug, `Whey ${slug}`, stock, active])).rows[0].id;
    const inStock = await product("whey-a", 5);
    const soldOut = await product("whey-b", 0);
    const shop = (n: string, email: string, phone: string, items: { id: string; slug: string; qty?: number }[], hours: number, o: { status?: string; fulfilment?: string; remind?: boolean } = {}) =>
      pool.query(
        `insert into public.shop_orders (number, razorpay_order_id, status, fulfilment, name, email, phone, address, items, list_total, discount_total, total, created_at, reminder_consent_at)
         values ($1, $2, $3, $4, 'Kiran Shah', $5, $6, '{}', $7, 2000, 0, 2000, $8, case when $9 then now() end)`,
        [`RS-${n}`, `s-${n}`, o.status ?? "created", o.fulfilment ?? "new", email, phone, JSON.stringify(items.map((i) => ({ kind: "product", id: i.id, slug: i.slug, name: `Whey ${i.slug}`, qty: i.qty ?? 1, unitList: 2000, unitPrice: 2000 }))), ago(hours), o.remind ?? true],
      );
    await shop("ABC001", "kiran@example.com", "9000000101", [{ id: inStock, slug: "whey-a" }], 5); // reminded
    await shop("ABC002", "soldout@example.com", "9000000102", [{ id: soldOut, slug: "whey-b" }], 5);
    await shop("ABC003", "toomany@example.com", "9000000103", [{ id: inStock, slug: "whey-a", qty: 9 }], 5);
    await shop("ABC004", "cancel@example.com", "9000000104", [{ id: inStock, slug: "whey-a" }], 5, { fulfilment: "cancelled" });
    await shop("ABC005", "bought@example.com", "9000000105", [{ id: inStock, slug: "whey-a" }], 6);
    await shop("ABC006", "bought@example.com", "9000000105", [{ id: inStock, slug: "whey-a" }], 5, { status: "paid" });
    await shop("ABC007", "notick@example.com", "9000000106", [{ id: inStock, slug: "whey-a" }], 5, { remind: false });

    await daily.runDaily(NOW);
    const rows = (await pool.query(`select to_address, subject, body, dedupe_key from public.message_outbox where kind = 'nurture-checkout'`)).rows;
    expect(rows.map((r) => r.to_address)).toEqual(["kiran@example.com"]);
    expect(rows[0].subject).toBe("Kiran, your Whey whey-a is one step away");
    expect(rows[0].body).toContain("/shop/p/whey-a?utm_source=email");
    expect(rows[0].dedupe_key).toMatch(/^checkout:shop:/);
  });

  it("reminds first-time membership buyers who asked: by email, or on WhatsApp when they left no email", async () => {
    const membership = (rzp: string, o: { email?: string | null; phone: string; hours: number; remind?: boolean; status?: string; couple?: boolean }) =>
      pool.query(
        `insert into public.membership_orders (razorpay_order_id, status, plan_id, plan_name, duration, couple, amount_paise, name, phone, email, created_at, reminder_consent_at)
         values ($1, $2, 'quarterly', 'Quarterly', '3 months', $3, 450000, 'Neha Gupta', $4, $5, $6, case when $7 then now() end)`,
        [rzp, o.status ?? "created", o.couple ?? false, o.phone, o.email ?? null, ago(o.hours), o.remind ?? true],
      );
    await membership("m-email", { email: "neha@example.com", phone: "9000000201", hours: 5 }); // email reminder
    await membership("m-phone", { phone: "9000000202", hours: 5 }); // WhatsApp reminder
    await membership("m-phone-again", { phone: "9000000202", hours: 4, couple: true }); // same number: one message, for the latest try
    await membership("m-no-tick", { email: "notick@example.com", phone: "9000000203", hours: 5, remind: false });
    await membership("m-no-tick-phone", { phone: "9000000204", hours: 5, remind: false });
    await membership("m-paid-later", { phone: "9000000205", hours: 6 });
    await membership("m-paid", { phone: "9000000205", hours: 5, status: "paid" });
    await membership("m-member", { phone: "9000000206", hours: 5 }); // already a member: renewals have their own sequence
    await pool.query(
      `insert into public.members (name, phone, plan_name, start_on, expires_on, referral_code) values ('Old Member', '9000000206', 'Quarterly', current_date, current_date + 30, 'RFC-OLD-0001')`,
    );
    await membership("m-unsub", { email: "gone@example.com", phone: "9000000207", hours: 5 });
    await pool.query(`insert into public.marketing_contacts (channel, address, source, consent_at, unsubscribed_at) values ('email', 'gone@example.com', 'unsubscribe', now(), now())`);

    await daily.runDaily(NOW);
    const rows = (await pool.query(`select kind, to_address, subject, body, template, dedupe_key from public.message_outbox where kind in ('nurture-checkout', 'checkout-reminder') order by kind, to_address`)).rows;
    expect(rows.map((r) => [r.kind, r.to_address])).toEqual([
      ["checkout-reminder", "919000000202"],
      ["nurture-checkout", "neha@example.com"],
    ]);
    const [wa, email] = rows;
    expect(wa.template).toBe("rfc_checkout_reminder_v1");
    expect(wa.body).toContain("/join?plan=quarterly&couple=1&utm_source=whatsapp");
    expect(email.subject).toBe("Neha, your Quarterly membership is one step away");
    expect(email.body).toContain("/join?plan=quarterly&utm_source=email");
    expect(email.dedupe_key).toMatch(/^checkout:membership:/);

    // A new unpaid checkout from the same number two days later: no second WhatsApp inside 14 days.
    await membership("m-phone-3", { phone: "9000000202", hours: -40 });
    await daily.runDaily(new Date(NOW.getTime() + 48 * 3_600_000));
    expect((await pool.query(`select count(*)::int as n from public.message_outbox where kind = 'checkout-reminder'`)).rows[0].n).toBe(1);
  });

  it("sends the Coach's Pick on Wednesdays only, and only to people who asked for emails", async () => {
    await pool.query(
      `insert into public.marketing_contacts (channel, address, source, consent_at, unsubscribed_at) values
       ('email', 'yes@example.com', 'newsletter', now(), null),
       ('email', 'no@example.com', 'newsletter', now(), now())`,
    );
    await daily.runDaily(new Date("2026-10-20T02:15:00Z")); // Tuesday
    expect((await outbox()).filter((r) => r.kind === "nurture-pick")).toHaveLength(0);
    await daily.runDaily(NOW);
    const picks = (await outbox()).filter((r) => r.kind === "nurture-pick");
    expect(picks.map((r) => r.to_address)).toEqual(["yes@example.com"]);
    expect(picks[0].subject).toMatch(/^Coach's pick this week: /);
  });
});
