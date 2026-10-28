import "server-only";
import { pool } from "@/health/db";
import { getContent } from "@/lib/content/store";
import { SITE_URL } from "@/lib/site";
import { addDays, addMonths } from "./dates";
import { segmentTag, tagSegment } from "@/lib/admin/contacts-core";
import { allContacts, contactFacets } from "@/lib/admin/contacts";
import { LINKS, NO_CONSENT_ERROR, campaignDraft, canMarketTo, isLink, isSegment, offerText, type CampaignInput, type Contact, type LinkId, type Recipient, type SegmentId, SEGMENTS } from "./audience";
import { TEMPLATES } from "./messages";
import { dispatch, enqueue } from "./outbox";

// Audience and campaigns on the database: imported contacts, who is in each segment, and queuing a
// campaign through the outbox. Guard rails, all enforced here rather than trusted to the page:
//   - WhatsApp promotions skip numbers that tapped "Stop promotions";
//   - emails skip addresses that unsubscribed, hard-bounced or complained, and carry an unsubscribe link;
//   - nobody gets more than one promotion a week, across all campaigns and automations;
//   - each person gets a campaign once, however often it is queued;
//   - imported contacts (no record of consent) never get one: not as a segment, not inside
//     "Everyone", and not through a Contacts list unless they are also a member, lead or customer.

export const PROMO_GAP_DAYS = 7;
const MARKETING_KINDS = Object.entries(TEMPLATES)
  .filter(([, t]) => t.category === "MARKETING")
  .map(([k]) => k);

export type ImportPlan = { add: number; update: number; members: number; total: number };

/** Adds or updates imported contacts. People already on the member list are left to it. */
export async function importContacts(contacts: Contact[], opts: { tag: string; status: "past" | "current" | "other" }, commit: boolean): Promise<ImportPlan> {
  const phones = contacts.map((c) => c.phone).filter(Boolean) as string[];
  const [members, existing] = await Promise.all([
    pool.query<{ phone: string }>(`select phone from public.members where phone = any($1)`, [phones]),
    pool.query<{ phone: string | null; email: string | null }>(`select phone, lower(email) as email from public.audience_contacts where phone = any($1) or (phone is null and lower(email) = any($2))`, [
      phones,
      contacts.filter((c) => !c.phone && c.email).map((c) => c.email!),
    ]),
  ]);
  const isMember = new Set(members.rows.map((r) => r.phone));
  const known = new Set(existing.rows.map((r) => r.phone ?? r.email));
  const todo = contacts.filter((c) => !(c.phone && isMember.has(c.phone)));
  const plan: ImportPlan = { add: todo.filter((c) => !known.has(c.phone ?? c.email!)).length, update: todo.filter((c) => known.has(c.phone ?? c.email!)).length, members: contacts.length - todo.length, total: contacts.length };
  if (!commit) return plan;
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const c of todo) {
      if (c.phone)
        await client.query(
          `insert into public.audience_contacts (name, phone, email, status, tag) values ($1, $2, $3, $4, $5)
           on conflict (phone) where phone is not null do update set name = coalesce(nullif(excluded.name, ''), audience_contacts.name),
             email = coalesce(excluded.email, audience_contacts.email), status = excluded.status, tag = coalesce(nullif(excluded.tag, ''), audience_contacts.tag), updated_at = now()`,
          [c.name, c.phone, c.email, opts.status, opts.tag.slice(0, 60)],
        );
      else
        await client.query(
          `insert into public.audience_contacts (name, email, status, tag) values ($1, $2, $3, $4)
           on conflict (lower(email)) where phone is null and email is not null do update set name = coalesce(nullif(excluded.name, ''), audience_contacts.name),
             status = excluded.status, tag = coalesce(nullif(excluded.tag, ''), audience_contacts.tag), updated_at = now()`,
          [c.name, c.email, opts.status, opts.tag.slice(0, 60)],
        );
    }
    await client.query("commit");
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
  return plan;
}

const ten = (phone: string | null) => {
  const d = (phone ?? "").replace(/\D/g, "");
  const t = d.length === 12 && d.startsWith("91") ? d.slice(2) : d.slice(-10);
  return /^[6-9]\d{9}$/.test(t) ? t : null;
};

