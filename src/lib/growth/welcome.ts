import "server-only";
import { createClient as createPlainClient, type User } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { trackSignup } from "./resend-events";

// Shared by both sign-in paths: the email link / Google (/auth/callback) and the 6-digit email
// code, which signs in inside the browser and then calls /api/account/welcome.

// Accounts made before this shipped are older than the window, so they never get the series.
const NEW_ACCOUNT_MS = 60 * 60 * 1000;

type WelcomeUser = Pick<User, "email" | "created_at" | "app_metadata">;

export function isFirstSignIn(user: WelcomeUser, now = Date.now()): boolean {
  if (!user.email || user.app_metadata?.welcome_tracked) return false;
  return now - new Date(user.created_at).getTime() < NEW_ACCOUNT_MS;
}

export function firstNameOf(user: Pick<User, "user_metadata">): string | null {
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  return (meta.full_name || meta.name || "").trim().split(/\s+/)[0] || null;
}

export async function welcome(user: User): Promise<void> {
  await trackSignup(user.email!, firstNameOf(user));
  // Flag the account so a second sign-in inside the window doesn't restart the series.
  // Needs the service key; without it the time window alone limits repeats.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!serviceKey) return;
  const admin = createPlainClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await admin.auth.admin.updateUserById(user.id, { app_metadata: { welcome_tracked: true } });
  if (error) console.error("[auth] welcome flag failed:", error.message);
}
