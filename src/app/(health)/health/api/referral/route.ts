import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { currentUser } from "@/health/lib/auth/server";
import { referralsBy, saveReferral } from "@/health/lib/signups";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Invites are recorded against the signed-in user (never an email the browser claims).
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Please sign in to invite friends." }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { referredEmail?: unknown } | null;
  const referred = typeof body?.referredEmail === "string" ? body.referredEmail.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(referred) || referred.length > 120) return NextResponse.json({ ok: false, error: "Enter your friend's email address." }, { status: 400 });
  if (referred === user.email) return NextResponse.json({ ok: false, error: "You can't invite yourself." }, { status: 400 });
  if (!isDbConfigured) return NextResponse.json({ ok: false, error: "Invites are temporarily unavailable." }, { status: 503 });
  try {
    const added = await saveReferral(user.email, referred);
    return NextResponse.json({ ok: true, referral: { referred, status: added ? "recorded" : "already-invited" } });
  } catch (err) {
    console.error("[referral] save failed:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "Couldn't record the invite. Please try again." }, { status: 500 });
  }
}

/** The signed-in user's own invites. */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ ok: true, referrals: [], count: 0 });
  const referrals = await referralsBy(user.email);
  return NextResponse.json({ ok: true, referrals, count: referrals.length });
}
