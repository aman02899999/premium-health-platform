"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, cookieOptions, supabaseConfigured } from "./config";
import { startGoogleOAuth } from "./oauth";

let client: SupabaseClient | null = null;

/** Shared browser client, or null when Supabase isn't configured (local dev). */
export function getBrowserClient(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY, { cookieOptions });
  return client;
}

/** Resolves with an error message to show, or null once the browser is on its way to Google. */
export async function signInWithGoogle(next = "/account"): Promise<string | null> {
  const supabase = getBrowserClient();
  if (!supabase) return "Sign-in isn't switched on for this site yet.";
  return startGoogleOAuth(supabase, `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`);
}

/** Emails a one-time sign-in link; resolves with an error message or null on success. */
export async function signInWithEmail(email: string, next = "/account"): Promise<string | null> {
  const supabase = getBrowserClient();
  if (!supabase) return "Sign-in isn't switched on for this site yet.";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  return error ? error.message : null;
}

/** Signs in with the 6-digit code from the sign-in email (when the email template includes {{ .Token }}). */
export async function verifyEmailCode(email: string, code: string): Promise<string | null> {
  const supabase = getBrowserClient();
  if (!supabase) return "Sign-in isn't switched on for this site yet.";
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  return error ? error.message : null;
}
