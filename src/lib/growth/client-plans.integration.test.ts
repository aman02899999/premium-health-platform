// Client plan dashboard on a real Postgres (migrations applied); plan PDFs go to .data locally:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/growth/client-plans.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/content/store", async () => {
  const { DEFAULT_CONTENT } = await import("@/lib/content/defaults");
  return { getContent: async () => DEFAULT_CONTENT };
});

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("client plans on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let cp: typeof import("./client-plans");
  let delivery: typeof import("./plan-delivery");
  const priya = { id: "11111111-1111-4111-8111-111111111111", email: "priya@example.com", name: "Priya" };
  const other = { id: "22222222-2222-4222-8222-222222222222", email: "intruder@example.com", name: "X" };
  const intake = { age: 30, sex: "female", heightCm: 160, weightKg: 70, goal: "fat-loss", diet: "veg", cuisine: "north", activity: "light", mealsPerDay: 5, wakeTime: "06:30", conditions: [], allergies: [], notes: "" };

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    for (const k of ["WHATSAPP_TOKEN", "RESEND_API_KEY", "EMAIL_FROM", "SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", "DIET_AUTO_SEND"]) delete process.env[k];
    process.env.COACH_EMAIL = "coach@example.com";
    pool = (await import("@/health/db")).pool;
    cp = await import("./client-plans");
    delivery = await import("./plan-delivery");
  });
  beforeEach(async () => {
    await pool.query("truncate public.message_outbox, public.diet_orders, public.client_plan_versions cascade");
  });
  afterAll(async () => {
    await pool.end();
  });

  /** A paid 3-month order whose first plan the coach sent `daysAgo` days ago. */
  async function paidOrder(daysAgo: number, conditions: string[] = []) {
    const { rows } = await pool.query<{ id: string }>(
      `insert into public.diet_orders (razorpay_order_id, amount_paise, name, phone, email, intake, consent_at, plan, status, paid_at)
       values ($1, 299900, 'Priya Verma', '9876543210', 'Priya@Example.com', $2, now(), '3m', 'paid', now() - make_interval(days => $3)) returning id`,
      [`order_${Math.random()}`, JSON.stringify({ ...intake, conditions }), daysAgo],
    );
    const id = rows[0].id;
    await delivery.prepareDietPlan(id); // builds plan #1 as a draft (DIET_AUTO_SEND off)
    await delivery.sendDietPlan(id); // the coach approves it
    await pool.query(`update public.client_plan_versions set created_at = now() - make_interval(days => $2) where order_id = $1`, [id, daysAgo]);
    return id;
  }

  it("the order belongs to the account that signs in with its email, and to nobody else", async () => {
    const id = await paidOrder(1);
    expect(await cp.ordersForCustomer(other)).toEqual([]);
    const mine = await cp.ordersForCustomer(priya);
    expect(mine.map((o) => o.id)).toEqual([id]);
    expect(mine[0].versions.map((v) => [v.version, v.source, v.status])).toEqual([[1, "checkout", "sent"]]);
    // Even with the same email later, a different account can't see a claimed order.
    expect(await cp.ordersForCustomer({ ...other, email: priya.email })).toEqual([]);
    // Files: only the owner, only sent versions.
    expect(await cp.clientVersion(priya, mine[0].versions[0].id)).not.toBeNull();
    expect(await cp.clientVersion(other, mine[0].versions[0].id)).toBeNull();
    // Updates: not someone else's order, and not before the 15-day spacing.
    expect(await cp.requestUpdate(other, id, { weightKg: 68 })).toMatchObject({ ok: false, status: 404 });
    expect(await cp.requestUpdate(priya, id, { weightKg: 68 })).toMatchObject({ ok: false, status: 403 });
  });

  it("after 15 days the client builds plan #2 from today's numbers; it is sent at once; a double tap can't make #3", async () => {
    const id = await paidOrder(16);
    await cp.ordersForCustomer(priya);
    const [a, b] = await Promise.all([cp.requestUpdate(priya, id, { weightKg: 67.5, waistCm: 84 }), cp.requestUpdate(priya, id, { weightKg: 67.5, waistCm: 84 })]);
    expect([a.ok, b.ok].sort()).toEqual([false, true]);
    const [o] = await cp.ordersForCustomer(priya);
    expect(o.versions.map((v) => [v.version, v.source, v.status, v.intake.weightKg])).toEqual([
      [1, "checkout", "sent", 70],
      [2, "client", "sent", 67.5],
    ]);
    expect(o.entitlement).toMatchObject({ used: 2, remaining: 4, reason: "too-soon" });
    const kinds = (await pool.query(`select kind from public.message_outbox order by created_at`)).rows.map((r) => r.kind);
    expect(kinds).toContain("diet-plan-ready"); // WhatsApp with the new PDF
    expect(kinds).toContain("coach-plan-update"); // the admin is told
  });

  it("a health condition holds the new plan for the coach; rejecting it gives the plan back", async () => {
    const id = await paidOrder(16);
    await cp.ordersForCustomer(priya);
    const r = await cp.requestUpdate(priya, id, { weightKg: 69, conditions: ["diabetes"], medicines: "metformin 500" });
    expect(r).toMatchObject({ ok: true, review: true });
    let [o] = await cp.ordersForCustomer(priya);
    expect(o.entitlement.reason).toBe("in-review");
    const draft = o.versions.find((v) => v.version === 2)!;
    expect(draft.status).toBe("draft");
    expect(await cp.clientVersion(priya, draft.id)).toBeNull(); // not downloadable until approved
    await cp.rejectVersion(draft.id);
    [o] = await cp.ordersForCustomer(priya);
    expect(o.entitlement).toMatchObject({ used: 1, reason: "ok" });
  });

  it("admin access controls: pause, extra plans, end date, moving the order to another email", async () => {
    const id = await paidOrder(16);
    await cp.ordersForCustomer(priya);
    await cp.updateAccess(id, { revoked: true });
    expect((await cp.ordersForCustomer(priya))[0].entitlement.reason).toBe("revoked");
    await cp.updateAccess(id, { revoked: false, extraGenerations: 3, accessUntil: "2027-06-30" });
    expect((await cp.ordersForCustomer(priya))[0].entitlement).toMatchObject({ allowed: 9, accessUntil: "2027-06-30", reason: "ok" });
    await expect(cp.updateAccess(id, { extraGenerations: 500 })).rejects.toThrow();
    await cp.updateAccess(id, { email: "new@example.com" });
    expect(await cp.ordersForCustomer(priya)).toEqual([]);
    expect((await cp.ordersForCustomer({ ...other, email: "new@example.com" })).map((o) => o.id)).toEqual([id]);
  });
});
