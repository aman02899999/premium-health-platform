import "server-only";
import { createHash } from "node:crypto";
import { SITE_URL } from "@/lib/site";

// Meta Conversions API: the server reports leads and purchases to the same pixel the browser uses.
// Server events still count when an ad blocker stops the pixel, and the shared event id lets Meta
// drop the duplicate when both arrive. Off until NEXT_PUBLIC_META_PIXEL_ID and META_CAPI_TOKEN are set.
// Contact details are sent only as SHA-256 hashes, as Meta requires.

const API = () => (process.env.META_GRAPH_URL || "https://graph.facebook.com/v21.0").replace(/\/$/, "");
export const capiConfigured = () => Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID && process.env.META_CAPI_TOKEN);

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

/** Meta's normalisation: email lowercased and trimmed; phone as digits with the country code. */
export function hashedUser(u: { email?: string | null; phone?: string | null }) {
  const out: Record<string, string[]> = {};
  const email = u.email?.trim().toLowerCase();
  if (email && email.includes("@")) out.em = [sha(email)];
  const d = (u.phone ?? "").replace(/\D/g, "");
  const phone = d.length === 10 ? `91${d}` : d;
  if (phone.length >= 11) out.ph = [sha(phone)];
  return out;
}

/** The browser cookies and headers Meta uses to match the visitor (none of them stored by us). */
export function browserContext(req: Request) {
  const cookies = Object.fromEntries(
    (req.headers.get("cookie") ?? "").split(/;\s*/).filter(Boolean).map((c) => [c.slice(0, c.indexOf("=")), decodeURIComponent(c.slice(c.indexOf("=") + 1))]),
  );
  const ctx: Record<string, string> = {};
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) ctx.client_ip_address = ip;
  const ua = req.headers.get("user-agent");
  if (ua) ctx.client_user_agent = ua.slice(0, 500);
  if (cookies._fbp) ctx.fbp = cookies._fbp;
  if (cookies._fbc) ctx.fbc = cookies._fbc;
  return ctx;
}

export type CapiEvent = {
  name: "Lead" | "Purchase" | "InitiateCheckout";
  /** Same id as the browser pixel's eventID, or the payment id, so Meta counts it once. */
  id: string;
  user: { email?: string | null; phone?: string | null };
  context?: Record<string, string>;
  /** Rupees. */
  value?: number;
  contentName?: string;
  url?: string;
  /** "website" for form leads; "system_generated" for a payment confirmed by Razorpay's webhook. */
  source?: "website" | "system_generated";
};

export function capiPayload(e: CapiEvent, now = new Date()) {
  return {
    data: [
      {
        event_name: e.name,
        event_time: Math.floor(now.getTime() / 1000),
        event_id: e.id.slice(0, 100),
        action_source: e.source ?? "website",
        event_source_url: e.url ?? SITE_URL,
        user_data: { ...hashedUser(e.user), ...(e.context ?? {}) },
        custom_data: {
          ...(e.value !== undefined ? { value: Math.round(e.value * 100) / 100, currency: "INR" } : {}),
          ...(e.contentName ? { content_name: e.contentName.slice(0, 100) } : {}),
        },
      },
    ],
    ...(process.env.META_CAPI_TEST_CODE ? { test_event_code: process.env.META_CAPI_TEST_CODE } : {}),
  };
}

/** Best-effort: never throws, never blocks the sale or the lead. */
export async function sendCapiEvent(e: CapiEvent): Promise<boolean> {
  if (!capiConfigured()) return false;
  try {
    const res = await fetch(`${API()}/${process.env.NEXT_PUBLIC_META_PIXEL_ID}/events`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.META_CAPI_TOKEN}` },
      body: JSON.stringify(capiPayload(e)),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("[meta capi]", e.name, res.status, (await res.text()).slice(0, 300));
    return res.ok;
  } catch (err) {
    console.error("[meta capi]", e.name, (err as Error).message);
    return false;
  }
}
