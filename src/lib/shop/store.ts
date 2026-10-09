import "server-only";
import type { PoolClient } from "pg";
import { pool } from "@/health/db";
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "./defaults";
import { DEFAULT_POSTS } from "./default-posts";
import { priceCombo, priceProduct, type Priced, type PricedCombo } from "./pricing";
import type { Address, Category, Combo, Fulfilment, Order, OrderItem, Post, Product, ShopSettings } from "./types";

// Royal Supplements: database access. Server-only tables reached through the direct
// connection; callers do their own admin / customer checks.

/* ---------- first run ---------- */

let seeded = false;
/** Creates the settings row, the default categories and the starter blog once, on a fresh store. */
export async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rowCount } = await client.query(`insert into public.shop_settings (id, settings) values (1, $1) on conflict (id) do nothing`, [JSON.stringify(DEFAULT_SETTINGS)]);
    if (rowCount) {
      for (const c of DEFAULT_CATEGORIES) {
        await client.query(`insert into public.shop_categories (slug, name, description, discount_pct, sort) values ($1, $2, $3, $4, $5) on conflict (slug) do nothing`, [c.slug, c.name, c.description, c.discountPct, c.sort]);
      }
      for (const p of DEFAULT_POSTS) {
        await client.query(`insert into public.shop_posts (slug, title, excerpt, body, category_slug, tags, seo_title, seo_description) values ($1, $2, $3, $4, $5, $6, $7, $8) on conflict (slug) do nothing`, [
          p.slug,
          p.title,
          p.excerpt,
          p.body,
          p.categorySlug,
          p.tags,
          p.seoTitle,
          p.seoDescription,
        ]);
      }
    }
    await client.query("commit");
    seeded = true;
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/* ---------- settings ---------- */

export async function getSettings(): Promise<ShopSettings> {
  await ensureSeeded();
  const { rows } = await pool.query<{ settings: Partial<ShopSettings> }>(`select settings from public.shop_settings where id = 1`);
  return { ...DEFAULT_SETTINGS, ...(rows[0]?.settings ?? {}) };
}

export async function saveSettings(s: ShopSettings): Promise<void> {
  await pool.query(`insert into public.shop_settings (id, settings, updated_at) values (1, $1, now()) on conflict (id) do update set settings = excluded.settings, updated_at = now()`, [JSON.stringify(s)]);
}

/* ---------- categories ---------- */

type CatRow = { id: string; slug: string; name: string; description: string; discount_pct: number; sort: number; image: string | null; seo_title: string | null; seo_description: string | null; active: boolean };
const catFrom = (r: CatRow): Category => ({ id: r.id, slug: r.slug, name: r.name, description: r.description, discountPct: r.discount_pct, sort: r.sort, image: r.image, seoTitle: r.seo_title, seoDescription: r.seo_description, active: r.active });

export async function listCategories(): Promise<Category[]> {
  await ensureSeeded();
  const { rows } = await pool.query<CatRow>(`select * from public.shop_categories order by sort, name`);
  return rows.map(catFrom);
}

export async function saveCategory(c: Omit<Category, "id"> & { id?: string }): Promise<Category> {
  const vals = [c.slug, c.name, c.description, c.discountPct, c.sort, c.image, c.seoTitle, c.seoDescription, c.active];
  const { rows } = c.id
    ? await pool.query<CatRow>(
        `update public.shop_categories set slug=$1, name=$2, description=$3, discount_pct=$4, sort=$5, image=$6, seo_title=$7, seo_description=$8, active=$9, updated_at=now() where id=$10 returning *`,
        [...vals, c.id],
      )
    : await pool.query<CatRow>(`insert into public.shop_categories (slug, name, description, discount_pct, sort, image, seo_title, seo_description, active) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`, vals);
  if (!rows[0]) throw new Error("Category not found");
  return catFrom(rows[0]);
}

/** Refuses (returns a message) while products use it: they would silently lose the category discount. */
export async function deleteCategory(id: string): Promise<string | null> {
  const { rows } = await pool.query<{ n: number }>(`select count(*)::int as n from public.shop_products where category_id = $1`, [id]);
  if (rows[0].n > 0) return `${rows[0].n} product(s) are in this category. Move them to another category first, or hide the category instead.`;
  await pool.query(`delete from public.shop_categories where id = $1`, [id]);
  return null;
}

/* ---------- products ---------- */