/** Everyone in a segment, each person once (by mobile, else by email). */
export async function recipients(segment: SegmentId | string, today: string): Promise<Recipient[]> {
  // A list from Contacts: everyone with that tag (already one row per person), minus people we
  // only know from an imported sheet.
  const tag = segmentTag(segment);
  if (tag)
    return (await allContacts({ tag }, 20000, today))
      .filter((c) => c.kinds.some((k) => k !== "imported"))
      .map((c) => ({ name: c.name, phone: c.phone, email: c.email }));
  const m = (where: string, params: unknown[]) => pool.query<{ name: string; phone: string; email: string | null }>(`select name, phone, email from public.members where ${where}`, params).then((r) => r.rows);
  const parts: Recipient[][] = [];
  const want = (s: SegmentId) => segment === s || segment === "everyone";
  if (want("current")) parts.push(await m(`expires_on >= $1`, [today]));
  if (segment === "expiring") parts.push(await m(`expires_on between $1 and $2`, [today, addDays(today, 30)]));
  if (want("ex-recent")) parts.push(await m(`expires_on < $1 and expires_on >= $2`, [today, addDays(today, -90)]));
  if (want("ex-old")) parts.push(await m(`expires_on < $1`, [addDays(today, -90)]));
  // Someone imported as a contact and later added to the member list belongs to the member segments.
  // Not part of "everyone": imported contacts can't get promotions (see NO_CONSENT_SEGMENTS).
  if (segment === "imported")
    parts.push(
      (await pool.query<Recipient>(`select a.name, a.phone, a.email from public.audience_contacts a where a.phone is null or not exists (select 1 from public.members m where m.phone = a.phone) order by a.created_at`)).rows,
    );
  // Enquired but never paid: not on the member list, and no paid order of any kind (a diet plan,
  // the store, books, a membership or a payment link), matched by mobile or email.
  if (want("leads"))
    parts.push(
      (
        await pool.query<Recipient>(
          `with paid as (
             select right(regexp_replace(coalesce(phone, ''), '\\D', '', 'g'), 10) as p, lower(email) as e from public.membership_orders where status = 'paid'
             union all select right(regexp_replace(coalesce(phone, ''), '\\D', '', 'g'), 10), lower(email) from public.diet_orders where status = 'paid'
             union all select right(regexp_replace(coalesce(phone, ''), '\\D', '', 'g'), 10), lower(email) from public.shop_orders where status = 'paid'
             union all select right(regexp_replace(coalesce(phone, ''), '\\D', '', 'g'), 10), lower(email) from public.book_orders where status = 'paid'
             union all select right(regexp_replace(coalesce(phone, ''), '\\D', '', 'g'), 10), lower(email) from public.payment_requests where status = 'paid'
           )
           select l.name, l.phone, l.email from public.leads l
            where l.status in ('new', 'contacted', 'trial', 'lost')
              and not exists (select 1 from public.members mm where mm.phone = right(regexp_replace(l.phone, '\\D', '', 'g'), 10))
              and not exists (select 1 from paid where paid.p = right(regexp_replace(l.phone, '\\D', '', 'g'), 10) and paid.p <> '')
              and not exists (select 1 from paid where l.email is not null and paid.e = lower(l.email))
            order by l.created_at desc`,
        )
      ).rows,
    );
  const out = new Map<string, Recipient>();
  for (const r of parts.flat()) {
    const phone = ten(r.phone);
    const email = r.email?.trim().toLowerCase() || null;
    const key = phone ?? email;
    if (!key) continue;
    const prev = out.get(key);
    out.set(key, { name: prev?.name || r.name || "", phone, email: prev?.email ?? email });
  }
  return [...out.values()];
}

/** Is this something a campaign can be sent to: a built-in segment or a Contacts list ("tag:vip"). */
export const isAudience = (s: unknown): s is string => isSegment(s) || segmentTag(s) !== null;

export async function segmentCounts(today: string): Promise<{ id: string; label: string; hint: string; total: number; whatsapp: number; email: number; marketable: boolean }[]> {
  // Lists from Contacts follow the built-in segments (the 12 biggest, so the page stays short).
  const tags = (await contactFacets(today).catch(() => ({ tags: [] as { tag: string; n: number }[] }))).tags.slice(0, 12);
  const all = [...SEGMENTS, ...tags.map((t) => ({ id: tagSegment(t.tag), label: `List: ${t.tag}`, hint: "Tagged in Contacts" }))];
  return Promise.all(
    all.map(async (s) => {
      const r = await recipients(s.id, today);
      return { ...s, total: r.length, whatsapp: r.filter((x) => x.phone).length, email: r.filter((x) => x.email).length, marketable: canMarketTo(s.id) };
    }),
  );
}

export type Repeat = "none" | "weekly" | "monthly";
export type CampaignRequest = { name: string; segment: string; channel: string; offer: string; link: string; subject?: string; repeat?: string };
export type CampaignResult = { ok: true; id: string; audience: number; queued: number; skipped: { optedOut: number; recent: number; missing: number } } | { ok: false; error: string };

