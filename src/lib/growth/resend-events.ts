import "server-only";
import { SITE_URL } from "@/lib/site";
import { formatDate } from "./dates";

// Resend Automations (Resend dashboard → Automations). Each event below starts or stops one:
//   user.signed_up        -> "Welcome Series - New Signup v2" (membership nudge skipped when the
//                            contact's `plan` property is set, which trackMembership does)
//   trial.booked          -> "Free Trial → Member"          (stopped by member.joined)
//   checkout.started      -> "Abandoned Checkout Recovery"  (stopped by member.joined)
//   member.joined         -> "New Member Onboarding (30 days)"
//   membership.expiring   -> "Membership Renewal"           (stopped by member.renewed)
//   member.inactive       -> "Inactive Member Win-back"     (stopped by member.renewed)
// Best-effort: no-op without RESEND_API_KEY, never throws, short timeouts.

const API = () => (process.env.RESEND_API_URL || "https://api.resend.com").replace(/\/$/, "");

async function call(method: "POST" | "PATCH", path: string, body: unknown, quiet = false): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch(`${API()}${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok && !quiet) console.error(`[resend] ${method} ${path} -> ${res.status} ${await res.text().catch(() => "")}`);
    return res.ok;
  } catch (err) {
    console.error(`[resend] ${method} ${path} failed:`, (err as Error).message);
    return false;
  }
}

const norm = (email: string) => email.trim().toLowerCase();

/**
 * Fires an automation event. The contact is created first if it doesn't exist; an existing
 * contact is left as it is (an "already exists" reply is expected, so it isn't logged), which
 * also means a person who unsubscribed stays unsubscribed.
 */
async function fire(event: string, email: string | null | undefined, payload?: Record<string, string>, firstName?: string | null): Promise<void> {
  if (!email) return;
  const to = norm(email);
  await call("POST", "/contacts", { email: to, first_name: firstName || undefined }, true);
  await call("POST", "/events/send", { event, email: to, ...(payload ? { payload } : {}) });
}

const firstWord = (name?: string | null) => (name || "").trim().split(/\s+/)[0] || undefined;

/** First sign-in on the gym site: make sure the contact exists, then start the welcome series. */
export async function trackSignup(email: string, firstName?: string | null): Promise<void> {
  const to = norm(email);
  await call("POST", "/contacts", { email: to, first_name: firstName || undefined, unsubscribed: false }, true);
  await call("POST", "/events/send", { event: "user.signed_up", email: to });
}

/** Paid membership: mark the contact so the automation skips the "join us" email. */
export async function trackMembership(email: string, planName: string): Promise<void> {
  const to = norm(email);
  const properties = { plan: planName || "member" };
  const updated = await call("PATCH", `/contacts/${encodeURIComponent(to)}`, { properties }, true);
  if (!updated) await call("POST", "/contacts", { email: to, properties });
}

/** A free-trial request from the website form, when the person left an email. */
export const trackTrialBooked = (email: string | null, name?: string | null) => fire("trial.booked", email, undefined, firstWord(name));

/** A first-time joiner opened Razorpay. The recovery emails go out only if member.joined doesn't follow. */
export const trackCheckoutStarted = (email: string | null, planName: string, planId: string, name?: string | null) =>
  fire("checkout.started", email, { plan_name: planName, join_url: `${SITE_URL}/join?plan=${encodeURIComponent(planId)}` }, firstWord(name));

/** First paid membership: starts onboarding and stops the trial and checkout sequences. */
export const trackMemberJoined = (email: string | null, planName: string, name?: string | null) => fire("member.joined", email, { plan_name: planName }, firstWord(name));

/** A paid renewal: stops the renewal email sequence. Never send member.joined for a renewal (it restarts onboarding). */
export const trackMemberRenewed = (email: string | null) => fire("member.renewed", email);

/** Seven days before the end date (daily cron). */
export const trackMembershipExpiring = (email: string | null, expiresOn: string, name?: string | null) =>
  fire("membership.expiring", email, { expiry_date: `on ${formatDate(expiresOn)}` }, firstWord(name));

/** A month after a membership ended without a renewal (daily cron). */
export const trackMemberLapsed = (email: string | null, name?: string | null) => fire("member.inactive", email, undefined, firstWord(name));
