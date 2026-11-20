import "server-only";
import { pool } from "@/health/db";

// Archive instead of delete: the row moves to public.archived_records with what was linked to
// it, in one transaction, so nothing is lost and it can be put back from the SQL editor.
// For a person, messages still waiting to go to them are cancelled (kept, marked why).

type Person = "member" | "lead";
type ShopItem = "shop-product" | "shop-category" | "shop-combo" | "shop-post";
type Kind = Person | ShopItem | "diet-client";

const LINKS: Partial<Record<Kind, string>> = {
  member: `jsonb_build_object(
    'referral_rewards', coalesce((select jsonb_agg(to_jsonb(r)) from public.referral_rewards r where r.referrer_id = $1 or r.referred_id = $1), '[]'::jsonb),
    'membership_orders', coalesce((select jsonb_agg(o.id) from public.membership_orders o where o.member_id = $1), '[]'::jsonb))`,
  lead: `jsonb_build_object(
    'social_inbox', coalesce((select jsonb_agg(s.id) from public.social_inbox s where s.lead_id = $1), '[]'::jsonb))`,
  // Barcodes go with the product (on delete cascade), so they are kept here; stock history stays
  // in shop_stock_moves with the product's name.
  "shop-product": `jsonb_build_object(
    'barcodes', coalesce((select jsonb_agg(to_jsonb(b)) from public.shop_barcodes b where b.product_id = $1), '[]'::jsonb))`,
};
const TABLE: Record<Kind, string> = {
  member: "public.members",
  lead: "public.leads",
  "shop-product": "public.shop_products",
  "shop-category": "public.shop_categories",
  "shop-combo": "public.shop_combos",
  "shop-post": "public.shop_posts",
  "diet-client": "public.diet_clients",
};
const isPerson = (k: Kind): k is Person => k === "member" || k === "lead";

/** Returns false when there was no such row (already archived, or a wrong id). */
async function archive(kind: Kind, id: string, by: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rowCount } = await client.query(
      `insert into public.archived_records (kind, original_id, archived_by, data, links)
       select $2, t.id, $3, to_jsonb(t), ${LINKS[kind] ?? "'{}'::jsonb"}
       from ${TABLE[kind]} t where t.id = $1
       for update`,
      [id, kind, by.slice(0, 200)],
    );
    if (rowCount) {
      if (isPerson(kind)) await client.query(
        `update public.message_outbox o set status = 'cancelled', last_error = 'Archived in admin: no more messages'
         from ${TABLE[kind]} t
         where t.id = $1 and o.status = 'pending'
           and (o.to_address = '91' || right(regexp_replace(t.phone, '\\D', '', 'g'), 10) or (t.email is not null and o.to_address = lower(t.email)))`,
        [id],
      );
      await client.query(`delete from ${TABLE[kind]} where id = $1`, [id]);
    }
    await client.query("commit");
    return !!rowCount;
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export const archiveMember = (id: string, by: string) => archive("member", id, by);
export const archiveLead = (id: string, by: string) => archive("lead", id, by);

/** Shop items (product, category, combo, blog post): kept in the archive, gone from the store. */
export const archiveShopItem = (kind: "product" | "category" | "combo" | "post", id: string, by: string) => archive(`shop-${kind}`, id, by);

/** Diet Pro client: their profile, plan and log are kept in the archive (owner decision, 30 Oct). */
export const archiveDietClient = (id: string, by: string) => archive("diet-client", id, by);