type ProdRow = {
  id: string; slug: string; name: string; brand: string; category_id: string | null; sku: string | null; list_price: number; discount_pct: number | null; stock: number; size: string;
  flavours: string[]; images: string[]; short_description: string; description: string; highlights: string[]; nutrition: Product["nutrition"]; how_to_use: string; warnings: string;
  featured: boolean; active: boolean; seo_title: string | null; seo_description: string | null; updated_at: Date;
};
const prodFrom = (r: ProdRow): Product => ({
  id: r.id, slug: r.slug, name: r.name, brand: r.brand, categoryId: r.category_id, sku: r.sku, listPrice: r.list_price, discountPct: r.discount_pct, stock: r.stock, size: r.size,
  flavours: r.flavours ?? [], images: r.images ?? [], shortDescription: r.short_description, description: r.description, highlights: r.highlights ?? [], nutrition: r.nutrition ?? [],
  howToUse: r.how_to_use, warnings: r.warnings, featured: r.featured, active: r.active, seoTitle: r.seo_title, seoDescription: r.seo_description, updatedAt: r.updated_at.toISOString(),
});

export async function listProducts(): Promise<Product[]> {
  const { rows } = await pool.query<ProdRow>(`select * from public.shop_products order by featured desc, name`);
  return rows.map(prodFrom);
}

export type ProductInput = Omit<Product, "id" | "updatedAt"> & { id?: string };
export async function saveProduct(p: ProductInput): Promise<Product> {
  const vals = [p.slug, p.name, p.brand, p.categoryId, p.sku, p.listPrice, p.discountPct, p.stock, p.size, p.flavours, p.images, p.shortDescription, p.description, p.highlights, JSON.stringify(p.nutrition), p.howToUse, p.warnings, p.featured, p.active, p.seoTitle, p.seoDescription];
  const cols = "slug, name, brand, category_id, sku, list_price, discount_pct, stock, size, flavours, images, short_description, description, highlights, nutrition, how_to_use, warnings, featured, active, seo_title, seo_description";
  const { rows } = p.id
    ? await pool.query<ProdRow>(`update public.shop_products set (${cols}, updated_at) = ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21, now()) where id = $22 returning *`, [...vals, p.id])
    : await pool.query<ProdRow>(`insert into public.shop_products (${cols}) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) returning *`, vals);
  if (!rows[0]) throw new Error("Product not found");
  return prodFrom(rows[0]);
}

/** Refuses (returns a message) while a combo contains it; past orders keep their own snapshot. */
export async function deleteProduct(id: string): Promise<string | null> {
  const { rows } = await pool.query<{ name: string }>(`select name from public.shop_combos where items @> $1::jsonb`, [JSON.stringify([{ productId: id }])]);
  if (rows.length) return `It's in ${rows.map((r) => `“${r.name}”`).join(", ")}. Remove it from those combos first, or untick “Show on store” to hide it.`;
  await pool.query(`delete from public.shop_products where id = $1`, [id]);
  return null;
}

/* ---------- combos ---------- */

type ComboRow = { id: string; slug: string; name: string; description: string; image: string | null; items: Combo["items"]; extra_pct: number; featured: boolean; active: boolean; updated_at: Date };
const comboFrom = (r: ComboRow): Combo => ({ id: r.id, slug: r.slug, name: r.name, description: r.description, image: r.image, items: r.items ?? [], extraPct: r.extra_pct, featured: r.featured, active: r.active, updatedAt: r.updated_at.toISOString() });

export async function listCombos(): Promise<Combo[]> {
  const { rows } = await pool.query<ComboRow>(`select * from public.shop_combos order by featured desc, name`);
  return rows.map(comboFrom);
}

export async function saveCombo(c: Omit<Combo, "id" | "updatedAt"> & { id?: string }): Promise<Combo> {
  const vals = [c.slug, c.name, c.description, c.image, JSON.stringify(c.items), c.extraPct, c.featured, c.active];
  const { rows } = c.id
    ? await pool.query<ComboRow>(`update public.shop_combos set slug=$1, name=$2, description=$3, image=$4, items=$5, extra_pct=$6, featured=$7, active=$8, updated_at=now() where id=$9 returning *`, [...vals, c.id])
    : await pool.query<ComboRow>(`insert into public.shop_combos (slug, name, description, image, items, extra_pct, featured, active) values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`, vals);
  if (!rows[0]) throw new Error("Combo not found");
  return comboFrom(rows[0]);
}

export async function deleteCombo(id: string): Promise<string | null> {
  await pool.query(`delete from public.shop_combos where id = $1`, [id]);
  return null;
}

/* ---------- the priced catalogue ---------- */

export type Catalog = {
  settings: ShopSettings;
  categories: Category[];
  products: Priced[];
  combos: PricedCombo[];
  productById: Map<string, Priced>;
  comboById: Map<string, PricedCombo>;
};

