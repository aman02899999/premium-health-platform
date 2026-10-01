import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { listReviews, setReviewStatus } from "@/lib/library/reviews";

export const dynamic = "force-dynamic";

// Admin: moderate buyer reviews.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ reviews: await listReviews() });
  } catch (err) {
    console.error("[library] admin reviews failed:", (err as Error).message);
    return NextResponse.json({ reviews: [], error: "Couldn't load reviews from the database." });
  }
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { id?: unknown; status?: unknown; slug?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const status = body?.status === "approved" || body?.status === "rejected" ? body.status : null;
  if (!/^[0-9a-f-]{36}$/.test(id) || !status) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (!(await setReviewStatus(id, status))) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  revalidatePath("/library", "layout");
  return NextResponse.json({ ok: true });
}
