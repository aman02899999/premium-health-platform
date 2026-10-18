// Verified reviews on a real Postgres:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/reviews/reviews.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("verified reviews on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let store: typeof import("./store");
  const review = (phone: string, rating = 5) => ({ name: "Asha Rani Verma", phone, city: "Sector 93", rating, title: "", body: "Trained here for four months, lost 5 kg and my back pain is gone." });

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    pool = (await import("@/health/db")).pool;
    store = await import("./store");
  });
  beforeEach(async () => {
    await pool.query("truncate public.reviews, public.diet_orders, public.members cascade");
  });
  afterAll(async () => {
    await pool.end();
  });

  it("only takes reviews from members and paid diet-plan clients", async () => {
    await pool.query(`insert into public.members (name, phone, plan_name, start_on, expires_on, referral_code) values ('Asha Rani', '9000000301', 'Monthly', current_date - 40, current_date + 20, 'RFC-0301-ABCD')`);
    await pool.query(
      `insert into public.diet_orders (razorpay_order_id, amount_paise, name, phone, email, intake, consent_at, plan, status) values
       ('o1', 4900, 'Paid Client', '9000000302', 'p@x.in', '{}', now(), 'trial', 'paid'),
       ('o2', 4900, 'Never Paid', '9000000303', 'n@x.in', '{}', now(), 'trial', 'created')`,
    );
    expect(await store.submitReview(review("9000000301"))).toEqual({ ok: true, verifiedAs: "member" });
    expect(await store.submitReview(review("9000000302"))).toEqual({ ok: true, verifiedAs: "diet-client" });
    expect(await store.submitReview(review("9000000303"))).toMatchObject({ ok: false, status: 403 });
    expect(await store.submitReview(review("9000000399"))).toMatchObject({ ok: false, status: 403 });
    expect((await pool.query(`select count(*)::int n from public.reviews`)).rows[0].n).toBe(2);
  });

  it("shows nothing until approved, shows low ratings once approved, and a resubmission goes back to pending", async () => {
    await pool.query(`insert into public.members (name, phone, plan_name, start_on, expires_on, referral_code) values ('Asha Rani', '9000000301', 'Monthly', current_date - 40, current_date + 20, 'RFC-0301-ABCD')`);
    await store.submitReview(review("9000000301", 2));
    expect(await store.approvedReviews()).toEqual([]);
    const [pending] = await store.adminReviews();
    expect(pending).toMatchObject({ status: "pending", phone: "9000000301", fullName: "Asha Rani Verma", name: "Asha V." });
    expect(await store.decideReview(pending.id, "approved", "coach@x.in")).toBe(true);
    const shown = await store.approvedReviews();
    expect(shown).toHaveLength(1);
    expect(shown[0]).toMatchObject({ rating: 2, name: "Asha V.", city: "Sector 93", verifiedAs: "member" });
    expect(JSON.stringify(shown)).not.toContain("9000000301"); // the number is never public

    await store.submitReview({ ...review("9000000301", 4), body: "Updated: after six months I'm 8 kg down. The trainers fixed my squat." });
    expect(await store.approvedReviews()).toEqual([]);
    expect((await store.adminReviews()).map((r) => [r.status, r.rating])).toEqual([["pending", 4]]);
  });
});
