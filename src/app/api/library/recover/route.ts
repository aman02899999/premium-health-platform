import { NextResponse } from "next/server";
import { recoverToken } from "@/lib/library/orders";

export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();

// Lost the download page? Email + Razorpay payment id (from the receipt) brings it back.
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 15 * 60 * 1000);
  hits.push(now);
  recent.set(ip, hits);
  if (hits.length > 6) return NextResponse.json({ error: "Too many attempts — please try again later." }, { status: 429 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const paymentId = typeof body?.paymentId === "string" ? body.paymentId.trim() : "";
  if (!email || !/^pay_[A-Za-z0-9]{6,30}$/.test(paymentId)) {
    return NextResponse.json({ error: "Enter the email you used and the payment ID from your receipt (it starts with pay_)." }, { status: 400 });
  }
  try {
    const token = await recoverToken(email, paymentId);
    if (!token) return NextResponse.json({ error: "No paid order matches that email and payment ID." }, { status: 404 });
    return NextResponse.json({ accessUrl: `/library/access/${token}` });
  } catch (err) {
    console.error("[library] recover failed:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't look that up right now. Please try again." }, { status: 502 });
  }
}
