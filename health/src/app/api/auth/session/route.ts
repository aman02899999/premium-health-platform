import { NextResponse } from "next/server";
import { currentUser, isAdmin, premiumFor } from "@/lib/auth/server";
import type { AuthSession, AuthUser } from "@/lib/auth";

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
