import { NextResponse } from "next/server";
import { orderByToken } from "@/lib/library/orders";
import { parseReviewForm } from "@/lib/library/review-form";
import { submitReview } from "@/lib/library/reviews";

export const dynamic = "force-dynamic";

// A verified buyer reviews a book they bought. The private access token proves the purchase;
// the review stays hidden until an admin approves it.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const token = typeof body.token === "string" ? body.token : "";
  const slug = typeof body.slug === "string" ? body.slug : "";
  const review = parseReviewForm(body);
  if (typeof review === "string") return NextResponse.json({ error: review }, { status: 400 });
  try {
    const order = await orderByToken(token);
    if (!order || !order.slugs.includes(slug)) return NextResponse.json({ error: "Only buyers of this book can review it." }, { status: 403 });
    await submitReview(order.id, slug, review);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[library] review failed:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't save your review right now. Please try again." }, { status: 500 });
  }
}
