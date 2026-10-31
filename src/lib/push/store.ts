import "server-only";
import { pool } from "@/health/db";
import type { Subscription } from "./core";

// public.push_subscriptions: one row per browser that turned notifications on.
// Member rows carry the sign-in email; /health visitor rows have none.

export type StoredSubscription = Subscription & { id: string };

/** Saves (or re-activates) this browser for the member. A browser moves to whoever signed in last. */
export async function saveMemberSubscription(email: string, s: Subscription, userAgent: string): Promise<void> {
  await pool.query(
    `insert into public.push_subscriptions (endpoint, keys, email, user_agent)
     values ($1, $2, $3, $4)
     on conflict (endpoint) do update set keys = excluded.keys, email = excluded.email, user_agent = excluded.user_agent,
       updated_at = now(), disabled_at = null, disabled_reason = '', last_error = ''`,
    [s.endpoint, JSON.stringify({ p256dh: s.p256dh, auth: s.auth }), email.toLowerCase(), userAgent.slice(0, 300)],
  );
}

/** The member turned notifications off in this browser. Only their own row is touched. */
export async function disableMemberSubscription(email: string, endpoint: string): Promise<number> {
  const { rowCount } = await pool.query(
    `update public.push_subscriptions set disabled_at = now(), disabled_reason = 'member', updated_at = now()
     where endpoint = $1 and email = $2 and disabled_at is null`,
    [endpoint, email.toLowerCase()],
  );
  return rowCount ?? 0;
}

export async function activeFor(email: string): Promise<StoredSubscription[]> {
  const { rows } = await pool.query<{ id: string; endpoint: string; keys: { p256dh?: string; auth?: string } | null }>(
    `select id, endpoint, keys from public.push_subscriptions where email = $1 and disabled_at is null order by updated_at desc limit 10`,
    [email.toLowerCase()],
  );
  return rows.filter((r) => r.keys?.p256dh && r.keys.auth).map((r) => ({ id: r.id, endpoint: r.endpoint, p256dh: r.keys!.p256dh!, auth: r.keys!.auth! }));
}

export async function recordResult(id: string, result: "sent" | "gone" | { error: string }): Promise<void> {
  if (result === "sent") {
    await pool.query(`update public.push_subscriptions set last_sent_at = now(), last_error = '' where id = $1`, [id]);
  } else if (result === "gone") {
    await pool.query(`update public.push_subscriptions set disabled_at = now(), disabled_reason = 'gone', updated_at = now() where id = $1`, [id]);
  } else {
    await pool.query(`update public.push_subscriptions set last_error = $2 where id = $1`, [id, result.error.slice(0, 300)]);
  }
}
