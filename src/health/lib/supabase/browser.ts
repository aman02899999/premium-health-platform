"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, cookieOptions, supabaseConfigured } from "./config";
import { startGoogleOAuth } from "@/lib/supabase/oauth";

let client: SupabaseClient | null = null;

/** Shared browser client, or null when Supabase isn't configured (local dev / demo). */
export function getBrowserClient(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY, { cookieOptions });
  return client;
}

/** Resolves with an error message to show, or null once the browser is on its way to Google. */
export async function signInWithGoogle(next = "/health/profile"): Promise<string | null> {
  const supabase = getBrowserClient();
  if (!supabase) return "Sign-in is not configured on this site yet.";
  return startGoogleOAuth(supabase, `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`);
}
