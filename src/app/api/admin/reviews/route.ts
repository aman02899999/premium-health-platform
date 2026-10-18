import { NextResponse } from "next/server";
import { adminIdentity, isAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { adminReviews, decideReview } from "@/lib/reviews/store";

// Admin review moderation. GET: every review, pending first. POST { id, decision: "approved" | "rejected" }.
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    return NextResponse.json({ reviews: await adminReviews() });
  } catch (err) {
    console.error("[admin reviews]", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load reviews. Is the latest database migration applied?" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = (await req.json().catch(() => null)) as { id?: unknown; decision?: unknown } | null;
  const id = typeof b?.id === "string" && /^[0-9a-f-]{36}$/i.test(b.id) ? b.id : "";
  const decision = b?.decision === "approved" || b?.decision === "rejected" ? b.decision : null;
  if (!id || !decision) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const ok = await decideReview(id, decision, (await adminIdentity()) ?? "admin");
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Review not found" }, { status: 404 });
}