/** Everything the storefront needs, priced. `publicOnly` hides inactive items. */
export async function loadCatalog(publicOnly = true): Promise<Catalog> {
  const [settings, categories, products, combos] = await Promise.all([getSettings(), listCategories(), listProducts(), listCombos()]);
  const cats = new Map(categories.map((c) => [c.id, c]));
  const pricedAll = products.map((p) => priceProduct(p, cats));
  const productById = new Map(pricedAll.map((p) => [p.id, p]));
  const combosAll = combos.map((c) => priceCombo(c, productById));
  const visibleCats = publicOnly ? categories.filter((c) => c.active) : categories;
  const catOk = (p: Priced) => !p.categoryId || !publicOnly || (cats.get(p.categoryId)?.active ?? true);
  return {
    settings,
    categories: visibleCats,
    products: publicOnly ? pricedAll.filter((p) => p.active && catOk(p)) : pricedAll,
    combos: publicOnly ? combosAll.filter((c) => c.active && c.lines.length === c.items.length && c.lines.every((l) => l.product.active)) : combosAll,
    productById,
    comboById: new Map(combosAll.map((c) => [c.id, c])),
  };
}

/* ---------- blog ---------- */

type PostRow = { id: string; slug: string; title: string; excerpt: string; body: string; cover: string | null; category_slug: string | null; tags: string[]; published: boolean; seo_title: string | null; seo_description: string | null; created_at: Date; updated_at: Date };
const postFrom = (r: PostRow): Post => ({ id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt, body: r.body, cover: r.cover, categorySlug: r.category_slug, tags: r.tags ?? [], published: r.published, seoTitle: r.seo_title, seoDescription: r.seo_description, createdAt: r.created_at.toISOString(), updatedAt: r.updated_at.toISOString() });

export async function listPosts(publishedOnly = true): Promise<Post[]> {
  await ensureSeeded();
  const { rows } = await pool.query<PostRow>(`select * from public.shop_posts ${publishedOnly ? "where published" : ""} order by created_at desc`);
  return rows.map(postFrom);
}

