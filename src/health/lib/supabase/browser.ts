"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, cookieOptions, supabaseConfigured } from "./config";

let client: SupabaseClient | null = null;

/** Shared browser client, or null when Supabase isn't configured (local dev / demo). */
export function getBrowserClient(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY, { cookieOptions });
  return client;
}

export async function signInWithGoogle(next = "/health/profile") {
  const supabase = getBrowserClient();
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
}
