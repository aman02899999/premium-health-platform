import { NextResponse } from "next/server";
import { createClient } from "@/health/lib/supabase/server";
import { safeNext, supabaseConfigured } from "@/health/lib/supabase/config";

// Google redirects here (via Supabase) with a one-time code; swap it for a session cookie.
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
  return NextResponse.redirect(new URL("/health/login?error=signin", url.origin));
}
