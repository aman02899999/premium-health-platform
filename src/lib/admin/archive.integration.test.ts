// Archive instead of delete on a real Postgres:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/admin/archive.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("archive on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let archive: typeof import("./archive");

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    pool = (await import("@/health/db")).pool;
    archive = await import("./archive");
  });
  beforeEach(async () => {
    await pool.query("truncate public.archived_records, public.members, public.membership_orders, public.referral_rewards, public.leads, public.social_inbox, public.message_outbox, public.shop_categories, public.shop_posts, public.diet_clients, public.shop_products, public.shop_barcodes cascade");
  });
  afterAll(async () => {
    await pool.end();
  });

  async function member(name: string, phone: string, code: string): Promise<string> {
    const { rows } = await pool.query(
      `insert into public.members (name, phone, plan_name, start_on, expires_on, referral_code) values ($1, $2, 'Monthly', '2026-10-01', '2026-11-01', $3) returning id`,
      [name, phone, code],
    );
    return rows[0].id;
  }

  it("moves a member, their referral rewards and order links to the archive, and it can be put back", async () => {
    const asha = await member("Asha", "9876543210", "ASHA-1");
    const ravi = await member("Ravi", "9876543211", "RAVI-1");
    const { rows: [order] } = await pool.query(
      `insert into public.membership_orders (razorpay_order_id, status, plan_id, plan_name, duration, amount_paise, name, phone, member_id)
       values ('order_1', 'paid', 'monthly', 'Monthly', 'monthly', 150000, 'Ravi', '9876543211', $1) returning id`,
      [ravi],
    );
    await pool.query(`insert into public.referral_rewards (referrer_id, referred_id, order_id, referrer_days, referred_days) values ($1, $2, $3, 7, 7)`, [asha, ravi, order.id]);

    await pool.query(
      `insert into public.message_outbox (channel, to_address, kind, body, dedupe_key, status) values
       ('whatsapp', '919876543211', 'renewal', 'x', 'renewal:1', 'pending'),
       ('whatsapp', '919876543211', 'renewal', 'x', 'renewal:0', 'sent'),
       ('whatsapp', '919876543210', 'renewal', 'x', 'renewal:2', 'pending')`,
    );

    expect(await archive.archiveMember(ravi, "owner@x.in")).toBe(true);

    // Ravi's waiting message is cancelled; his sent history and Asha's message are untouched.
    const { rows: out } = await pool.query(`select dedupe_key, status, last_error from public.message_outbox order by dedupe_key`);
    expect(out.map((o) => [o.dedupe_key, o.status])).toEqual([["renewal:0", "sent"], ["renewal:1", "cancelled"], ["renewal:2", "pending"]]);
    expect(out[1].last_error).toMatch(/Archived/);

    expect((await pool.query(`select 1 from public.members where id = $1`, [ravi])).rowCount).toBe(0);
    const { rows: [rec] } = await pool.query(`select * from public.archived_records where original_id = $1`, [ravi]);
    expect(rec.kind).toBe("member");
    expect(rec.archived_by).toBe("owner@x.in");
    expect(rec.data).toMatchObject({ name: "Ravi", phone: "9876543211", referral_code: "RAVI-1" });
    expect(rec.links.membership_orders).toEqual([order.id]);
    expect(rec.links.referral_rewards).toHaveLength(1);
    expect(rec.links.referral_rewards[0]).toMatchObject({ referrer_id: asha, referred_id: ravi, referrer_days: 7 });
    // The other member is untouched.
    expect((await pool.query(`select 1 from public.members where id = $1`, [asha])).rowCount).toBe(1);

    // The restore SQL in the migration's header works.
    await pool.query(`insert into public.members select * from jsonb_populate_record(null::public.members, (select data from public.archived_records where id = $1))`, [rec.id]);
    expect((await pool.query(`select name from public.members where id = $1`, [ravi])).rows[0].name).toBe("Ravi");
  });

  it("archives a website enquiry with its chat links; a second archive of the same id does nothing", async () => {
    const { rows: [lead] } = await pool.query(
      `insert into public.leads (name, phone, goal, marketing_consent_at) values ('Neha', '+91 98765 43212', 'Weight loss', now()) returning id`,
    );
    await pool.query(`insert into public.social_inbox (id, channel, kind, from_id, body, lead_id) values ('m1', 'whatsapp', 'message', '919876543212', 'hi', $1)`, [lead.id]);

    await pool.query(`insert into public.message_outbox (channel, to_address, kind, body, dedupe_key) values ('whatsapp', '919876543212', 'nurture', 'x', 'nurture:1')`);
    expect(await archive.archiveLead(lead.id, "owner@x.in")).toBe(true);
    expect((await pool.query(`select status from public.message_outbox`)).rows[0].status).toBe("cancelled");
    expect(await archive.archiveLead(lead.id, "owner@x.in")).toBe(false);

    expect((await pool.query(`select 1 from public.leads`)).rowCount).toBe(0);
    const { rows } = await pool.query(`select kind, data, links from public.archived_records`);
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe("lead");
    expect(rows[0].data).toMatchObject({ name: "Neha", goal: "Weight loss" });
    expect(rows[0].data.marketing_consent_at).not.toBeNull();
    expect(rows[0].links.social_inbox).toEqual(["m1"]);
  });

  it("an unknown id archives nothing", async () => {
    expect(await archive.archiveMember("00000000-0000-0000-0000-000000000000", "owner@x.in")).toBe(false);
    expect((await pool.query(`select 1 from public.archived_records`)).rowCount).toBe(0);
  });
  it("removing a shop category or blog post keeps it in the archive", async () => {
    const shop = await import("@/lib/shop/store");
    const { rows: [cat] } = await pool.query(`insert into public.shop_categories (slug, name) values ('whey', 'Whey protein') returning id`);
    const { rows: [post] } = await pool.query(`insert into public.shop_posts (slug, title, body) values ('creatine-guide', 'Creatine guide', 'text') returning id`);
    expect(await shop.deleteCategory(cat.id, "owner@x.in")).toBeNull();
    expect(await shop.deletePost(post.id, "owner@x.in")).toBeNull();
    expect((await pool.query(`select 1 from public.shop_categories union all select 1 from public.shop_posts`)).rowCount).toBe(0);
    const { rows } = await pool.query(`select kind, data->>'slug' as slug, archived_by from public.archived_records order by kind`);
    expect(rows).toEqual([
      { kind: "shop-category", slug: "whey", archived_by: "owner@x.in" },
      { kind: "shop-post", slug: "creatine-guide", archived_by: "owner@x.in" },
    ]);
  });

  it("removing a Diet Pro client keeps their record in the archive", async () => {
    const { rows: [c] } = await pool.query(
      `insert into public.diet_clients (name, profile, consent_at, consent_by) values ('Riya', '{"weight":62}', now(), 'coach@x.in') returning id`,
    );
    expect(await archive.archiveDietClient(c.id, "owner@x.in")).toBe(true);
    expect((await pool.query(`select 1 from public.diet_clients`)).rowCount).toBe(0);
    const { rows } = await pool.query(`select kind, data->>'name' as name, data->'profile'->>'weight' as weight, archived_by from public.archived_records`);
    expect(rows).toEqual([{ kind: "diet-client", name: "Riya", weight: "62", archived_by: "owner@x.in" }]);
  });

  it("removing a product keeps its barcodes in the archive", async () => {
    const shop = await import("@/lib/shop/store");
    const { rows: [p] } = await pool.query(`insert into public.shop_products (slug, name, list_price) values ('whey-1kg', 'Whey 1 kg', 2999) returning id`);
    await pool.query(`insert into public.shop_barcodes (code, product_id, variant) values ('8901234567890', $1, 'Chocolate')`, [p.id]);
    expect(await shop.deleteProduct(p.id, "owner@x.in")).toBeNull();
    const { rows } = await pool.query(`select data->>'name' as name, links->'barcodes'->0->>'code' as code, links->'barcodes'->0->>'variant' as variant from public.archived_records where kind = 'shop-product'`);
    expect(rows).toEqual([{ name: "Whey 1 kg", code: "8901234567890", variant: "Chocolate" }]);
  });
});
