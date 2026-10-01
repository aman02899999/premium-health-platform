import "server-only";
import { pool } from "@/health/db";
import type { ReviewInput } from "./review-form";
import type { RatingSummary } from "./reviews-types";

export type { RatingSummary };

// public.book_reviews is server-only (RLS on, no policies). Reviews come only from
// paid orders and are shown only after an admin approves them.

export type BookReview = {
  id: string;
  createdAt: string;
  slug: string;
  rating: number;
  body: string;
  displayName: string;
  city: string | null;
  country: string;
  status: "pending" | "approved" | "rejected";
};

type Row = { id: string; created_at: Date; slug: string; rating: number; body: string; display_name: string; city: string | null; country: string; status: BookReview["status"] };

const fromRow = (r: Row): BookReview => ({
  id: r.id,
  createdAt: r.created_at.toISOString(),
  slug: r.slug,
  rating: r.rating,
  body: r.body,
  displayName: r.display_name,
  city: r.city,
  country: r.country,
  status: r.status,
});


/** Saves (or replaces) a buyer's review of one book; an edited review goes back to pending. */
export async function submitReview(orderId: string, slug: string, r: ReviewInput): Promise<void> {
  await pool.query(
    `insert into public.book_reviews (order_id, slug, rating, body, display_name, city, country)
     values ($1, $2, $3, $4, $5, nullif($6, ''), $7)
     on conflict (order_id, slug) do update
       set rating = excluded.rating, body = excluded.body, display_name = excluded.display_name,
           city = excluded.city, country = excluded.country, status = 'pending', reviewed_at = null, created_at = now()`,
    [orderId, slug, r.rating, r.body, r.displayName, r.city, r.country],
  );
}

/** Ratings this order has already left, by slug. */
export async function reviewsForOrder(orderId: string): Promise<Record<string, { rating: number; status: BookReview["status"] }>> {
  const { rows } = await pool.query<{ slug: string; rating: number; status: BookReview["status"] }>(
    `select slug, rating, status from public.book_reviews where order_id = $1`,
    [orderId],
  );
  return Object.fromEntries(rows.map((r) => [r.slug, { rating: r.rating, status: r.status }]));
}

export async function approvedReviews(slug: string, limit = 50): Promise<BookReview[]> {
  const { rows } = await pool.query<Row>(
    `select * from public.book_reviews where slug = $1 and status = 'approved' order by created_at desc limit $2`,
    [slug, limit],
  );
  return rows.map(fromRow);
}

/** Average rating and count of approved reviews, per book. */
export async function ratingSummaries(): Promise<Record<string, RatingSummary>> {
  const { rows } = await pool.query<{ slug: string; average: string; count: string }>(
    `select slug, avg(rating)::numeric(3,2) as average, count(*) as count from public.book_reviews where status = 'approved' group by slug`,
  );
  return Object.fromEntries(rows.map((r) => [r.slug, { average: Number(r.average), count: Number(r.count) }]));
}

export async function listReviews(limit = 300): Promise<BookReview[]> {
  const { rows } = await pool.query<Row>(
    `select * from public.book_reviews order by (status = 'pending') desc, created_at desc limit $1`,
    [limit],
  );
  return rows.map(fromRow);
}

export async function setReviewStatus(id: string, status: "approved" | "rejected"): Promise<boolean> {
  const { rowCount } = await pool.query(`update public.book_reviews set status = $2, reviewed_at = now() where id = $1`, [id, status]);
  return (rowCount ?? 0) > 0;
}
