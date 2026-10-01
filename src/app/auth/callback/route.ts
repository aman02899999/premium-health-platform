import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext, supabaseConfigured } from "@/lib/supabase/config";

// Google (and email links) redirect here via Supabase with a one-time code; swap it for a
// session cookie. Both sites use this one callback, so failures go back to the right login page.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (supabaseConfigured && code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    console.error("[auth] code exchange failed:", error.message);
  }
  const login = next.startsWith("/health") ? "/health/login" : "/account";
  return NextResponse.redirect(new URL(`${login}?error=signin&next=${encodeURIComponent(next)}`, url.origin));
}
