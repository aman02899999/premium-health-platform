import "server-only";
import { pool } from "@/health/db";
import { addDays } from "./dates";
import { dietTrialReviewEmail, dietTrialReviewMessage, type Biz, type Draft } from "./messages";

// The Day-7 review the 7-day trial plan promises: on day 6–7 after the plan went out, the buyer is
// reminded to send their tracker, waist and a photo to the coach. Once per order (the outbox dedupe
// key); the two-day window means one missed daily run doesn't skip anyone. It's about the buyer's
// own plan, so it goes without a marketing opt-in, but never to an email that unsubscribed.

export type TrialOrder = { id: string; name: string; phone: string; email: string | null };

/** WhatsApp for every 10-digit Indian mobile, email for every address that hasn't unsubscribed. */
export function trialReviewDrafts(orders: TrialOrder[], biz: Biz, coach: string, unsubscribed: Set<string>): Draft[] {
  const out: Draft[] = [];
  for (const o of orders) {
    const phone = o.phone.replace(/\D/g, "").slice(-10);
    if (/^[6-9]\d{9}$/.test(phone)) out.push(dietTrialReviewMessage({ id: o.id, name: o.name, phone }, biz, coach));
    const email = (o.email ?? "").trim().toLowerCase();
    if (email.includes("@") && !unsubscribed.has(email)) out.push(dietTrialReviewEmail({ id: o.id, name: o.name, email }, biz, coach));
  }
  return out;
}

/** Paid 7-day trials whose plan was sent 6 or 7 days ago (India dates). */
export async function trialReviewCandidates(today: string): Promise<TrialOrder[]> {
  const { rows } = await pool.query<TrialOrder>(
    `select id, name, phone, email from public.diet_orders
      where plan = 'trial' and status = 'paid' and stage = 'sent'
        and (sent_at at time zone 'Asia/Kolkata')::date between $1::date and $2::date
      order by sent_at`,
    [addDays(today, -7), addDays(today, -6)],
  );
  return rows;
}

export async function dueTrialReviews(today: string, biz: Biz, coach: string): Promise<Draft[]> {
  const orders = await trialReviewCandidates(today);
  const emails = orders.map((o) => (o.email ?? "").trim().toLowerCase()).filter(Boolean);
  const { rows } = emails.length
    ? await pool.query<{ address: string }>(`select address from public.marketing_contacts where channel = 'email' and unsubscribed_at is not null and address = any($1)`, [emails])
    : { rows: [] };
  return trialReviewDrafts(orders, biz, coach, new Set(rows.map((r) => r.address)));
}
