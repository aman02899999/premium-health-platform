import "server-only";
import { pool } from "@/health/db";
import { dietPlan } from "@/lib/growth/config";
import { mediaLabel } from "@/lib/social/chat";
import { clip, forRole, unreadCount, type Notice } from "./notifications-core";
import type { Role } from "./team-core";

// The bell: the last 3 days of things the desk should know about, newest first. Each source is
// optional, so a table that isn't there yet just adds nothing.

const DAYS = 3;
const MAX = 60;

const many = async <T,>(sql: string, params: unknown[] = []): Promise<T[]> => (await pool.query(sql, params).catch(() => ({ rows: [] as T[] }))).rows as T[];
const iso = (d: Date) => d.toISOString();
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const since = `now() - interval '${DAYS} days'`;

async function events(): Promise<Notice[]> {
  const [messages, handoffs, ai, leads, paid, plans, orders, reviews, failed] = await Promise.all([
    many<{ id: string; at: Date; channel: string; from_id: string; from_name: string; body: string; media_type: string | null }>(
      `select id, created_at as at, channel, from_id, from_name, body, media_type from public.social_inbox
        where kind = 'message' and created_at > ${since} and intent <> 'support' order by created_at desc limit 40`,
    ),
    // A refund, cancellation or complaint the bot handed to a coach.
    many<{ id: string; at: Date; from_id: string; from_name: string; body: string }>(
      `select id, created_at as at, from_id, from_name, body from public.social_inbox
        where channel = 'whatsapp' and kind = 'message' and intent = 'support' and created_at > ${since} order by created_at desc limit 20`,
    ),
    many<{ id: string; at: Date; peer: string; question: string; reason: string }>(
      `select id, created_at as at, peer, question, reason from public.ai_agent_log where source = 'auto' and handoff and sent and created_at > ${since} order by created_at desc limit 20`,
    ),
    many<{ id: string; at: Date; name: string; source: string; interest: string | null }>(
      `select id, created_at as at, name, source, interest from public.leads where created_at > ${since} order by created_at desc limit 20`,
    ),
    many<{ id: string; at: Date; kind: string; name: string; what: string; rupees: number }>(
      `select * from (
         select 'm' || id as id, paid_at as at, 'Membership' as kind, name, plan_name as what, amount_paise / 100.0 as rupees from public.membership_orders where status = 'paid' and paid_at > ${since}
         union all select 'd' || id, paid_at, 'Diet plan', name, plan, amount_paise / 100.0 from public.diet_orders where status = 'paid' and paid_at > ${since}
         union all select 's' || id, paid_at, 'Supplements', name, 'order ' || number, total from public.shop_orders where status = 'paid' and paid_at > ${since}
         union all select 'b' || id, paid_at, 'eBook', name, title, amount_paise / 100.0 from public.book_orders where status = 'paid' and paid_at > ${since}
         union all select 'r' || id, paid_at, 'Payment link', coalesce(nullif(name, ''), 'WhatsApp customer'), purpose, amount_paise / 100.0 from public.payment_requests where status = 'paid' and paid_at > ${since}
       ) p order by at desc limit 20`,
    ),
    many<{ id: string; at: Date; name: string; plan: string }>(
      `select id, paid_at as at, name, plan from public.diet_orders where status = 'paid' and stage in ('new', 'draft_ready') and paid_at > ${since} order by paid_at desc limit 10`,
    ),
    many<{ id: string; at: Date; name: string; number: string }>(
      `select id, paid_at as at, name, number from public.shop_orders where status = 'paid' and fulfilment = 'new' and paid_at > ${since} order by paid_at desc limit 10`,
    ),
    many<{ id: string; at: Date; name: string; rating: number }>(`select id, created_at as at, name, rating from public.reviews where status = 'pending' and created_at > ${since} order by created_at desc limit 10`),
    many<{ id: string; at: Date; to_name: string; kind: string; last_error: string | null }>(
      `select id, created_at as at, to_name, kind, last_error from public.message_outbox where status = 'failed' and created_at > ${since} order by created_at desc limit 10`,
    ),
  ]);

  const chatHref = (peer: string) => `/admin/chats?peer=${peer.replace(/\D/g, "")}`;
  return [
    ...messages.map((m): Notice => ({
      id: `msg:${m.id}`,
      at: iso(m.at),
      kind: "message",
      title: `${m.from_name || (m.channel === "whatsapp" ? `+${m.from_id}` : "Someone")} on ${m.channel === "whatsapp" ? "WhatsApp" : m.channel === "instagram" ? "Instagram" : "Facebook"}`,
      body: clip(m.body || (m.media_type ? mediaLabel(m.media_type) : "")),
      href: m.channel === "whatsapp" ? chatHref(m.from_id) : "/admin/growth?tab=social",
    })),
    ...handoffs.map((m): Notice => ({ id: `support:${m.id}`, at: iso(m.at), kind: "handoff", title: `${m.from_name || `+${m.from_id}`} needs a person (refund, cancellation or complaint)`, body: clip(m.body), href: chatHref(m.from_id) })),
    ...ai.map((a): Notice => ({ id: `ai:${a.id}`, at: iso(a.at), kind: "handoff", title: `The AI agent handed a chat to you${a.reason ? `: ${a.reason}` : ""}`, body: clip(a.question), href: chatHref(a.peer ?? "") })),
    ...leads.map((l): Notice => ({ id: `lead:${l.id}`, at: iso(l.at), kind: "lead", title: `New lead: ${l.name}`, body: [l.interest, l.source].filter(Boolean).join(" · "), href: "/admin/growth?tab=leads" })),
    ...paid.map((p): Notice => ({
      id: `pay:${p.id}`,
      at: iso(p.at),
      kind: "payment",
      title: `${inr(Number(p.rupees))} paid: ${p.kind}`,
      body: `${p.name} · ${p.kind === "Diet plan" ? dietPlan(p.what).name : p.what}`,
      href: p.kind === "Supplements" ? "/admin/shop" : p.kind === "Diet plan" ? "/admin/growth?tab=diet" : "/admin/website?tab=payments",
    })),
    ...plans.map((d): Notice => ({ id: `plan:${d.id}`, at: iso(d.at), kind: "plan", title: `Write ${d.name}'s diet plan`, body: dietPlan(d.plan).name, href: "/admin/growth?tab=diet" })),
    ...orders.map((o): Notice => ({ id: `order:${o.id}`, at: iso(o.at), kind: "order", title: `Pack and ship order ${o.number}`, body: o.name, href: "/admin/shop" })),
    ...reviews.map((r): Notice => ({ id: `review:${r.id}`, at: iso(r.at), kind: "review", title: `${r.rating}★ review from ${r.name} waits for approval`, body: "", href: "/admin/reviews" })),
    ...failed.map((f): Notice => ({ id: `failed:${f.id}`, at: iso(f.at), kind: "failed", title: `A message to ${f.to_name || "a customer"} failed (${f.kind})`, body: clip(f.last_error ?? ""), href: "/admin/growth?tab=messages" })),
  ];
}

export async function seenAt(email: string): Promise<string | null> {
  const r = await many<{ seen_at: Date }>(`select seen_at from public.admin_notification_state where email = $1`, [email.toLowerCase()]);
  return r[0] ? iso(r[0].seen_at) : null;
}

/** The bell for one person: what their role may open, and how much is new since they last looked. */
export async function notificationsFor(email: string, role: Role): Promise<{ items: Notice[]; unread: number; seenAt: string | null }> {
  const [all, seen] = await Promise.all([events(), seenAt(email)]);
  const items = forRole(all, role).slice(0, MAX);
  return { items, unread: unreadCount(items, seen), seenAt: seen };
}

export async function markSeen(email: string): Promise<void> {
  await pool.query(
    `insert into public.admin_notification_state (email, seen_at) values ($1, now()) on conflict (email) do update set seen_at = now()`,
    [email.toLowerCase().slice(0, 200)],
  );
}
