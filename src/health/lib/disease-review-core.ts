// Medical review of the Gemini disease-page drafts: the rules, kept pure so the admin API, the
// public page and the tests share them.
//
// A draft is shown to the public, and indexed, only while it has an approval whose draft_hash
// matches the bundled draft. If the bundle is regenerated and the text changes, the old approval
// no longer applies ("changed since approval") and the page goes back to the noindex template.

import { createHash } from "node:crypto";
import type { Rewrite } from "@/lib/ai/disease-drafts-core";

export type DraftEntry = { name: string; generatedAt: string; notes: string[]; draft: Rewrite };

export type ReviewRow = {
  slug: string;
  status: "approved" | "changes";
  draftHash: string;
  reviewerName: string;
  reviewerQualification: string;
  note: string;
  reviewedAt: string;
};

export type ReviewState = "waiting" | "approved" | "changes" | "outdated";

export const STATE_LABELS: Record<ReviewState, string> = {
  waiting: "Waiting for review",
  approved: "Approved (live)",
  changes: "Changes requested",
  outdated: "Changed since approval",
};

/** Stable fingerprint of a draft's text, so an approval covers exactly what the doctor read. */
export const draftHash = (draft: Rewrite): string => createHash("sha256").update(JSON.stringify(draft)).digest("hex");

export function reviewState(entry: DraftEntry, row: ReviewRow | undefined): ReviewState {
  if (!row) return "waiting";
  if (row.status === "changes") return "changes";
  return row.draftHash === draftHash(entry.draft) ? "approved" : "outdated";
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max + 1) : "");

export type Approval = { reviewerName: string; reviewerQualification: string; reviewerRegistration: string };

/** The doctor's details for an approval, with plain-words errors. */
export function parseApproval(b: Record<string, unknown>): { ok: true; value: Approval } | { ok: false; error: string } {
  const reviewerName = text(b.reviewerName, 80);
  const reviewerQualification = text(b.reviewerQualification, 80);
  const reviewerRegistration = text(b.reviewerRegistration, 60);
  if (!/^dr\.?\s+\S/i.test(reviewerName) || reviewerName.length > 80) return { ok: false, error: "Enter the doctor's name, starting with Dr (for example: Dr Asha Verma)." };
  if (reviewerQualification.length < 2 || reviewerQualification.length > 80) return { ok: false, error: "Enter the doctor's qualification (for example: MBBS, MD)." };
  if (reviewerRegistration.length < 3 || reviewerRegistration.length > 60) return { ok: false, error: "Enter the doctor's medical council registration number." };
  if (b.confirm !== true) return { ok: false, error: "Tick the box to confirm the whole page was read and is medically accurate." };
  return { ok: true, value: { reviewerName, reviewerQualification, reviewerRegistration } };
}

/** What needs changing: required, so the next draft can fix it. */
export function parseChangeNote(b: Record<string, unknown>): { ok: true; note: string } | { ok: false; error: string } {
  const note = typeof b.note === "string" ? b.note.trim().slice(0, 2001) : "";
  if (note.length < 5) return { ok: false, error: "Write what needs changing, so it can be fixed." };
  if (note.length > 2000) return { ok: false, error: "Keep the note under 2,000 characters." };
  return { ok: true, note };
}

/** The line on the public page: name and qualification only (the registration number stays in Admin). */
export function publicReviewLine(row: Pick<ReviewRow, "reviewerName" | "reviewerQualification" | "reviewedAt">): string {
  const date = new Date(row.reviewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  return `Medically reviewed by ${row.reviewerName}${row.reviewerQualification ? `, ${row.reviewerQualification}` : ""} on ${date}`;
}

/** Words in a draft, for the review list. */
export const draftWords = (v: unknown): number =>
  typeof v === "string" ? v.split(/\s+/).filter(Boolean).length : Array.isArray(v) ? v.reduce((n: number, x) => n + draftWords(x), 0) : v && typeof v === "object" ? Object.values(v).reduce((n: number, x) => n + draftWords(x), 0) : 0;
