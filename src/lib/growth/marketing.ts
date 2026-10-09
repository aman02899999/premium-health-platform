import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { pool } from "@/health/db";
import { SITE_URL } from "@/lib/site";

// Marketing-email consent lives in public.marketing_contacts (channel 'email'). Transactional
// emails (order received, your plan) don't need it; nurture emails are sent only with it and
// stop the moment someone unsubscribes.

const secret = () => process.env.UNSUBSCRIBE_SECRET || process.env.SUPABASE_JWT_SECRET || process.env.RAZORPAY_KEY_SECRET || "dev-unsubscribe-secret";
const norm = (email: string) => email.trim().toLowerCase();

export const unsubscribeToken = (email: string) => createHmac("sha256", secret()).update(`unsub:${norm(email)}`).digest("base64url").slice(0, 32);

export function validUnsubscribe(email: string, token: string): boolean {
  const a = Buffer.from(unsubscribeToken(email));
  const b = Buffer.from(String(token));
  return a.length === b.length && timingSafeEqual(a, b);
}

export const unsubscribeUrl = (email: string) => `${SITE_URL}/api/unsubscribe?e=${encodeURIComponent(norm(email))}&t=${unsubscribeToken(email)}`;

export async function recordEmailConsent(email: string, name: string, source: string): Promise<void> {
  // A fresh consent re-subscribes someone who had unsubscribed: they just asked again.
  await pool.query(
    `insert into public.marketing_contacts (channel, address, name, source, consent_at) values ('email', $1, $2, $3, now())
     on conflict (channel, address) do update set consent_at = now(), unsubscribed_at = null, name = coalesce(excluded.name, marketing_contacts.name)`,
    [norm(email), name.slice(0, 100), source.slice(0, 100)],
  );
}

export async function unsubscribe(email: string): Promise<void> {
  await pool.query(
    `insert into public.marketing_contacts (channel, address, source, consent_at, unsubscribed_at) values ('email', $1, 'unsubscribe', now(), now())
     on conflict (channel, address) do update set unsubscribed_at = coalesce(marketing_contacts.unsubscribed_at, now())`,
    [norm(email)],
  );
  // Nothing more goes out to this address.
  await pool.query(`update public.message_outbox set status = 'cancelled' where status = 'pending' and channel = 'email' and kind like 'nurture-%' and lower(to_address) = $1`, [norm(email)]);
}
