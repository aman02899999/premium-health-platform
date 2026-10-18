import { NextResponse, after } from "next/server";
import { isDbConfigured } from "@/health/db";
import { dispatch, enqueue } from "@/lib/growth/outbox";
import { submitReview } from "@/lib/reviews/store";
import { parseReview } from "@/lib/reviews/validate";
import { SITE_URL } from "@/lib/site";

// A customer's review: only a member's or a paid diet-plan client's number is accepted, and it
// waits for the admin's approval before it is shown on /reviews.
export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 5;
}

export async function POST(req: Request) {
  if (!isDbConfigured) return NextResponse.json({ error: "Reviews aren't available right now. Please try again later." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  // Honeypot: pretend success so bots don't retry.
  if (typeof body.company === "string" && body.company.trim()) return NextResponse.json({ ok: true });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "Too many attempts. Please try again in a few minutes." }, { status: 429 });

  const parsed = parseReview(body);
  if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 400 });
  try {
    const r = await submitReview(parsed);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
    const coach = process.env.COACH_EMAIL;
    if (coach) {
      after(async () => {
        await enqueue([
          {
            channel: "email",
            to: coach,
            toName: "Coach",
            kind: "review-pending",
            subject: `New ${parsed.rating}★ review from ${parsed.name}: approve it`,
            body: `${parsed.name}${parsed.city ? ` (${parsed.city})` : ""} left a ${parsed.rating}★ review:\n\n${parsed.title ? `${parsed.title}\n` : ""}${parsed.body}\n\nApprove it unless it is spam or abusive. Critical reviews should be published too.\n[[CTA:Review it|${SITE_URL}/admin/reviews]]`,
            template: "",
            params: [],
            dedupeKey: `review-pending:${parsed.phone}:${Date.now()}`,
          },
        ]).catch(() => 0);
        await dispatch(5).catch(() => null);
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reviews]", (err as Error).message);
    return NextResponse.json({ error: "Couldn't save your review. Please try again." }, { status: 500 });
  }
}
