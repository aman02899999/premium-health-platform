import "server-only";
import { getContent } from "@/lib/content/store";
import { indexNowUrls, submitIndexNow } from "@/lib/indexnow";
import { SITE_URL } from "@/lib/site";
import { todayIST } from "./dates";
import { nurtureLeads, openLeads } from "./leads";
import { nurtureDrafts, type NurtureBiz } from "./nurture";
import { lapsedMembers, membersNearExpiry } from "./members";
import { MARKETING_KINDS, checkoutReminderMessage, dueMessages, type Biz } from "./messages";
import { dispatch, enqueue } from "./outbox";
import { coachPostEmail, dailyPost } from "./daily-posts";
import { runInstagramStory, storyImageUrl } from "@/lib/social/automation";
import { reelScript, storyItem } from "./sales-catalog";
import { checkoutReminder, coachsPick, isMonday, isWednesday, weeklyPicks, type AbandonedOrder } from "./sales-emails";
import { pool } from "@/health/db";
import { getAllEnrichedArticles } from "@/health/data/blog-enrichment";
import { NEWSLETTER_SOURCES, isSunday, weeklyNewsletter } from "./newsletter";
import { adminDigest, type DigestData } from "./admin-digest";
import { dietPlan } from "./config";
import { addDays, daysBetween } from "./dates";
import { trackMemberLapsed, trackMembershipExpiring } from "./resend-events";
import { listCampaigns, runRecurringCampaigns } from "./campaigns";
import { dueReviewRequests } from "./reviews";

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
/** Records an automation event as sent; false when it already was (or the table isn't migrated yet). */
async function claimEvent(key: string): Promise<boolean> {
  const { rowCount } = await pool
    .query(`insert into public.automation_events (key) values ($1) on conflict (key) do nothing`, [key.slice(0, 200)])
    .catch((err: Error) => (console.error("[automation-events] claim:", err.message), { rowCount: 0 }));
  return rowCount === 1;
}

