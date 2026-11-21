import "server-only";
import { cache } from "react";
import { pool, isDbConfigured } from "@/health/db";
import BUNDLE from "@/health/data/disease-drafts.generated.json";
import { draftHash, draftWords, publicReviewLine, reviewState, type Approval, type DraftEntry, type ReviewRow, type ReviewState } from "./disease-review-core";

const DRAFTS = BUNDLE as unknown as Record<string, DraftEntry>;

export const getDraft = (slug: string): DraftEntry | undefined => (Object.hasOwn(DRAFTS, slug) ? DRAFTS[slug] : undefined);
export const draftSlugs = () => Object.keys(DRAFTS);

type Raw = { slug: string; status: "approved" | "changes"; draft_hash: string; reviewer_name: string; reviewer_qualification: string; note: string; reviewed_at: Date | string };
const toRow = (r: Raw): ReviewRow => ({
  slug: r.slug,
  status: r.status,
  draftHash: r.draft_hash,
  reviewerName: r.reviewer_name,
  reviewerQualification: r.reviewer_qualification,
  note: r.note,
  reviewedAt: new Date(r.reviewed_at).toISOString(),
});
const COLS = "slug, status, draft_hash, reviewer_name, reviewer_qualification, note, reviewed_at";

async function rows(where = "", args: unknown[] = []): Promise<Map<string, ReviewRow>> {
  const { rows } = await pool.query<Raw>(`select ${COLS} from public.disease_reviews ${where}`, args);
  return new Map(rows.map((r) => [r.slug, toRow(r)]));
}

/**
 * The approved draft for a public disease page, or null. Fails closed: no database, a missing
 * table or an outdated approval all mean the page keeps the old noindex template.
 */
export const approvedDisease = cache(async (slug: string): Promise<{ draft: DraftEntry["draft"]; reviewLine: string } | null> => {
  const entry = getDraft(slug);
  if (!entry || !isDbConfigured) return null;
  try {
    const row = (await rows("where slug = $1 and status = 'approved'", [slug])).get(slug);
    if (!row || reviewState(entry, row) !== "approved") return null;
    return { draft: entry.draft, reviewLine: publicReviewLine(row) };
  } catch (err) {
    console.error("[disease-reviews] read:", (err as Error).message);
    return null;
  }
});

/** Slugs whose current draft is approved (for the sitemap). Empty on any error. */
export async function approvedDiseaseSlugs(): Promise<string[]> {
  if (!isDbConfigured) return [];
  try {
    const map = await rows("where status = 'approved'");
    return [...map.values()].filter((r) => { const e = getDraft(r.slug); return e && reviewState(e, r) === "approved"; }).map((r) => r.slug);
  } catch (err) {
    console.error("[disease-reviews] slugs:", (err as Error).message);
    return [];
  }
}

export type ReviewListItem = { slug: string; name: string; state: ReviewState; words: number; references: number; generatedAt: string; reviewerName: string; reviewedAt: string | null; note: string };

export async function listForReview(): Promise<ReviewListItem[]> {
  const map = await rows();
  return Object.entries(DRAFTS)
    .map(([slug, e]) => {
      const r = map.get(slug);
      return { slug, name: e.name, state: reviewState(e, r), words: draftWords(e.draft), references: e.draft.references.length, generatedAt: e.generatedAt, reviewerName: r?.reviewerName ?? "", reviewedAt: r?.reviewedAt ?? null, note: r?.note ?? "" };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function reviewOf(slug: string): Promise<ReviewRow | undefined> {
  return (await rows("where slug = $1", [slug])).get(slug);
}

/** Record a decision. Withdrawing an approval keeps the row (status 'changes'), never deletes it. */
export async function decide(slug: string, d: { action: "approve"; approval: Approval } | { action: "changes" | "withdraw"; note: string }, by: string): Promise<string | null> {
  const entry = getDraft(slug);
  if (!entry) return "That draft doesn't exist.";
  const hash = draftHash(entry.draft);
  const client = await pool.connect();
  try {
    await client.query("begin");
    if (d.action === "approve") {
      const a = d.approval;
      await client.query(
        `insert into public.disease_reviews (slug, status, draft_hash, reviewer_name, reviewer_qualification, reviewer_registration, note, reviewed_by, reviewed_at)
         values ($1, 'approved', $2, $3, $4, $5, '', $6, now())
         on conflict (slug) do update set status = 'approved', draft_hash = $2, reviewer_name = $3, reviewer_qualification = $4, reviewer_registration = $5, note = '', reviewed_by = $6, reviewed_at = now()`,
        [slug, hash, a.reviewerName, a.reviewerQualification, a.reviewerRegistration, by],
      );
      await client.query(`insert into public.disease_review_log (slug, action, draft_hash, reviewer_name, reviewed_by) values ($1, 'approved', $2, $3, $4)`, [slug, hash, a.reviewerName, by]);
    } else {
      await client.query(
        `insert into public.disease_reviews (slug, status, draft_hash, note, reviewed_by, reviewed_at) values ($1, 'changes', $2, $3, $4, now())
         on conflict (slug) do update set status = 'changes', draft_hash = $2, note = $3, reviewed_by = $4, reviewed_at = now()`,
        [slug, hash, d.note, by],
      );
      await client.query(`insert into public.disease_review_log (slug, action, draft_hash, note, reviewed_by) values ($1, $2, $3, $4, $5)`, [slug, d.action === "withdraw" ? "withdrawn" : "changes", hash, d.note, by]);
    }
    await client.query("commit");
    return null;
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
