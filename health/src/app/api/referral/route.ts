import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Referral system — earning platform
 * User refers friend → both get premium days / discount
 * Digital marketing: viral loop, UTM, gtag
 */

const referrals = new Map<string, { referrer: string; referred: string; createdAt: string; status: "pending" | "converted" }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { referrerEmail, referredEmail, utm } = body as { referrerEmail?: string; referredEmail?: string; utm?: Record<string, string> };

    if (!referrerEmail || !referredEmail) {
      return NextResponse.json({ ok: false, error: "referrerEmail and referredEmail required" }, { status: 400 });
    }
    if (referrerEmail.toLowerCase() === referredEmail.toLowerCase()) {
      return NextResponse.json({ ok: false, error: "Cannot refer yourself" }, { status: 400 });
    }

    const id = `ref_${Date.now()}`;
    referrals.set(id, {
      referrer: referrerEmail.toLowerCase(),
      referred: referredEmail.toLowerCase(),
      createdAt: new Date().toISOString(),
      status: "pending",
    });

    // In prod: send email to referred, credit referrer, etc.
    return NextResponse.json({
      ok: true,
      referral: { id, referrer: referrerEmail, referred: referredEmail, utm, reward: "Both get 7 days premium free (demo)" },
      message: "Referral created — earning via viral loop",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Referral failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (email) {
    const list = Array.from(referrals.entries())
      .filter(([, r]) => r.referrer === email.toLowerCase() || r.referred === email.toLowerCase())
      .map(([id, r]) => ({ id, ...r }));
    return NextResponse.json({ referrals: list, count: list.length });
  }
  return NextResponse.json({
    endpoint: "/api/referral",
    method: "POST",
    earning: "Referral — viral loop, both get 7 days premium, referrer gets Rs 50 credit after conversion (demo)",
    seo: "Referral increases LTV, reduces CAC",
  });
}
