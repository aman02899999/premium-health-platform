import "server-only";
import { pool } from "@/health/db";

// Durable storage for health-site sign-ups (these used to live in server memory and were
// lost on every restart). Server-only tables: RLS on, no policies, direct connection.

const cut = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

export type Utm = { utm_source?: unknown; utm_medium?: unknown; utm_campaign?: unknown };

/** Saves an email or WhatsApp contact. Returns "added", or "exists" if already subscribed. */
export async function saveContact(channel: "email" | "whatsapp", address: string, extra: Utm & { name?: unknown; source?: unknown }): Promise<"added" | "exists"> {
  const { rows } = await pool.query<{ inserted: boolean }>(
    `insert into public.marketing_contacts (channel, address, name, source, utm_source, utm_medium, utm_campaign, consent_at)
     values ($1, $2, $3, $4, $5, $6, $7, now())
     on conflict (channel, address) do update set unsubscribed_at = null, consent_at = case when marketing_contacts.unsubscribed_at is null then marketing_contacts.consent_at else now() end
     returning (xmax = 0) as inserted`,
    [channel, address, cut(extra.name, 100), cut(extra.source, 100), cut(extra.utm_source, 100), cut(extra.utm_medium, 100), cut(extra.utm_campaign, 100)],
  );
  return rows[0]?.inserted ? "added" : "exists";
}

export async function contactStats(): Promise<{ email: number; whatsapp: number; recent: { channel: string; address: string; createdAt: string; source: string | null }[] }> {
  const [counts, recent] = await Promise.all([
    pool.query<{ channel: string; n: string }>(`select channel, count(*)::text as n from public.marketing_contacts where unsubscribed_at is null group by channel`),
    pool.query<{ channel: string; address: string; created_at: Date; source: string | null }>(`select channel, address, created_at, coalesce(utm_source, source) as source from public.marketing_contacts order by created_at desc limit 50`),
  ]);
  const n = (c: string) => Number(counts.rows.find((r) => r.channel === c)?.n ?? 0);
  return { email: n("email"), whatsapp: n("whatsapp"), recent: recent.rows.map((r) => ({ channel: r.channel, address: r.address, createdAt: r.created_at.toISOString(), source: r.source })) };
}

export async function savePushSubscription(endpoint: string, keys: unknown, utmSource: unknown): Promise<void> {
  await pool.query(
    `insert into public.push_subscriptions (endpoint, keys, utm_source) values ($1, $2, $3) on conflict (endpoint) do update set keys = excluded.keys`,
    [endpoint, keys ? JSON.stringify(keys) : null, cut(utmSource, 100)],
  );
}

export async function countPushSubscriptions(): Promise<number> {
  const { rows } = await pool.query<{ n: string }>(`select count(*)::text as n from public.push_subscriptions`);
  return Number(rows[0]?.n ?? 0);
}

export async function saveAffiliateClick(productId: string, utm: Utm): Promise<void> {
  await pool.query(`insert into public.affiliate_clicks (product_id, utm_source, utm_medium, utm_campaign) values ($1, $2, $3, $4)`, [productId.slice(0, 100), cut(utm.utm_source, 100), cut(utm.utm_medium, 100), cut(utm.utm_campaign, 100)]);
}

export async function affiliateClickStats(productId: string | null, days = 30): Promise<{ total: number; byProduct: Record<string, number> }> {
  const { rows } = await pool.query<{ product_id: string; n: string }>(
    `select product_id, count(*)::text as n from public.affiliate_clicks where created_at > now() - ($1::int * interval '1 day') ${productId ? "and product_id = $2" : ""} group by product_id`,
    productId ? [days, productId] : [days],
  );
  const byProduct = Object.fromEntries(rows.map((r) => [r.product_id, Number(r.n)]));
  return { total: Object.values(byProduct).reduce((a, b) => a + b, 0), byProduct };
}

/** Records an invite. Returns false when this person already invited that email. */
export async function saveReferral(referrerEmail: string, referredEmail: string): Promise<boolean> {
  const { rowCount } = await pool.query(`insert into public.health_referrals (referrer_email, referred_email) values ($1, $2) on conflict do nothing`, [referrerEmail, referredEmail]);
  return (rowCount ?? 0) > 0;
}

export async function referralsBy(email: string): Promise<{ referred: string; createdAt: string; status: string }[]> {
  const { rows } = await pool.query<{ referred_email: string; created_at: Date; status: string }>(`select referred_email, created_at, status from public.health_referrals where referrer_email = $1 order by created_at desc limit 100`, [email]);
  return rows.map((r) => ({ referred: r.referred_email, createdAt: r.created_at.toISOString(), status: r.status }));
}
