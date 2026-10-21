// What happened to a message after it left: the pure half (parsing and rules), tested without a
// database. The database half is tracking.ts.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type Delivery = "delivered" | "read" | "failed" | "bounced" | "complained";

/** A later status only replaces an earlier one that it outranks (Meta may deliver them out of order). */
const RANK: Record<Delivery, number> = { delivered: 1, read: 2, failed: 3, bounced: 3, complained: 4 };
export const outranks = (next: Delivery, current: Delivery | null) => !current || RANK[next] > RANK[current];

// ── WhatsApp (Meta's "statuses" in the messages webhook) ────────────────────────────────

export type WaStatus = { id: string; status: "sent" | "delivered" | "read" | "failed"; at: Date; recipient: string; code: string | null; reason: string | null };

type RawStatus = { id?: string; status?: string; timestamp?: string; recipient_id?: string; errors?: { code?: number; title?: string; message?: string; error_data?: { details?: string } }[] };
type Body = { object?: string; entry?: { changes?: { field?: string; value?: unknown }[] }[] };

export function parseStatuses(body: Body): WaStatus[] {
  if (body.object !== "whatsapp_business_account") return [];
  const out: WaStatus[] = [];
  for (const e of body.entry ?? [])
    for (const c of e.changes ?? []) {
      if (c.field !== "messages") continue;
      for (const s of (c.value as { statuses?: RawStatus[] } | undefined)?.statuses ?? []) {
        if (!s.id || !s.recipient_id || !["sent", "delivered", "read", "failed"].includes(s.status ?? "")) continue;
        const err = s.errors?.[0];
        const secs = Number(s.timestamp);
        out.push({
          id: s.id.slice(0, 200),
          status: s.status as WaStatus["status"],
          at: Number.isFinite(secs) && secs > 0 ? new Date(secs * 1000) : new Date(),
          recipient: s.recipient_id.replace(/\D/g, ""),
          code: err?.code != null ? String(err.code) : null,
          reason: err ? (err.error_data?.details || err.message || err.title || "").slice(0, 300) : null,
        });
      }
    }
  return out;
}

/**
 * What a failure means for the number. 131026: it can't receive WhatsApp messages (not on
 * WhatsApp, or an old app) — campaigns stop paying for it. 131050: the person turned off
 * marketing messages in WhatsApp itself — the same as tapping "Stop promotions".
 * Anything else (131049 frequency limits, outages, template problems) is not about the number.
 */
export function failureEffect(code: string | null): "unreachable" | "opted-out" | null {
  if (code === "131026") return "unreachable";
  if (code === "131050") return "opted-out";
  return null;
}

// ── Email (Resend webhooks, signed by Svix) ─────────────────────────────────────────────

export type EmailEvent = { emailId: string; type: "delivered" | "bounced" | "complained" | "opened" | "clicked"; at: Date; link: string | null; reason: string | null };

const RESEND_TYPES: Record<string, EmailEvent["type"]> = {
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.opened": "opened",
  "email.clicked": "clicked",
};

export function parseResendEvent(body: unknown): EmailEvent | null {
  const b = body as { type?: string; created_at?: string; data?: { email_id?: string; click?: { link?: string }; bounce?: { message?: string } } };
  const type = RESEND_TYPES[b?.type ?? ""];
  if (!type || !b.data?.email_id) return null;
  const at = new Date(b.created_at ?? "");
  return { emailId: b.data.email_id.slice(0, 200), type, at: Number.isNaN(at.getTime()) ? new Date() : at, link: b.data.click?.link?.slice(0, 1000) ?? null, reason: b.data.bounce?.message?.slice(0, 300) ?? null };
}

/** Svix signature check (Resend webhooks): "v1,<base64 HMAC-SHA256 of id.timestamp.body>". */
export function verifySvix(secret: string, id: string | null, timestamp: string | null, signature: string | null, body: string, now = Date.now()): boolean {
  if (!secret || !id || !timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(now / 1000 - ts) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const want = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();
  return signature.split(" ").some((part) => {
    const [v, sig] = part.split(",");
    if (v !== "v1" || !sig) return false;
    const got = Buffer.from(sig, "base64");
    return got.length === want.length && timingSafeEqual(got, want);
  });
}

// ── Tracked links ───────────────────────────────────────────────────────────────────────

const B62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** A short, stable code per message (the same dedupe key always gets the same code). */
export function linkCode(dedupeKey: string): string {
  // 48 bits of the hash: ~281 trillion codes, and still exact in a JS number.
  let n = parseInt(createHash("sha256").update(dedupeKey).digest("hex").slice(0, 12), 16);
  let s = "";
  for (let i = 0; i < 9; i++) {
    s = B62[n % 62] + s;
    n = Math.floor(n / 62);
  }
  return s;
}

export const trackedUrl = (siteUrl: string, code: string) => `${siteUrl}/r/${code}`;

/**
 * Link previews and scanners open links without a person: WhatsApp and Facebook fetch a preview
 * when the message arrives, mail security scanners check links. Those don't count as clicks.
 */
const BOTS = /whatsapp|facebookexternalhit|facebot|bot\b|bot\/|crawler|spider|preview|slurp|scanner|safelinks|proofpoint|mimecast|barracuda|headless|curl|wget|python-requests|go-http-client|okhttp/i;
export const isBot = (userAgent: string | null) => !userAgent || BOTS.test(userAgent);
