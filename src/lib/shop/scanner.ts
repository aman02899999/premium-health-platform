import "server-only";
import type { PoolClient } from "pg";
import { pool } from "@/health/db";

// Royal Supplements: barcodes and stock changes made from the admin scanner. Every stock change runs
// in a transaction that names its reason, and the database trigger writes it to shop_stock_moves.

export type Barcode = { code: string; productId: string; variant: string };
export type StockReason = "stock-in" | "count" | "sold" | "damaged" | "returned" | "other";
export const STOCK_REASONS: StockReason[] = ["stock-in", "count", "sold", "damaged", "returned", "other"];
export type StockMove = { id: number; at: string; productId: string | null; productName: string; delta: number; stockAfter: number; reason: string; note: string };

type BarcodeRow = { code: string; product_id: string; variant: string };
const barcodeFrom = (r: BarcodeRow): Barcode => ({ code: r.code, productId: r.product_id, variant: r.variant });

export async function listBarcodes(): Promise<Barcode[]> {
  const { rows } = await pool.query<BarcodeRow>(`select code, product_id, variant from public.shop_barcodes order by created_at`);
  return rows.map(barcodeFrom);
}

export async function findBarcode(code: string): Promise<Barcode | null> {
  const { rows } = await pool.query<BarcodeRow>(`select code, product_id, variant from public.shop_barcodes where code = $1`, [code]);
  return rows[0] ? barcodeFrom(rows[0]) : null;
}

/**
 * Puts a code on a product. A code already on another product is refused (returns a message)
 * unless `move` is set, so a wrong tap can't silently steal another product's barcode.
 */
export async function linkBarcode(code: string, productId: string, variant: string, move = false): Promise<string | null> {
  const { rows: p } = await pool.query<{ id: string }>(`select id from public.shop_products where id = $1`, [productId]);
  if (!p[0]) return "That product no longer exists.";
  const existing = await findBarcode(code);
  if (existing && existing.productId !== productId && !move) {
    const { rows } = await pool.query<{ name: string }>(`select name from public.shop_products where id = $1`, [existing.productId]);
    return `This barcode is already on “${rows[0]?.name ?? "another product"}”.`;
  }
  await pool.query(
    `insert into public.shop_barcodes (code, product_id, variant) values ($1, $2, $3)
       on conflict (code) do update set product_id = excluded.product_id, variant = excluded.variant`,
    [code, productId, variant.trim().slice(0, 60)],
  );
  return null;
}

async function inTx<T>(reason: StockReason, note: string, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`select set_config('shop.stock_reason', $1, true), set_config('shop.stock_note', $2, true)`, [reason, note.trim().slice(0, 300)]);
    const out = await fn(client);
    await client.query("commit");
    return out;
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Adds (qty > 0) or takes away (qty < 0) units. Taking away more than is in stock is refused
 * with a message, so a mistyped number can't hide a real shortage.
 */
export async function changeStock(productId: string, qty: number, reason: StockReason, note = ""): Promise<{ stock: number } | string> {
  if (!Number.isInteger(qty) || qty === 0 || Math.abs(qty) > 100_000) return "Enter a whole number of units.";
  return inTx(reason, note, async (c) => {
    const { rows } = await c.query<{ stock: number; name: string }>(`select stock, name from public.shop_products where id = $1 for update`, [productId]);
    if (!rows[0]) return "That product no longer exists.";
    if (rows[0].stock + qty < 0) return `Only ${rows[0].stock} of ${rows[0].name} in stock.`;
    const { rows: up } = await c.query<{ stock: number }>(`update public.shop_products set stock = stock + $2, updated_at = now() where id = $1 returning stock`, [productId, qty]);
    return { stock: up[0].stock };
  });
}

/** Sets the counted number for each product in one go (a shelf count). Unchanged ones leave no history. */
export async function applyCount(counts: { productId: string; qty: number }[], note = ""): Promise<{ changed: number } | string> {
  if (!counts.length || counts.length > 2000) return "Nothing to save.";
  if (counts.some((c) => !Number.isInteger(c.qty) || c.qty < 0 || c.qty > 1_000_000)) return "Counts must be whole numbers, 0 or more.";
  return inTx("count", note, async (c) => {
    let changed = 0;
    for (const { productId, qty } of counts) {
      const { rowCount } = await c.query(`update public.shop_products set stock = $2, updated_at = now() where id = $1 and stock <> $2`, [productId, qty]);
      changed += rowCount ?? 0;
    }
    return { changed };
  });
}

type MoveRow = { id: string; created_at: Date; product_id: string | null; product_name: string; delta: number; stock_after: number; reason: string; note: string };

export async function listStockMoves(productId?: string, limit = 50): Promise<StockMove[]> {
  const { rows } = await pool.query<MoveRow>(
    `select * from public.shop_stock_moves where ($1::uuid is null or product_id = $1) order by created_at desc, id desc limit $2`,
    [productId ?? null, Math.max(1, Math.min(500, limit))],
  );
  return rows.map((r) => ({ id: Number(r.id), at: r.created_at.toISOString(), productId: r.product_id, productName: r.product_name, delta: r.delta, stockAfter: r.stock_after, reason: r.reason, note: r.note }));
}
