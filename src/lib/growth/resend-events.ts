import "server-only";

// Resend Automations ("Welcome Series - New Signup v2" in the Resend dashboard):
//   user.signed_up -> welcome email -> wait 2 days -> membership nudge, skipped when the
//   contact's `plan` property is set (we set it when a membership is paid).
// Best-effort: no-op without RESEND_API_KEY, never throws, short timeouts.

const API = () => (process.env.RESEND_API_URL || "https://api.resend.com").replace(/\/$/, "");

async function call(method: "POST" | "PATCH", path: string, body: unknown): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch(`${API()}${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error(`[resend] ${method} ${path} -> ${res.status} ${await res.text().catch(() => "")}`);
    return res.ok;
  } catch (err) {
    console.error(`[resend] ${method} ${path} failed:`, (err as Error).message);
    return false;
  }
}

// A Supabase user's first sign-in: the email was confirmed within Supabase's default OTP lifetime
// (Google sign-ups are confirmed when the account is made) and we haven't welcomed them yet.
// The user_metadata flag stops a second device signing in inside that hour from restarting the series.
const FIRST_SIGN_IN_WINDOW_MS = 60 * 60 * 1000;

type AuthUser = { email?: string | null; email_confirmed_at?: string | null; user_metadata?: Record<string, unknown> | null };

export function isFirstSignIn(user: AuthUser, now = Date.now()): boolean {
  if (!user.email || user.user_metadata?.welcome_sent) return false;
  const age = now - Date.parse(user.email_confirmed_at ?? "");
  return age > -60_000 && age < FIRST_SIGN_IN_WINDOW_MS; // NaN (never confirmed) fails both
}

export function firstNameOf(user: AuthUser): string | null {
  const meta = user.user_metadata ?? {};
  const name = String(meta.given_name || meta.full_name || meta.name || "").trim();
  return name.split(/\s+/)[0] || null;
}

type MetadataClient = { auth: { updateUser(attrs: { data: Record<string, unknown> }): PromiseLike<{ error: unknown }> } };

/**
 * Marks a brand-new user as welcomed (with their own session) and returns the details to send, or
 * null when there's nothing to do. Cheap enough to run inline; send the result with trackSignup.
 */
export async function claimWelcome(supabase: MetadataClient, user: AuthUser): Promise<{ email: string; firstName: string | null } | null> {
  if (!process.env.RESEND_API_KEY || !isFirstSignIn(user)) return null;
  const { error } = await supabase.auth.updateUser({ data: { welcome_sent: true } });
  if (error) {
    console.error("[resend] couldn't flag the welcome:", (error as Error).message);
    return null;
  }
  return { email: user.email!, firstName: firstNameOf(user) };
}

/** First sign-in on the gym site: make sure the contact exists, then start the welcome series. */
export async function trackSignup(email: string, firstName?: string | null): Promise<void> {
  await call("POST", "/contacts", { email, first_name: firstName || undefined, unsubscribed: false });
  await call("POST", "/events/send", { event: "user.signed_up", email });
}

/** Paid membership: mark the contact so the automation skips the "join us" email. */
export async function trackMembership(email: string, planName: string): Promise<void> {
  const properties = { plan: planName || "member" };
  const updated = await call("PATCH", `/contacts/${encodeURIComponent(email)}`, { properties });
  if (!updated) await call("POST", "/contacts", { email, properties });
}
