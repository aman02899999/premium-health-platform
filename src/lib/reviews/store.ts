import "server-only";
import { pool } from "@/health/db";
import { displayName, type PublicReview, type ReviewInput, type VerifiedAs } from "./validate";

/** Members first, then paid diet-plan clients; null when the number has never bought anything. */
export async function verifyCustomer(phone: string): Promise<VerifiedAs | null> {
  const { rows } = await pool.query<{ k: VerifiedAs }>(
    `select 'member' as k from public.members where phone = $1
     union all select 'diet-client' from public.diet_orders where phone = $1 and status = 'paid'
     limit 1`,
    [phone],
  );
  return rows[0]?.k ?? null;
}

export type SubmitResult = { ok: true; verifiedAs: VerifiedAs } | { ok: false; error: string; status: number };

/** Saves the review as pending. One per customer: resubmitting replaces it and it waits for approval again. */
export async function submitReview(r: ReviewInput): Promise<SubmitResult> {
  const verifiedAs = await verifyCustomer(r.phone);
  if (!verifiedAs) return { ok: false, status: 403, error: "We couldn't find a membership or plan on this number. Reviews are only from our members and plan clients: use the number you joined with, or WhatsApp us." };
  await pool.query(
    `insert into public.reviews (name, phone, city, rating, title, body, verified_as) values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (phone) do update set name = excluded.name, city = excluded.city, rating = excluded.rating, title = excluded.title,
       body = excluded.body, verified_as = excluded.verified_as, status = 'pending', created_at = now(), decided_at = null, decided_by = ''`,
    [r.name, r.phone, r.city, r.rating, r.title, r.body, verifiedAs],
  );
  return { ok: true, verifiedAs };
}

type Row = { id: string; name: string; city: string; rating: number; title: string; body: string; verified_as: VerifiedAs; created_at: Date };
const toPublic = (r: Row): PublicReview => ({ id: r.id, name: displayName(r.name), city: r.city, rating: r.rating, title: r.title, body: r.body, verifiedAs: r.verified_as, date: r.created_at.toISOString().slice(0, 10) });

/** Approved reviews, newest first. Every approved review is shown, whatever its rating. */
export async function approvedReviews(limit = 200): Promise<PublicReview[]> {
  const { rows } = await pool.query<Row>(`select id, name, city, rating, title, body, verified_as, created_at from public.reviews where status = 'approved' order by created_at desc limit $1`, [limit]);
  return rows.map(toPublic);
}

export type AdminReview = PublicReview & { fullName: string; phone: string; status: "pending" | "approved" | "rejected" };

export async function adminReviews(): Promise<AdminReview[]> {
  const { rows } = await pool.query<Row & { phone: string; status: AdminReview["status"] }>(
    `select id, name, phone, city, rating, title, body, verified_as, status, created_at from public.reviews order by (status = 'pending') desc, created_at desc limit 500`,
  );
  return rows.map((r) => ({ ...toPublic(r), fullName: r.name, phone: r.phone, status: r.status }));
}

export async function decideReview(id: string, status: "approved" | "rejected", by: string): Promise<boolean> {
  const { rowCount } = await pool.query(`update public.reviews set status = $2, decided_at = now(), decided_by = $3 where id = $1`, [id, status, by.slice(0, 200)]);
  return rowCount === 1;
}
