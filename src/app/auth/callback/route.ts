import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext, supabaseConfigured } from "@/lib/supabase/config";
import { trackSignup } from "@/lib/growth/resend-events";

// Google (and email links) redirect here via Supabase with a one-time code; swap it for a
// session cookie. Both sites use this one callback, so failures go back to the right login page.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (supabaseConfigured && code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Brand-new gym account (first sign-in within a minute of creation): start the Resend
      // welcome series once. Runs after the redirect so sign-in never waits on it.
      const user = data.user;
      if (user?.email && !next.startsWith("/health")) {
        const created = new Date(user.created_at).getTime();
        const lastSignIn = new Date(user.last_sign_in_at ?? user.created_at).getTime();
        if (Math.abs(lastSignIn - created) < 60_000) {
          const email = user.email;
          const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
          after(() => trackSignup(email, fullName.split(" ")[0] || null));
        }
      }
      return NextResponse.redirect(new URL(next, url.origin));
    }
    console.error("[auth] code exchange failed:", error.message);
  }
  const login = next.startsWith("/health") ? "/health/login" : "/account";
  return NextResponse.redirect(new URL(`${login}?error=signin&next=${encodeURIComponent(next)}`, url.origin));
}
