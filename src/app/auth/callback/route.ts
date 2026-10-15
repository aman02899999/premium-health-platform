import { NextResponse, after } from "next/server";
import { createClient as createPlainClient, type User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_URL, safeNext, supabaseConfigured } from "@/lib/supabase/config";
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
      // Gym-site sign-ups start the Resend welcome series; health-platform sign-ins don't.
      if (!next.startsWith("/health") && isFirstSignIn(data.user)) after(() => welcome(data.user));
      return NextResponse.redirect(new URL(next, url.origin));
    }
    console.error("[auth] code exchange failed:", error.message);
  }
  const login = next.startsWith("/health") ? "/health/login" : "/account";
  return NextResponse.redirect(new URL(`${login}?error=signin&next=${encodeURIComponent(next)}`, url.origin));
}

// Accounts made before this shipped are older than the window, so they never get the series.
const NEW_ACCOUNT_MS = 60 * 60 * 1000;

function isFirstSignIn(user: User): boolean {
  if (!user.email || user.app_metadata?.welcome_tracked) return false;
  return Date.now() - new Date(user.created_at).getTime() < NEW_ACCOUNT_MS;
}

async function welcome(user: User): Promise<void> {
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const firstName = (meta.full_name || meta.name || "").trim().split(/\s+/)[0] || null;
  await trackSignup(user.email!, firstName);
  // Flag the account so a second sign-in inside the window doesn't restart the series.
  // Needs the service key; without it the time window alone limits repeats.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!serviceKey) return;
  const admin = createPlainClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await admin.auth.admin.updateUserById(user.id, { app_metadata: { welcome_tracked: true } });
  if (error) console.error("[auth] welcome flag failed:", error.message);
}
