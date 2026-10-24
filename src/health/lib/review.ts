/**
 * What the public sees about medical review.
 *
 * Many guides still carry the old "Medical review pending — placeholder" reviewer string. Showing
 * that word on a health page reads as unfinished work, and naming no doctor as if one had reviewed
 * it would be dishonest. So anything that is not a real reviewer's name is shown as
 * "Not yet medically reviewed".
 */
export const NOT_REVIEWED = "Not yet medically reviewed";

const PENDING = /placeholder|pending|not (yet )?medically reviewed|समीक्षा बाकी/i;

export function isRealReviewer(reviewer?: string | null): reviewer is string {
  const r = reviewer?.trim();
  return !!r && !PENDING.test(r);
}

/** "Medically reviewed by: Dr X" for a real reviewer, otherwise "Not yet medically reviewed". */
export function reviewLine(reviewer?: string | null): string {
  return isRealReviewer(reviewer) ? `Medically reviewed by: ${reviewer.trim()}` : NOT_REVIEWED;
}
