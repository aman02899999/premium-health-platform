// Same Supabase project as the Royal Fitness Club site: one user pool, one Google sign-in.
// Public values: the URL and publishable key are meant to ship to browsers.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

// Set to the parent domain (e.g. ".royalfitnessclub.in") when both sites run on
// subdomains of it: the session cookie is then shared, so one sign-in covers both.
const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN || undefined;
export const cookieOptions = COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : undefined;

/** Only allow same-site relative redirects after sign-in. */
export function safeNext(next: string | null | undefined, fallback = "/health/profile") {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
