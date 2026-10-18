// Verified reviews: input checks and display helpers (pure; the store does the database work).

export type ReviewInput = { name: string; phone: string; city: string; rating: number; title: string; body: string };
export type VerifiedAs = "member" | "diet-client";
export type PublicReview = { id: string; name: string; city: string; rating: number; title: string; body: string; verifiedAs: VerifiedAs; date: string };

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** The form's fields, checked; a string is the message to show the customer. */
export function parseReview(b: Record<string, unknown>): ReviewInput | string {
  const name = clean(b.name, 80);
  const phone = clean(b.phone, 20).replace(/\D/g, "").slice(-10);
  const rating = Number(b.rating);
  const body = typeof b.body === "string" ? b.body.trim().replace(/\n{3,}/g, "\n\n").slice(0, 1200) : "";
  if (name.length < 2) return "Please enter your name.";
  if (!/^[6-9]\d{9}$/.test(phone)) return "Please enter the 10-digit mobile number you joined with.";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return "Please choose a star rating.";
  if (body.length < 20) return "Please write at least a couple of sentences about your experience.";
  if (/https?:\/\/|www\./i.test(body)) return "Please leave links out of your review.";
  if (b.consent !== true) return "Please confirm that your review can be shown on the website.";
  return { name, phone, city: clean(b.city, 60), rating, title: clean(b.title, 80), body };
}

/** "Rahul Sharma" → "Rahul S.": the full surname and the number are never shown. */
export function displayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export const VERIFIED_LABEL: Record<VerifiedAs, string> = { member: "Verified member", "diet-client": "Verified diet-plan client" };

export function summary(reviews: { rating: number }[]): { count: number; average: number; byStars: number[] } {
  const byStars = [0, 0, 0, 0, 0];
  for (const r of reviews) byStars[r.rating - 1]++;
  const count = reviews.length;
  return { count, average: count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0, byStars };
}