export function validateCampaign(b: CampaignRequest): string | null {
  if (!b.name?.trim() || b.name.trim().length > 80) return "Give the campaign a name (up to 80 characters).";
  if (!isAudience(b.segment)) return "Pick who to send it to.";
  if (!canMarketTo(b.segment)) return NO_CONSENT_ERROR;
  if (b.channel !== "whatsapp" && b.channel !== "email") return "Pick WhatsApp or email.";
  if (!isLink(b.link)) return "Pick where the button goes.";
  if (b.channel === "whatsapp" && !LINKS[b.link].whatsapp) return "WhatsApp messages can't link to the supplement shop (WhatsApp commerce policy). Use email for shop offers.";
  const offer = offerText(b.offer ?? "");
  if (offer.length < 5) return "Write the offer (at least a few words).";
  if (b.channel === "whatsapp" && /https?:\/\//i.test(offer)) return "Leave links out of the offer text: the message adds the button link itself.";
  if (b.channel === "email" && !b.subject?.trim()) return "Write an email subject.";
  if (b.repeat && !["none", "weekly", "monthly"].includes(b.repeat)) return "Pick how often it repeats.";
  return null;
}

export const nextRun = (repeat: Repeat, today: string) => (repeat === "weekly" ? addDays(today, 7) : repeat === "monthly" ? addMonths(today, 1) : null);

type Stored = { id: string; name: string; segment: string; channel: "whatsapp" | "email"; offer: string; link: string; subject: string };
type RunCounts = { audience: number; queued: number; skipped: { optedOut: number; recent: number; missing: number } };

/**
 * One run of a campaign: a message to everyone in the segment today who can be reached, hasn't
 * opted out and hasn't had a promotion this week. `run` keeps repeats apart in the dedupe key.
 */
async function queueRun(c: Stored, run: string | null, today: string): Promise<RunCounts> {
  // Never send a WhatsApp campaign that links to the supplement shop (also blocked on create).
  if (c.channel === "whatsapp" && !(isLink(c.link) && LINKS[c.link].whatsapp)) return { audience: 0, queued: 0, skipped: { optedOut: 0, recent: 0, missing: 0 } };
  // Never to a no-consent segment, even for a campaign saved before the rule (also blocked on create).
  if (!canMarketTo(c.segment)) return { audience: 0, queued: 0, skipped: { optedOut: 0, recent: 0, missing: 0 } };
  const all = await recipients(c.segment, today);
  const reachable = all.filter((r) => (c.channel === "whatsapp" ? r.phone : r.email));
  const addresses = reachable.map((r) => (c.channel === "whatsapp" ? `91${r.phone}` : r.email!));
  const [optedOut, recent] = await Promise.all([
    c.channel === "whatsapp"
      ? // Opted out, or a number WhatsApp says can't receive messages: nobody pays for those.
        pool.query<{ a: string }>(`select phone as a from public.whatsapp_optouts where phone = any($1) union select phone from public.whatsapp_unreachable where phone = any($1)`, [addresses])
      : // Unsubscribed, or an address that hard-bounced or complained (stored lower-case).
        pool.query<{ a: string }>(
          `select a.a from unnest($1::text[]) as a(a)
            where exists (select 1 from public.marketing_contacts c where c.channel = 'email' and c.unsubscribed_at is not null and c.address = lower(a.a))
               or exists (select 1 from public.email_suppressions s where s.address = lower(a.a))`,
          [addresses],
        ),
    pool.query<{ a: string }>(
      `select distinct lower(to_address) as a from public.message_outbox
        where to_address = any($1) and status in ('pending', 'sent') and created_at > now() - make_interval(days => $2)
          and (kind = any($3) or kind like 'nurture-%')`,
      [addresses, PROMO_GAP_DAYS, MARKETING_KINDS],
    ),
  ]);
  const out = new Set(optedOut.rows.map((r) => r.a));
  const rec = new Set(recent.rows.map((r) => r.a));
  const content = await getContent();
  const biz = { name: content.business.name, siteUrl: SITE_URL, phone: content.business.phone, coach: `Coach ${(content.trainers?.[0]?.name || "Aman Sharma").replace(/^coach\s+/i, "")}` };
  const input: CampaignInput = { id: run ? `${c.id}:${run}` : c.id, name: c.name, channel: c.channel, offer: c.offer, link: c.link as LinkId, subject: c.subject };
  const drafts = reachable
    .filter((_, i) => !out.has(addresses[i]) && !rec.has(addresses[i].toLowerCase()))
    .map((r) => campaignDraft(input, r, biz))
    .filter((d) => d !== null);
  const queued = await enqueue(drafts);
  const optedOutN = reachable.filter((_, i) => out.has(addresses[i])).length;
  return { audience: all.length, queued, skipped: { optedOut: optedOutN, recent: reachable.length - optedOutN - drafts.length, missing: all.length - reachable.length } };
}

/** Queues a campaign: one outbox message per eligible person. Sending happens in batches. */
export async function createCampaign(b: CampaignRequest, by: string, today: string): Promise<CampaignResult> {
  const invalid = validateCampaign(b);
  if (invalid) return { ok: false, error: invalid };
  const channel = b.channel as "whatsapp" | "email";
  const repeat = (b.repeat ?? "none") as Repeat;
  const offer = channel === "whatsapp" ? offerText(b.offer) : b.offer.trim().slice(0, 1000);
  const { rows } = await pool.query<{ id: string }>(
    `insert into public.campaigns (created_by, name, segment, channel, offer, link, subject, repeat, next_run) values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id`,
    [by.slice(0, 200), b.name.trim(), b.segment, channel, offer.slice(0, 160), b.link, (b.subject ?? "").trim().slice(0, 120), repeat, nextRun(repeat, today)],
  );
  const id = rows[0].id;
  const r = await queueRun({ id, name: b.name.trim(), segment: b.segment, channel, offer, link: b.link, subject: b.subject ?? "" }, null, today);
  await pool.query(`update public.campaigns set audience = $2, queued = $3, skipped = $4 where id = $1`, [id, r.audience, r.queued, r.skipped.optedOut + r.skipped.recent + r.skipped.missing]);
  return { ok: true, id, ...r };
}

/** The daily job: every recurring campaign that is due runs again for whoever is newly eligible. */
export async function runRecurringCampaigns(today: string): Promise<{ runs: number; queued: number }> {
  const { rows } = await pool.query<Stored & { repeat: Repeat }>(
    `select id, name, segment, channel, offer, link, subject, repeat from public.campaigns where active and repeat <> 'none' and next_run <= $1 order by created_at`,
    [today],
  );
  let queued = 0;
  for (const c of rows) {
    const r = await queueRun(c, today, today);
    queued += r.queued;
    await pool.query(`update public.campaigns set next_run = $2, queued = queued + $3 where id = $1`, [c.id, nextRun(c.repeat, today), r.queued]);
  }
  return { runs: rows.length, queued };
}

/** Stops a recurring campaign; messages already queued still go. */
export async function stopRepeating(id: string): Promise<void> {
  await pool.query(`update public.campaigns set active = false, next_run = null where id = $1`, [id]);
}

export type CampaignRow = {
  id: string; createdAt: string; name: string; segment: string; channel: string; offer: string; audience: number; queued: number; skipped: number;
  sent: number; failed: number; pending: number; cancelled: number; repeat: Repeat; nextRun: string | null; active: boolean; buyers: number; revenue: number;
  /** After sending: what the provider and the tracked link reported. */
  delivered: number; read: number; clicked: number; replied: number; undelivered: number;
  /** Most common reasons messages didn't arrive, with counts. */
  reasons: { reason: string; n: number }[];
};

/**
 * Campaigns with delivery counts and results: people who received a campaign message and then
 * paid for a membership, a diet plan, a store order or books within 14 days (matched by mobile or
 * email). Revenue is what was collected minus refunds, each order counted once. A purchase soon
 * after two campaigns counts for both, so treat it as "influenced", not exact attribution.
 */
export async function listCampaigns(limit = 50): Promise<CampaignRow[]> {
  const { rows } = await pool.query<{ id: string; created_at: Date; name: string; segment: string; channel: string; offer: string; audience: number; queued: number; skipped: number; sent: number; failed: number; pending: number; cancelled: number; repeat: Repeat; next_run_s: string | null; active: boolean; buyers: number; revenue_paise: string; delivered: number; read: number; clicked: number; replied: number; undelivered: number; reasons: { reason: string; n: number }[] | null }>(
    `with paid as (
       select 'm' || id as oid, right(regexp_replace(phone, '\\D', '', 'g'), 10) as p, lower(email) as e, amount_paise - refunded_paise as net, paid_at from public.membership_orders where status = 'paid' and paid_at is not null
       union all
       select 'd' || id, phone, lower(email), amount_paise - refunded_paise, paid_at from public.diet_orders where status = 'paid' and paid_at is not null
       union all
       select 's' || id, phone, lower(email), total * 100 - refunded_paise, paid_at from public.shop_orders where status = 'paid' and paid_at is not null
       union all
       select 'b' || id, right(regexp_replace(phone, '\\D', '', 'g'), 10), lower(email), amount_paise - refunded_paise, paid_at from public.book_orders where status = 'paid' and paid_at is not null
       union all
       select 'r' || id, phone, lower(email), amount_paise - refunded_paise, paid_at from public.payment_requests where status = 'paid' and paid_at is not null
     )
     select c.*, to_char(c.next_run, 'YYYY-MM-DD') as next_run_s, coalesce(o.sent, 0)::int as sent, coalesce(o.failed, 0)::int as failed, coalesce(o.pending, 0)::int as pending, coalesce(o.cancelled, 0)::int as cancelled,
            coalesce(o.delivered, 0)::int as delivered, coalesce(o.read, 0)::int as read, coalesce(o.clicked, 0)::int as clicked, coalesce(o.undelivered, 0)::int as undelivered,
            coalesce(rp.replied, 0)::int as replied, fr.reasons,
            coalesce(v.buyers, 0)::int as buyers, coalesce(v.revenue, 0)::text as revenue_paise
       from public.campaigns c
       left join lateral (
         select count(*) filter (where status = 'sent') as sent, count(*) filter (where status = 'failed') as failed,
                count(*) filter (where status = 'pending') as pending, count(*) filter (where status = 'cancelled') as cancelled,
                count(*) filter (where status = 'sent' and delivered_at is not null) as delivered,
                count(*) filter (where status = 'sent' and read_at is not null) as read,
                count(*) filter (where status = 'sent' and clicks > 0) as clicked,
                count(*) filter (where status = 'sent' and delivery in ('failed', 'bounced')) as undelivered
           from public.message_outbox where dedupe_key like 'campaign:' || c.id || ':%') o on true
       left join lateral (
         -- A WhatsApp message from the person within 7 days of the campaign message.
         select count(distinct m.to_address) as replied
           from public.message_outbox m
           join public.social_inbox i on i.channel = 'whatsapp' and i.kind = 'message' and i.from_id = m.to_address
                and i.created_at between m.sent_at and m.sent_at + interval '7 days'
          where m.dedupe_key like 'campaign:' || c.id || ':%' and m.status = 'sent' and m.channel = 'whatsapp') rp on true
       left join lateral (
         select jsonb_agg(jsonb_build_object('reason', r.reason, 'n', r.n) order by r.n desc) as reasons
           from (select coalesce(nullif(fail_reason, ''), nullif(fail_code, ''), 'Unknown') as reason, count(*)::int as n
                   from public.message_outbox where dedupe_key like 'campaign:' || c.id || ':%' and status = 'sent' and delivery in ('failed', 'bounced')
                  group by 1 order by 2 desc limit 3) r) fr on true
       left join lateral (
         select count(distinct m.k) as buyers, sum(m.net) as revenue
           from (select distinct on (paid.oid) paid.oid, paid.net, r.k
                   from (select case when channel = 'whatsapp' then right(to_address, 10) else lower(to_address) end as k, min(sent_at) as sent_at
                           from public.message_outbox where dedupe_key like 'campaign:' || c.id || ':%' and status = 'sent' group by 1) r
                   join paid on (paid.p = r.k or paid.e = r.k) and paid.paid_at between r.sent_at and r.sent_at + interval '14 days') m) v on true
      order by c.created_at desc limit $1`,
    [limit],
  );
  return rows.map((r) => ({ id: r.id, createdAt: r.created_at.toISOString(), name: r.name, segment: r.segment, channel: r.channel, offer: r.offer, audience: r.audience, queued: r.queued, skipped: r.skipped, sent: r.sent, failed: r.failed, pending: r.pending, cancelled: r.cancelled, repeat: r.repeat, nextRun: r.next_run_s, active: r.active, buyers: r.buyers, revenue: Math.round(Number(r.revenue_paise) / 100), delivered: r.delivered, read: r.read, clicked: r.clicked, replied: r.replied, undelivered: r.undelivered, reasons: r.reasons ?? [] }));
}

/** Sends the next batch of pending messages (campaigns and everything else waiting in the outbox). */
export async function sendBatch(max = 100) {
  return dispatch(Math.max(1, Math.min(max, 100)));
}

export async function importedCount(): Promise<{ total: number; tags: { tag: string; n: number }[] }> {
  const { rows } = await pool.query<{ tag: string; n: number }>(`select tag, count(*)::int as n from public.audience_contacts group by tag order by count(*) desc`);
  return { total: rows.reduce((a, r) => a + r.n, 0), tags: rows };
}
