// Public values: the URL and publishable key are meant to ship to browsers.
// Access control lives in the database (row-level security), not in secrecy.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

// Set to the parent domain (e.g. ".royalfitnessclub.in") when this site and the
// health platform run on subdomains of it: the session cookie is then shared.
const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN || undefined;
export const cookieOptions = COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : undefined;

// Keys of the per-member rows in public.user_data (mirrors the table's CHECK constraint).
export const SYNC_KEYS = ["rfc-plan", "rfc-food-log", "rfc-food-target", "rfc-progress"] as const;
export type SyncKey = (typeof SYNC_KEYS)[number];

/** Only allow same-site relative redirects after sign-in. */
export function safeNext(next: string | null | undefined, fallback = "/account") {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