export async function savePost(p: Omit<Post, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<Post> {
  const vals = [p.slug, p.title, p.excerpt, p.body, p.cover, p.categorySlug, p.tags, p.published, p.seoTitle, p.seoDescription];
  const { rows } = p.id
    ? await pool.query<PostRow>(`update public.shop_posts set slug=$1, title=$2, excerpt=$3, body=$4, cover=$5, category_slug=$6, tags=$7, published=$8, seo_title=$9, seo_description=$10, updated_at=now() where id=$11 returning *`, [...vals, p.id])
    : await pool.query<PostRow>(`insert into public.shop_posts (slug, title, excerpt, body, cover, category_slug, tags, published, seo_title, seo_description) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`, vals);
  if (!rows[0]) throw new Error("Post not found");
  return postFrom(rows[0]);
}

export async function deletePost(id: string): Promise<string | null> {
  await pool.query(`delete from public.shop_posts where id = $1`, [id]);
  return null;
}

/* ---------- orders ---------- */

type OrderRow = {
  id: string; number: string; created_at: Date; status: Order["status"]; fulfilment: Fulfilment; name: string; email: string; phone: string; address: Address; items: OrderItem[];
  list_total: number; discount_total: number; shipping: number; total: number; note: string; courier: string; tracking: string; admin_notes: string; paid_at: Date | null; razorpay_order_id: string; razorpay_payment_id: string | null;
};
const orderFrom = (r: OrderRow): Order => ({
  id: r.id, number: r.number, createdAt: r.created_at.toISOString(), status: r.status, fulfilment: r.fulfilment, name: r.name, email: r.email, phone: r.phone, address: r.address, items: r.items,
  listTotal: r.list_total, discountTotal: r.discount_total, shipping: r.shipping, total: r.total, note: r.note, courier: r.courier, tracking: r.tracking, adminNotes: r.admin_notes,
  paidAt: r.paid_at?.toISOString() ?? null, razorpayOrderId: r.razorpay_order_id, razorpayPaymentId: r.razorpay_payment_id,
});

export async function insertOrder(o: { number: string; razorpayOrderId: string; userId: string | null; name: string; email: string; phone: string; address: Address; items: OrderItem[]; listTotal: number; discountTotal: number; shipping: number; total: number; note: string }): Promise<void> {
  await pool.query(
    `insert into public.shop_orders (number, razorpay_order_id, user_id, name, email, phone, address, items, list_total, discount_total, shipping, total, note)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [o.number, o.razorpayOrderId, o.userId, o.name, o.email.toLowerCase(), o.phone, JSON.stringify(o.address), JSON.stringify(o.items), o.listTotal, o.discountTotal, o.shipping, o.total, o.note],
  );
}

/**
 * Marks an order paid exactly once and takes its items out of stock in the same transaction.
 * Returns the order and whether this call was the one that paid it (so emails go out once).
 */
export async function markShopPaid(razorpayOrderId: string, paymentId: string): Promise<{ order: Order; firstTime: boolean } | null> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query<OrderRow & { stock_applied: boolean }>(`select * from public.shop_orders where razorpay_order_id = $1 for update`, [razorpayOrderId]);
    const o = rows[0];
    if (!o) {
      await client.query("rollback");
      return null;
    }
    const firstTime = o.status !== "paid";
    await client.query(`update public.shop_orders set status='paid', razorpay_payment_id=coalesce(razorpay_payment_id, $2), paid_at=coalesce(paid_at, now()), updated_at=now() where id=$1`, [o.id, paymentId]);
    if (!o.stock_applied) {
      // Product ids and quantities, combos expanded into their contents as they were sold.
      const need = new Map<string, number>();
      for (const it of o.items) {
        if (it.kind === "product") need.set(it.id, (need.get(it.id) ?? 0) + it.qty);
      }
      // Combos use the contents snapshotted at checkout; older orders without ids fall back to the combo as it is now.
      const legacy = o.items.filter((i) => i.kind === "combo" && !(i.contents?.length && i.contents.every((c) => c.productId)));
      const { rows: cr } = legacy.length
        ? await client.query<{ id: string; items: Combo["items"] }>(`select id, items from public.shop_combos where id = any($1::uuid[])`, [legacy.map((i) => i.id)])
        : { rows: [] as { id: string; items: Combo["items"] }[] };
      for (const it of o.items.filter((i) => i.kind === "combo")) {
        const parts = legacy.includes(it) ? (cr.find((c) => c.id === it.id)?.items ?? []) : (it.contents ?? []).map((c) => ({ productId: c.productId!, qty: c.qty }));
        for (const ci of parts) need.set(ci.productId, (need.get(ci.productId) ?? 0) + ci.qty * it.qty);
      }
      // Two shoppers can pay for the last unit at the same time: never go below zero, and flag it for the admin.
      const short: string[] = [];
      for (const [id, qty] of need) {
        const { rows: pr } = await client.query<{ name: string; stock: number }>(`select name, stock from public.shop_products where id = $1 for update`, [id]);
        if (pr[0] && pr[0].stock < qty) short.push(`${pr[0].name}: needed ${qty}, had ${pr[0].stock}`);
        await client.query(`update public.shop_products set stock = greatest(stock - $2, 0), updated_at = now() where id = $1`, [id, qty]);
      }
      const note = short.length ? `⚠ Stock was short when this order was paid — ${short.join("; ")}. Check before packing.` : "";
      await client.query(`update public.shop_orders set stock_applied = true, admin_notes = case when $2 = '' then admin_notes else left(trim(both from $2 || E'\n' || admin_notes), 2000) end where id = $1`, [o.id, note]);
    }
    const fresh = (await client.query<OrderRow>(`select * from public.shop_orders where id = $1`, [o.id])).rows[0];
    await client.query("commit");
    return { order: orderFrom(fresh), firstTime };
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function markShopFailed(razorpayOrderId: string): Promise<void> {
  await pool.query(`update public.shop_orders set status='failed', updated_at=now() where razorpay_order_id=$1 and status='created'`, [razorpayOrderId]);
}

export async function listOrders(opts: { paidOnly?: boolean; limit?: number } = {}): Promise<Order[]> {
  const { rows } = await pool.query<OrderRow>(`select * from public.shop_orders ${opts.paidOnly ? "where status = 'paid'" : ""} order by created_at desc limit $1`, [opts.limit ?? 500]);
  return rows.map(orderFrom);
}

/** A customer's own orders: placed while signed in, or with the same email. */
export async function ordersForCustomer(userId: string, email: string): Promise<Order[]> {
  const { rows } = await pool.query<OrderRow>(`select * from public.shop_orders where status <> 'created' and (user_id = $1 or lower(email) = lower($2)) order by created_at desc limit 100`, [userId, email]);
  return rows.map(orderFrom);
}

export async function orderByNumber(number: string): Promise<Order | null> {
  const { rows } = await pool.query<OrderRow>(`select * from public.shop_orders where number = $1`, [number]);
  return rows[0] ? orderFrom(rows[0]) : null;
}

export async function updateOrder(id: string, patch: { fulfilment?: Fulfilment; courier?: string; tracking?: string; adminNotes?: string }): Promise<Order | null> {
  const { rows } = await pool.query<OrderRow>(
    `update public.shop_orders set fulfilment = coalesce($2, fulfilment), courier = coalesce($3, courier), tracking = coalesce($4, tracking), admin_notes = coalesce($5, admin_notes), updated_at = now()
      where id = $1 returning *`,
    [id, patch.fulfilment ?? null, patch.courier?.slice(0, 60) ?? null, patch.tracking?.slice(0, 120) ?? null, patch.adminNotes?.slice(0, 2000) ?? null],
  );
  return rows[0] ? orderFrom(rows[0]) : null;
}
