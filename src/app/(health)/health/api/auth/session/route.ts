import { NextResponse } from "next/server";
import { currentUser, isAdmin, premiumFor } from "@/health/lib/auth/server";
import type { AuthSession, AuthUser } from "@/health/lib/auth";

export const dynamic = "force-dynamic";

/** The verified Supabase session plus premium status from the database. */
export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ user: null, isAuthenticated: false, expires: "" } satisfies AuthSession);
  }
  const [premium, admin] = await Promise.all([premiumFor(user.email), isAdmin()]);
  const full: AuthUser = {
    ...user,
    role: admin ? "admin" : premium.isPremium ? "premium" : "user",
    premiumUntil: premium.expiresAt ?? undefined,
  };
  return NextResponse.json(
    { user: full, isAuthenticated: true, expires: "", isPremium: premium.isPremium, plan: premium.plan } ,
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
