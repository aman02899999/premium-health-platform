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
