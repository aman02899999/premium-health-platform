import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

export const GOOGLE_OFF_MESSAGE = "Google sign-in isn't switched on yet. Use the email link instead.";

/**
 * Whether Google is enabled in Supabase Auth. Read from the public settings
 * endpoint so a disabled provider shows a message here instead of sending the
 * visitor to Supabase's raw "provider is not enabled" JSON error. Fails open:
 * if the check itself fails, the normal redirect is attempted.
 */
async function googleEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_KEY } });
    if (!res.ok) return true;
    const settings = (await res.json()) as { external?: Record<string, boolean> };
    return settings.external?.google !== false;
  } catch {
    return true;
  }
}

/** Starts Google OAuth; resolves with an error message, or never (the page navigates away). */
export async function startGoogleOAuth(supabase: SupabaseClient, redirectTo: string): Promise<string | null> {
  if (!(await googleEnabled())) return GOOGLE_OFF_MESSAGE;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) return error?.message ?? "Couldn't start Google sign-in. Please try again.";
  window.location.assign(data.url);
  return null;
}
