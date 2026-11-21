import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminIdentity, adminRole } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { decide, getDraft, listForReview, reviewOf } from "@/health/lib/disease-reviews";
import { parseApproval, parseChangeNote, reviewState } from "@/health/lib/disease-review-core";

// Health page review: a doctor approves Gemini disease-page drafts before they go live.
// GET                         every draft with its review state
// GET ?slug=x                 one draft in full, with its review
// POST { action: "approve", slug, reviewerName, reviewerQualification, reviewerRegistration, confirm: true }
// POST { action: "changes" | "withdraw", slug, note }
export const dynamic = "force-dynamic";

const MAY_REVIEW = new Set(["owner", "manager", "reviewer"]);

async function gate(): Promise<NextResponse | null> {
  const role = await adminRole();
  if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!MAY_REVIEW.has(role)) return NextResponse.json({ error: "Only owners, managers and medical reviewers can open this." }, { status: 403 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  return null;
}

export async function GET(req: Request) {
  const denied = await gate();
  if (denied) return denied;
  const slug = new URL(req.url).searchParams.get("slug");
  try {
    if (slug) {
      const entry = getDraft(slug);
      if (!entry) return NextResponse.json({ error: "That draft doesn't exist." }, { status: 404 });
      const review = await reviewOf(slug);
      return NextResponse.json({ slug, entry, state: reviewState(entry, review), review: review ?? null });
    }
    return NextResponse.json({ drafts: await listForReview() });
  } catch (err) {
    console.error("[health-review]", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load the drafts. Is the latest database migration applied?" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = await gate();
  if (denied) return denied;
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const slug = typeof b?.slug === "string" ? b.slug : "";
  if (!b || !getDraft(slug)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  try {
    let err: string | null;
    if (b.action === "approve") {
      const a = parseApproval(b);
      if (!a.ok) return NextResponse.json({ error: a.error }, { status: 400 });
      err = await decide(slug, { action: "approve", approval: a.value }, await adminIdentity());
    } else if (b.action === "changes" || b.action === "withdraw") {
      const n = parseChangeNote(b);
      if (!n.ok) return NextResponse.json({ error: n.error }, { status: 400 });
      err = await decide(slug, { action: b.action, note: n.note }, await adminIdentity());
    } else return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    // This server shows the change straight away; other servers within a day (page revalidate).
    revalidatePath(`/health/diseases/${slug}`);
    revalidatePath("/health/sitemap.xml");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[health-review] post:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't save. Is the latest database migration applied?" }, { status: 500 });
  }
}
