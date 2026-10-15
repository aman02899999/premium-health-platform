import "server-only";
import { getContent } from "@/lib/content/store";
import { SITE_URL } from "@/lib/site";
import { todayIST } from "./dates";
import { nurtureLeads, openLeads } from "./leads";
import { nurtureDrafts, type NurtureBiz } from "./nurture";
import { membersNearExpiry } from "./members";
import { dueMessages, type Biz } from "./messages";
import { dispatch, enqueue } from "./outbox";
import { coachPostEmail, dailyPost } from "./daily-posts";
import { runFacebook, runInstagram } from "@/lib/social/automation";
import { pool } from "@/health/db";
import { getAllEnrichedArticles } from "@/health/data/blog-enrichment";
import { NEWSLETTER_SOURCES, isSunday, weeklyNewsletter } from "./newsletter";
import { adminDigest, type DigestData } from "./admin-digest";
import { dietPlan } from "./config";
import { addDays } from "./dates";

export async function business(): Promise<Biz> {
  const b = (await getContent()).business;
  return { name: b.name, phone: b.phone, siteUrl: SITE_URL };
}

/** Business details the marketing emails need (WhatsApp link, coach, lowest membership price). */
export async function nurtureBusiness(): Promise<NurtureBiz> {
  const c = await getContent();
  // "Membership starts at ₹X a month": the one-month plan's price, if there is one.
  const monthly = (c.plans ?? []).find((p) => /^\s*1\s*month/i.test(p.duration) && p.price > 0);
  return {
    name: c.business.name,
    phone: c.business.phone,
    whatsapp: c.business.whatsapp || c.business.phone.replace(/\D/g, ""),
    siteUrl: SITE_URL,
    coach: `Coach ${(c.trainers?.[0]?.name || "Aman Sharma").replace(/^coach\s+/i, "")}`,
    membershipFrom: monthly?.price,
    address: [c.business.address?.street, c.business.address?.locality, `${c.business.address?.city ?? ""} ${c.business.address?.postalCode ?? ""}`.trim()].filter(Boolean).join(", "),
  };
}

/**
 * The daily automation: queue every reminder and follow-up that is due, then send what the
 * WhatsApp API can send. Safe to run more than once a day (the outbox dedupes).
 */
export async function runDaily(now = new Date()) {
  const today = todayIST(now);
  const [biz, members, leads, nb, nl] = await Promise.all([business(), membersNearExpiry(today), openLeads(today), nurtureBusiness(), nurtureLeads(today)]);
  const drafts = [...dueMessages(today, members, leads, biz), ...nurtureDrafts(today, nl, nb)];
  // The day's marketing post goes to the coach's inbox each morning, ready to copy.
  const coach = process.env.COACH_EMAIL;
  if (coach) {
    drafts.push(coachPostEmail(dailyPost(today, nb), coach, `${SITE_URL}/admin/growth?tab=marketing`));
    // The morning summary: payments, leads and anything that needs a person.
    drafts.push(adminDigest(today, await digestData(today), coach, `${SITE_URL}/admin/growth`));
  }
  // Sundays: the "Indian Health Weekly" to everyone who signed up for it on /health.
  if (isSunday(today)) {
    const { rows } = await pool.query<{ address: string }>(
      `select address from public.marketing_contacts where channel = 'email' and unsubscribed_at is null and consent_at is not null and source = any($1)`,
      [NEWSLETTER_SOURCES],
    );
    const articles = getAllEnrichedArticles().map((a) => ({ slug: a.slug, title: a.title, excerpt: a.excerpt }));
    for (const r of rows) {
      const d = weeklyNewsletter(today, r.address, articles, SITE_URL);
      if (d) drafts.push(d);
    }
  }
  const queued = await enqueue(drafts);
  const sent = await dispatch();
  // The same post goes on Instagram by itself once INSTAGRAM_ACCESS_TOKEN is set.
  const social = await runInstagram(now, nb).catch((err) => ({ instagram: `error: ${(err as Error).message}` }));
  const fb = await runFacebook(now, nb).catch((err) => ({ facebook: `error: ${(err as Error).message}` }));
  return { today, due: drafts.length, queued, ...sent, ...social, ...fb };
}

/** The last 24 hours, for the admin's morning email. Each source is optional (a missing table reads as empty). */
async function digestData(today: string): Promise<DigestData> {
  const q = async <T,>(sql: string, params: unknown[] = []): Promise<T[]> => (await pool.query(sql, params).catch(() => ({ rows: [] as T[] }))).rows as T[];
  const since = "now() - interval '24 hours'";
  const [leads, members, diets, shop, books, review, updates, unanswered, expiring, failed] = await Promise.all([
    q<{ name: string; source: string }>(`select name, source from public.leads where created_at > ${since} order by created_at desc limit 50`),
    q<{ name: string; plan_name: string; amount_paise: number }>(`select name, plan_name, amount_paise from public.membership_orders where status = 'paid' and paid_at > ${since}`),
    q<{ name: string; plan: string; amount_paise: number }>(`select name, plan, amount_paise from public.diet_orders where status = 'paid' and paid_at > ${since}`),
    q<{ name: string; number: string; total: number }>(`select name, number, total from public.shop_orders where status = 'paid' and paid_at > ${since}`),
    q<{ name: string; title: string; amount_paise: number }>(`select name, title, amount_paise from public.book_orders where status = 'paid' and paid_at > ${since}`),
    q<{ name: string; plan: string }>(`select name, plan from public.diet_orders where status = 'paid' and stage in ('new', 'draft_ready') order by paid_at limit 20`),
    q<{ n: number }>(`select count(*)::int as n from public.client_plan_versions where source = 'client' and created_at > ${since}`),
    q<{ channel: string; from_name: string; body: string }>(`select channel, from_name, body from public.social_inbox where not replied and kind = 'message' and created_at > ${since} order by created_at desc limit 10`),
    q<{ name: string; expires_on: string }>(`select name, expires_on::text from public.members where expires_on between $1::date and $2::date order by expires_on`, [today, addDays(today, 7)]),
    q<{ n: number }>(`select count(*)::int as n from public.message_outbox where status = 'failed' and created_at > now() - interval '7 days'`),
  ]);
  return {
    leads: leads.map((l) => ({ name: l.name, source: l.source })),
    payments: [
      ...members.map((m) => ({ kind: "Membership" as const, name: m.name, what: m.plan_name, rupees: m.amount_paise / 100 })),
      ...diets.map((d) => ({ kind: "Diet plan" as const, name: d.name, what: dietPlan(d.plan).name, rupees: d.amount_paise / 100 })),
      ...shop.map((o) => ({ kind: "Supplements" as const, name: o.name, what: `order ${o.number}`, rupees: Number(o.total) })),
      ...books.map((b) => ({ kind: "Book" as const, name: b.name, what: b.title, rupees: b.amount_paise / 100 })),
    ],
    plansToReview: review.map((r) => ({ name: r.name, plan: dietPlan(r.plan).name })),
    clientUpdates: updates[0]?.n ?? 0,
    unanswered: unanswered.map((u) => ({ channel: u.channel, name: u.from_name, text: u.body })),
    expiringMembers: expiring.map((m) => ({ name: m.name, expiresOn: m.expires_on })),
    failedMessages: failed[0]?.n ?? 0,
  };
}