export async function runDaily(now = new Date()) {
  const today = todayIST(now);
  const [biz, members, leads, nb, nl] = await Promise.all([business(), membersNearExpiry(today), openLeads(today), nurtureBusiness(), nurtureLeads(today)]);
  const drafts = [...dueMessages(today, members, leads, biz), ...nurtureDrafts(today, nl, nb)];
  // Renewal email sequence (Resend), alongside the WhatsApp reminders: 7 days out, once per member
  // per end date, even if the daily run happens twice that day ("Run now" plus the schedule).
  for (const m of members.filter((m) => m.reminders && m.email && daysBetween(today, m.expiresOn) === 7)) {
    if (await claimEvent(`membership.expiring:${m.email!.trim().toLowerCase()}:${m.expiresOn}`)) await trackMembershipExpiring(m.email, m.expiresOn, m.name);
  }
  // Win-back emails a month after a membership ended without a renewal. The window is a week wide so
  // a missed daily run doesn't skip anyone; the claim keeps it to once per member per end date.
  for (const m of await lapsedMembers(today)) {
    if (await claimEvent(`member.inactive:${m.email!.trim().toLowerCase()}:${m.expiresOn}`)) await trackMemberLapsed(m.email, m.name);
  }
  // The day's marketing post goes to the coach's inbox each morning, ready to copy.
  const coach = process.env.COACH_EMAIL;
  if (coach) {
    drafts.push(
      coachPostEmail(dailyPost(today, nb), coach, `${SITE_URL}/admin/growth?tab=marketing`, {
        story: { title: storyItem(today).title, imageUrl: storyImageUrl(today) },
        // Mondays: three Reel scripts for the week's featured products, ready to film.
        reels: isMonday(today) ? weeklyPicks(today).map((item, i) => reelScript(item, i)) : undefined,
      }),
    );
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
  // Someone started paying for a membership, a plan, a book or a supplement order, didn't finish, and
  // asked to be reminded: one gentle email, or a WhatsApp for a membership buyer who left no email.
  for (const o of await abandonedCheckouts(now)) drafts.push(checkoutReminder(o, SITE_URL, nb.coach, nb.phone));
  for (const o of await abandonedMembershipsByPhone(now)) drafts.push(checkoutReminderMessage(o, biz));
  // Wednesdays: the Coach's Pick to everyone who asked for emails.
  if (isWednesday(today)) {
    const { rows } = await pool.query<{ address: string }>(
      `select address from public.marketing_contacts where channel = 'email' and unsubscribed_at is null and consent_at is not null`,
    );
    for (const r of rows) drafts.push(coachsPick(today, r.address, SITE_URL, nb.coach));
  }
  // Google review requests (members a month in, diet clients a week after their plan): only once a
  // real review link is set in Admin → Business; a failure here never stops the reminders.
  const site = (await getContent()).business;
  const reviews = await dueReviewRequests(today, biz, site.googleReviewUrl, site.googleMapsUrl).catch((err: Error) => (console.error("[daily] reviews:", err.message), []));
  drafts.push(...reviews);
  const queued = await enqueue(drafts);
  // Recurring admin campaigns that are due today (they queue through the same outbox).
  const campaigns = await runRecurringCampaigns(today).catch((err) => (console.error("[daily] campaigns:", (err as Error).message), { runs: 0, queued: 0 }));
  // Up to the WhatsApp promotions cap plus every reminder and receipt, within the function limit.
  const sent = await dispatch(600, Date.now() + 200_000);
  // Mornings: the sales Story. The day's post itself goes out as a Reel at peak time in the
  // evening (/api/cron/reel), when most people are on Instagram and Facebook.
  const story = await runInstagramStory(now).catch((err) => ({ story: `error: ${(err as Error).message}` }));
  // Changed pages go to Bing the same day, so AI answers pick up new prices, offers and posts.
  const indexnow = await pool
    .query<{ updated_at: Date }>(`select max(updated_at) as updated_at from public.site_content`)
    .then(async (r) => submitIndexNow(indexNowUrls(await getContent(), now, r.rows[0]?.updated_at ?? null, isMonday(today))))
    .catch((err: Error) => `error: ${err.message}`);
  return { today, due: drafts.length, queued, reviews: reviews.length, campaigns, ...sent, ...story, indexnow };
}

/**
 * Diet-plan and library orders started 2–72 hours ago and never paid, from people who haven't
 * paid for the same thing since and haven't unsubscribed. Each source is optional.
 * Supplement and first-time membership orders too, and only for buyers who asked to be reminded:
 * the checkout's reminder tick, or marketing consent for that address.
 */
async function abandonedCheckouts(now: Date): Promise<AbandonedOrder[]> {
  const window = CHECKOUT_WINDOW;
  const unsubscribed = `exists (select 1 from public.marketing_contacts c where c.channel = 'email' and c.address = lower(o.email) and c.unsubscribed_at is not null)`;
  const marketingConsent = `exists (select 1 from public.marketing_contacts c where c.channel = 'email' and c.address = lower(o.email) and c.consent_at is not null)`;
  const asked = `(o.reminder_consent_at is not null or ${marketingConsent})`;
  // At most one checkout reminder per person every 14 days, whatever they abandoned.
  const remindedRecently = `exists (select 1 from public.message_outbox m where m.kind = 'nurture-checkout' and m.to_address = lower(o.email) and m.created_at > $1::timestamptz - interval '14 days')`;
  const [diet, books, shop, members] = await Promise.all([
    pool
      .query<{ id: string; name: string; email: string; plan: string; amount_paise: number }>(
        `select distinct on (lower(o.email)) o.id, o.name, o.email, o.plan, o.amount_paise from public.diet_orders o
         where o.status = 'created' and o.email is not null and ${window} and ${marketingConsent} and not ${unsubscribed} and not ${remindedRecently}
           and not exists (select 1 from public.diet_orders p where p.status = 'paid' and (p.phone = o.phone or lower(p.email) = lower(o.email)) and p.created_at >= o.created_at - interval '1 day')
         order by lower(o.email), o.created_at desc`,
        [now.toISOString()],
      )
      .then((r) => r.rows.map((x): AbandonedOrder => ({ kind: "diet", id: x.id, name: x.name, email: x.email, plan: x.plan, itemId: "", title: "", amountPaise: x.amount_paise })))
      .catch(() => [] as AbandonedOrder[]),
    pool
      .query<{ id: string; name: string; email: string; item_id: string; title: string; amount_paise: number }>(
        `select distinct on (lower(o.email)) o.id, o.name, o.email, o.item_id, o.title, o.amount_paise from public.book_orders o
         where o.status = 'created' and ${window} and ${asked} and not ${unsubscribed} and not ${remindedRecently}
           and not exists (select 1 from public.book_orders p where p.status = 'paid' and lower(p.email) = lower(o.email) and p.created_at >= o.created_at - interval '1 day')
         order by lower(o.email), o.created_at desc`,
        [now.toISOString()],
      )
      .then((r) => r.rows.map((x): AbandonedOrder => ({ kind: "book", id: x.id, name: x.name, email: x.email, plan: "", itemId: x.item_id, title: x.title, amountPaise: x.amount_paise })))
      .catch(() => [] as AbandonedOrder[]),
    abandonedShopOrders(window, `${asked} and not ${unsubscribed}`, remindedRecently, now),
    pool
      .query<{ id: string; name: string; email: string; plan_id: string; plan_name: string; amount_paise: number }>(
        `select distinct on (lower(o.email)) o.id, o.name, o.email, o.plan_id, o.plan_name, o.amount_paise from public.membership_orders o
         where o.status = 'created' and o.email is not null and ${window} and ${asked} and not ${unsubscribed} and not ${remindedRecently} and not ${MEMBERSHIP_SETTLED}
         order by lower(o.email), o.created_at desc`,
        [now.toISOString()],
      )
      .then((r) => r.rows.map((x): AbandonedOrder => ({ kind: "membership", id: x.id, name: x.name, email: x.email, plan: x.plan_id, itemId: "", title: x.plan_name, amountPaise: x.amount_paise })))
      .catch((err: Error) => (console.error("[daily] membership reminders:", err.message), [] as AbandonedOrder[])),
  ]);
  return [...diet, ...books, ...shop, ...members];
}

const CHECKOUT_WINDOW = "o.created_at between $1::timestamptz - interval '72 hours' and $1::timestamptz - interval '2 hours'";
// A membership reminder is for first-time joiners: a phone already on the members list (renewals
// have their own sequence) or that has paid for a membership since is skipped.
const MEMBERSHIP_SETTLED = `(exists (select 1 from public.members mb where mb.phone = o.phone)
  or exists (select 1 from public.membership_orders p where p.status = 'paid' and p.phone = o.phone and p.created_at >= o.created_at - interval '1 day'))`;

/**
 * Membership orders with no email whose buyer ticked the reminder box: the same window and rules,
 * one WhatsApp per number every 14 days. It is a Marketing template, so the outbox also skips
 * numbers that tapped "Stop promotions" and applies the promotions cap.
 */
async function abandonedMembershipsByPhone(now: Date): Promise<{ id: string; name: string; phone: string; planName: string; resumeUrl: string }[]> {
  const { rows } = await pool
    .query<{ id: string; name: string; phone: string; plan_id: string; plan_name: string; couple: boolean }>(
      `select distinct on (o.phone) o.id, o.name, o.phone, o.plan_id, o.plan_name, o.couple from public.membership_orders o
       where o.status = 'created' and o.email is null and o.reminder_consent_at is not null and ${CHECKOUT_WINDOW} and not ${MEMBERSHIP_SETTLED}
         and not exists (select 1 from public.message_outbox m where m.kind = 'checkout-reminder' and m.to_address = '91' || o.phone and m.created_at > $1::timestamptz - interval '14 days')
       order by o.phone, o.created_at desc`,
      [now.toISOString()],
    )
    .catch((err: Error) => (console.error("[daily] membership WhatsApp reminders:", err.message), { rows: [] }));
  return rows.map((x) => ({
    id: x.id,
    name: x.name,
    phone: x.phone,
    planName: x.plan_name,
    resumeUrl: `${SITE_URL}/join?plan=${encodeURIComponent(x.plan_id)}${x.couple ? "&couple=1" : ""}&utm_source=whatsapp&utm_medium=whatsapp&utm_campaign=checkout-reminder`,
  }));
}

/**
 * Supplement orders: the same rules, plus never for an order the admin cancelled, and never to
 * sell something that is now inactive or out of stock. (The payment reconciler runs before this
 * in the daily cron, so an order Razorpay captured without a webhook is already marked paid.)
 */
async function abandonedShopOrders(window: string, eligible: string, remindedRecently: string, now: Date): Promise<AbandonedOrder[]> {
  const unavailable = `exists (select 1 from jsonb_array_elements(o.items) i
      left join public.shop_products sp on i->>'kind' = 'product' and sp.id::text = i->>'id'
      left join public.shop_combos sc on i->>'kind' = 'combo' and sc.id::text = i->>'id'
      where case when i->>'kind' = 'combo' then sc.id is null or not sc.active
                 else sp.id is null or not sp.active or sp.stock < coalesce((i->>'qty')::int, 1) end)`;
  return pool
    .query<{ id: string; name: string; email: string; items: { kind: string; slug: string; name: string }[]; total: number }>(
      `select distinct on (lower(o.email)) o.id, o.name, o.email, o.items, o.total from public.shop_orders o
       where o.status = 'created' and o.fulfilment = 'new' and ${window} and ${eligible} and not ${remindedRecently} and not ${unavailable}
         and not exists (select 1 from public.shop_orders p where p.status = 'paid' and (p.phone = o.phone or lower(p.email) = lower(o.email)) and p.created_at >= o.created_at - interval '1 day')
       order by lower(o.email), o.created_at desc`,
      [now.toISOString()],
    )
    .then((r) =>
      r.rows.map((x): AbandonedOrder => {
        const one = x.items.length === 1 ? x.items[0] : null;
        const title = one ? one.name : `${x.items[0]?.name ?? "supplement order"} and ${x.items.length - 1} more`;
        return { kind: "shop", id: x.id, name: x.name, email: x.email, plan: "", itemId: one ? `${one.kind === "combo" ? "combos" : "p"}/${one.slug}` : "", title: title.slice(0, 80), amountPaise: x.total * 100 };
      }),
    )
    .catch((err: Error) => (console.error("[daily] shop reminders:", err.message), [] as AbandonedOrder[]));
}

/** The last 24 hours, for the admin's morning email. Each source is optional (a missing table reads as empty). */
async function digestData(today: string): Promise<DigestData> {
  const q = async <T,>(sql: string, params: unknown[] = []): Promise<T[]> => (await pool.query(sql, params).catch(() => ({ rows: [] as T[] }))).rows as T[];
  const since = "now() - interval '24 hours'";
  const [leads, members, diets, shop, books, review, updates, unanswered, expiring, failed, campaignSent, held, campaignRows] = await Promise.all([
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
    q<{ n: number }>(`select count(*)::int as n from public.message_outbox where dedupe_key like 'campaign:%' and status = 'sent' and sent_at > ${since}`),
    q<{ n: number }>(`select count(*)::int as n from public.message_outbox where status = 'pending' and channel = 'whatsapp' and kind = any($1)`, [MARKETING_KINDS]),
    listCampaigns(20).catch(() => []),
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
    campaigns: {
      sent: campaignSent[0]?.n ?? 0,
      held: held[0]?.n ?? 0,
      results: campaignRows.filter((c) => c.buyers > 0).slice(0, 5).map((c) => ({ name: c.name, buyers: c.buyers, revenue: c.revenue })),
    },
  };
}
