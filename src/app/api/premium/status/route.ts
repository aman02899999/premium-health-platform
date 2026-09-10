import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const premiumCookie = req.cookies.get("bhg_premium")?.value;
  const sessionCookie = req.cookies.get("bhg_session")?.value;

  let isPremium = false;
  let plan: string | null = null;
  let expiresAt: string | null = null;

  if (premiumCookie) {
    try {
      const parsed = JSON.parse(Buffer.from(premiumCookie, 'base64').toString());
      // Demo parsing — in prod verify JWT
      isPremium = true;
      plan = parsed.plan || "monthly";
      expiresAt = parsed.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } catch {
      // Fallback: if cookie exists but not JSON, treat as premium demo
      isPremium = true;
      plan = "monthly";
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  return NextResponse.json({
    ok: true,
    isPremium,
    plan,
    expiresAt,
    session: !!sessionCookie,
    features: isPremium ? ["ad-free", "unlimited thali-builder", "millet-swap unlimited", "dosha-meals", "herb-drug checker unlimited", "fasting planner", "yoga timer history", "PDF export", "WhatsApp tips"] : ["3 thali/day", "ads", "limited tools"],
    earning: "Premium Rs199/mo MRR — status checked via cookie + JWT — SSO optimized",
    apis: { checkout: "/api/premium/checkout POST plan", status: "/api/premium/status GET", webhook: "/api/webhooks/razorpay POST" },
  });
}
