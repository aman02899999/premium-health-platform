import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext, supabaseConfigured } from "@/lib/supabase/config";
import { claimWelcome, trackSignup } from "@/lib/growth/resend-events";

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
      // Gym sign-ups start the Resend welcome series; the health site has its own onboarding.
      if (!next.startsWith("/health") && data.user) {
        const welcome = await claimWelcome(supabase, data.user);
        if (welcome) after(() => trackSignup(welcome.email, welcome.firstName));
      }
      return NextResponse.redirect(new URL(next, url.origin));
    }
    console.error("[auth] code exchange failed:", error.message);
  }
  const login = next.startsWith("/health") ? "/health/login" : "/account";
  return NextResponse.redirect(new URL(`${login}?error=signin&next=${encodeURIComponent(next)}`, url.origin));
}
