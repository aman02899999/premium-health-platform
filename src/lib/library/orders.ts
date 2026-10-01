import "server-only";
import { randomBytes } from "crypto";
import { pool } from "@/health/db";
import { ACCESS_DAYS, DOWNLOADS_PER_BOOK, type BuyerForm, type LibraryQuote } from "./pricing";

// public.book_orders is server-only (RLS on, no policies): reached through the
// direct database connection, like membership_orders.

export type BookOrder = {
  id: string;
  createdAt: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  status: "created" | "paid" | "failed";
  itemId: string;
  title: string;
  slugs: string[];
  amountPaise: number;
  name: string;
  email: string;
  phone: string;
  accessToken: string;
  downloads: Record<string, number>;
  paidAt: string | null;
};

type Row = {
  id: string;
  created_at: Date;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  status: BookOrder["status"];
  item_id: string;
  title: string;
  slugs: string[];
  amount_paise: number;
  name: string;
  email: string;
  phone: string;
  access_token: string;
  downloads: Record<string, number> | null;
  paid_at: Date | null;
};

const fromRow = (r: Row): BookOrder => ({
  id: r.id,
  createdAt: r.created_at.toISOString(),
  razorpayOrderId: r.razorpay_order_id,
  razorpayPaymentId: r.razorpay_payment_id,
  status: r.status,
  itemId: r.item_id,
  title: r.title,
  slugs: r.slugs,
  amountPaise: r.amount_paise,
  name: r.name,
  email: r.email,
  phone: r.phone,
  accessToken: r.access_token,
  downloads: r.downloads ?? {},
  paidAt: r.paid_at ? r.paid_at.toISOString() : null,
});

export const newAccessToken = () => randomBytes(24).toString("base64url");

export async function insertBookOrder(razorpayOrderId: string, quote: LibraryQuote, buyer: BuyerForm): Promise<void> {
  await pool.query(
    `insert into public.book_orders (razorpay_order_id, item_id, title, slugs, amount_paise, name, email, phone, access_token)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [razorpayOrderId, quote.itemId, quote.title, quote.slugs, quote.amountPaise, buyer.name, buyer.email, buyer.phone, newAccessToken()],
  );
}

/** Marks an order paid (idempotent). Returns the order, or null if no such order exists. */
export async function markBookPaid(razorpayOrderId: string, paymentId: string): Promise<BookOrder | null> {
  const { rows } = await pool.query<Row>(
    `update public.book_orders
        set status = 'paid', razorpay_payment_id = coalesce(razorpay_payment_id, $2), paid_at = coalesce(paid_at, now())
      where razorpay_order_id = $1
      returning *`,
    [razorpayOrderId, paymentId],
  );
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function markBookFailed(razorpayOrderId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `update public.book_orders set status = 'failed' where razorpay_order_id = $1 and status = 'created'`,
    [razorpayOrderId],
  );
  return (rowCount ?? 0) > 0;
}

/** A paid, unexpired order for this access token. */
export async function orderByToken(token: string): Promise<BookOrder | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const { rows } = await pool.query<Row>(
    `select * from public.book_orders
      where access_token = $1 and status = 'paid' and paid_at > now() - make_interval(days => $2)`,
    [token, ACCESS_DAYS],
  );
  return rows[0] ? fromRow(rows[0]) : null;
}

/** Counts one download of `slug` if the per-book limit allows it. Returns false when the limit is reached. */
export async function claimDownload(orderId: string, slug: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `update public.book_orders
        set downloads = jsonb_set(downloads, array[$2::text], to_jsonb(coalesce((downloads ->> $2)::int, 0) + 1))
      where id = $1 and $2 = any(slugs) and coalesce((downloads ->> $2)::int, 0) < $3`,
    [orderId, slug, DOWNLOADS_PER_BOOK],
  );
  return (rowCount ?? 0) > 0;
}

/** Recover access: paid orders matching both the email and the Razorpay payment id. */
export async function recoverToken(email: string, paymentId: string): Promise<string | null> {
  const { rows } = await pool.query<{ access_token: string }>(
    `select access_token from public.book_orders
      where lower(email) = lower($1) and razorpay_payment_id = $2 and status = 'paid'
      limit 1`,
    [email, paymentId],
  );
  return rows[0]?.access_token ?? null;
}

export async function listBookOrders(limit = 300): Promise<BookOrder[]> {
  const { rows } = await pool.query<Row>(`select * from public.book_orders order by created_at desc limit $1`, [limit]);
  return rows.map(fromRow);
}
