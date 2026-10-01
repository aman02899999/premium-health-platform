import { NextResponse } from "next/server";
import { currentUser, premiumFor } from "@/health/lib/auth/server";

export const dynamic = "force-dynamic";

const PREMIUM_FEATURES = ["ad-free", "unlimited thali-builder", "millet-swap unlimited", "dosha-meals", "herb-drug checker unlimited", "fasting planner", "yoga timer history", "PDF export", "WhatsApp tips"];
const FREE_FEATURES = ["3 thali/day", "ads", "limited tools"];

/** Premium is read from health.premium_subscriptions for the signed-in account — never from a cookie. */
export async function GET() {
  const user = await currentUser();
  const premium = user ? await premiumFor(user.email) : { isPremium: false, plan: null, expiresAt: null };
  return NextResponse.json(
    {
      ok: true,
      ...premium,
      session: Boolean(user),
      features: premium.isPremium ? PREMIUM_FEATURES : FREE_FEATURES,
      apis: { checkout: "/health/api/premium/checkout POST plan", status: "/health/api/premium/status GET" },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
