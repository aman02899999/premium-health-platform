import "server-only";
import { pool } from "@/health/db";
import { addDays } from "./dates";
import { reviewRequestEmail, reviewRequestMessage, type Biz, type Draft } from "./messages";

// Google review requests: one ask per person, ever, on WhatsApp and email.
//   - members about a month into their membership (started 21–35 days ago, still active);
//   - diet-plan clients a week after their plan was sent (paid 7–14 days ago).
// The windows are a week or two wide so a missed daily run doesn't skip anyone; the outbox dedupe
// key (per number, per address) keeps it to one ask. Nobody is filtered by how happy they seem:
// Google's policy forbids asking only satisfied customers, and nothing is offered for a review.

export type ReviewCandidate = { name: string; phone: string | null; email: string | null };

/** Only a real review link turns the requests on: the plain Maps link opens the listing, not the review box. */
export function isReviewLink(url: string | undefined, mapsUrl?: string): url is string {
  if (!url || !/^https:\/\//i.test(url.trim())) return false;
  return url.trim() !== (mapsUrl ?? "").trim();
}

export async function reviewCandidates(today: string): Promise<ReviewCandidate[]> {
  const { rows } = await pool.query<ReviewCandidate>(
    `select name, phone, email from public.members
      where reminders and start_on between $1::date and $2::date and expires_on >= $3::date
     union all
     select name, phone, email from public.diet_orders
      where status = 'paid' and stage = 'sent' and paid_at >= $4::date and paid_at < $5::date`,
    [addDays(today, -35), addDays(today, -21), today, addDays(today, -14), addDays(today, -6)],
  );
  return rows;
}

/** WhatsApp for every 10-digit number, email for every address that hasn't unsubscribed; one per person. */
export function reviewDrafts(candidates: ReviewCandidate[], biz: Biz, reviewUrl: string, unsubscribed: Set<string>): Draft[] {
  const phones = new Set<string>();
  const emails = new Set<string>();
  const out: Draft[] = [];
  for (const c of candidates) {
    const phone = (c.phone ?? "").replace(/\D/g, "").slice(-10);
    if (/^[6-9]\d{9}$/.test(phone) && !phones.has(phone)) {
      phones.add(phone);
      out.push(reviewRequestMessage({ name: c.name, phone }, biz, reviewUrl));
    }
    const email = (c.email ?? "").trim().toLowerCase();
    if (email.includes("@") && !emails.has(email) && !unsubscribed.has(email)) {
      emails.add(email);
      out.push(reviewRequestEmail({ name: c.name, email }, biz, reviewUrl));
    }
  }
  return out;
}

/** Today's review requests, or none while no review link is set in Admin → Business. */
export async function dueReviewRequests(today: string, biz: Biz, reviewUrl: string | undefined, mapsUrl: string | undefined): Promise<Draft[]> {
  if (!isReviewLink(reviewUrl, mapsUrl)) return [];
  const candidates = await reviewCandidates(today);
  const emails = candidates.map((c) => (c.email ?? "").trim().toLowerCase()).filter(Boolean);
  const { rows } = emails.length
    ? await pool.query<{ address: string }>(`select address from public.marketing_contacts where channel = 'email' and unsubscribed_at is not null and address = any($1)`, [emails])
    : { rows: [] };
  return reviewDrafts(candidates, biz, reviewUrl.trim(), new Set(rows.map((r) => r.address)));
}
