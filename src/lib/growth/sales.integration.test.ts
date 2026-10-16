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
    await pool.query("truncate public.message_outbox, public.diet_orders, public.book_orders, public.marketing_contacts, public.social_posts cascade");
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
  const book = (rzp: string, email: string, hours: number, status = "created") =>
    pool.query(
      `insert into public.book_orders (razorpay_order_id, status, item_id, title, slugs, amount_paise, name, email, phone, access_token, created_at)
       values ($1, $2, '01-foundations-of-strength', 'Vol. 1 · The Foundations of Strength', '{01-foundations-of-strength}', 69900, 'Ravi Kumar', $3, '9123456780', $4, $5)`,
      [rzp, status, email, `tok-${rzp}`, ago(hours)],
    );
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
    await book("b-abandoned", "ravi@example.com", 30);
    await book("b-paid-later", "reader@example.com", 30);
    await book("b-paid", "reader@example.com", 20, "paid");

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
