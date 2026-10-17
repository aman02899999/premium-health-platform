import "server-only";
import { pool } from "@/health/db";
import { getContent } from "@/lib/content/store";
import { SITE_URL } from "@/lib/site";
import { addDays } from "./dates";
import { campaignDraft, isLink, isSegment, offerText, type CampaignInput, type Contact, type LinkId, type Recipient, type SegmentId, SEGMENTS } from "./audience";
import { TEMPLATES } from "./messages";
import { dispatch, enqueue } from "./outbox";

// Audience and campaigns on the database: imported contacts, who is in each segment, and queuing a
// campaign through the outbox. Guard rails, all enforced here rather than trusted to the page:
//   - WhatsApp promotions skip numbers that tapped "Stop promotions";
//   - emails skip addresses that unsubscribed, and carry an unsubscribe link;
//   - nobody gets more than one promotion a week, across all campaigns and automations;
//   - each person gets a campaign once, however often it is queued.

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
export async function recipients(segment: SegmentId, today: string): Promise<Recipient[]> {
  const m = (where: string, params: unknown[]) => pool.query<{ name: string; phone: string; email: string | null }>(`select name, phone, email from public.members where ${where}`, params).then((r) => r.rows);
  const parts: Recipient[][] = [];
  const want = (s: SegmentId) => segment === s || segment === "everyone";
  if (want("current")) parts.push(await m(`expires_on >= $1`, [today]));
  if (segment === "expiring") parts.push(await m(`expires_on between $1 and $2`, [today, addDays(today, 30)]));
  if (want("ex-recent")) parts.push(await m(`expires_on < $1 and expires_on >= $2`, [today, addDays(today, -90)]));
  if (want("ex-old")) parts.push(await m(`expires_on < $1`, [addDays(today, -90)]));
  if (want("imported")) parts.push((await pool.query<Recipient>(`select name, phone, email from public.audience_contacts order by created_at`)).rows);
  if (want("leads"))
    parts.push(
      (
        await pool.query<Recipient>(
          `select l.name, l.phone, l.email from public.leads l
            where l.status in ('new', 'contacted', 'trial', 'lost')
              and not exists (select 1 from public.members mm where mm.phone = right(regexp_replace(l.phone, '\\D', '', 'g'), 10))
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

export async function segmentCounts(today: string): Promise<{ id: SegmentId; label: string; hint: string; total: number; whatsapp: number; email: number }[]> {
  return Promise.all(
    SEGMENTS.map(async (s) => {
      const r = await recipients(s.id, today);
      return { ...s, total: r.length, whatsapp: r.filter((x) => x.phone).length, email: r.filter((x) => x.email).length };
    }),
  );
}

export type CampaignRequest = { name: string; segment: string; channel: string; offer: string; link: string; subject?: string };
export type CampaignResult = { ok: true; id: string; audience: number; queued: number; skipped: { optedOut: number; recent: number; missing: number } } | { ok: false; error: string };

export function validateCampaign(b: CampaignRequest): string | null {
  if (!b.name?.trim() || b.name.trim().length > 80) return "Give the campaign a name (up to 80 characters).";
  if (!isSegment(b.segment)) return "Pick who to send it to.";
  if (b.channel !== "whatsapp" && b.channel !== "email") return "Pick WhatsApp or email.";
  if (!isLink(b.link)) return "Pick where the button goes.";
  const offer = offerText(b.offer ?? "");
  if (offer.length < 5) return "Write the offer (at least a few words).";
  if (b.channel === "whatsapp" && /https?:\/\//i.test(offer)) return "Leave links out of the offer text: the message adds the button link itself.";
  if (b.channel === "email" && !b.subject?.trim()) return "Write an email subject.";
  return null;
}

/** Queues a campaign: one outbox message per eligible person. Sending happens in batches. */
export async function createCampaign(b: CampaignRequest, by: string, today: string): Promise<CampaignResult> {
  const invalid = validateCampaign(b);
  if (invalid) return { ok: false, error: invalid };
  const channel = b.channel as "whatsapp" | "email";
  const all = await recipients(b.segment as SegmentId, today);
  const reachable = all.filter((r) => (channel === "whatsapp" ? r.phone : r.email));
  const addresses = reachable.map((r) => (channel === "whatsapp" ? `91${r.phone}` : r.email!));
  const [optedOut, recent] = await Promise.all([
    channel === "whatsapp"
      ? pool.query<{ a: string }>(`select phone as a from public.whatsapp_optouts where phone = any($1)`, [addresses])
      : pool.query<{ a: string }>(`select address as a from public.marketing_contacts where channel = 'email' and unsubscribed_at is not null and address = any($1)`, [addresses]),
    pool.query<{ a: string }>(
      `select distinct lower(to_address) as a from public.message_outbox
        where to_address = any($1) and status in ('pending', 'sent') and created_at > now() - make_interval(days => $2)
          and (kind = any($3) or kind like 'nurture-%')`,
      [addresses, PROMO_GAP_DAYS, MARKETING_KINDS],
    ),
  ]);
  const out = new Set(optedOut.rows.map((r) => r.a));
  const rec = new Set(recent.rows.map((r) => r.a));
  const { rows } = await pool.query<{ id: string }>(
    `insert into public.campaigns (created_by, name, segment, channel, offer, link, subject, audience) values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
    [by.slice(0, 200), b.name.trim(), b.segment, channel, offerText(b.offer), b.link, (b.subject ?? "").trim().slice(0, 120), all.length],
  );
  const id = rows[0].id;
  const c: CampaignInput = { id, name: b.name.trim(), channel, offer: channel === "whatsapp" ? offerText(b.offer) : b.offer.trim().slice(0, 1000), link: b.link as LinkId, subject: b.subject ?? "" };
  const content = await getContent();
  const biz = { name: content.business.name, siteUrl: SITE_URL, coach: `Coach ${(content.trainers?.[0]?.name || "Aman Sharma").replace(/^coach\s+/i, "")}` };
  const drafts = reachable
    .filter((_, i) => !out.has(addresses[i]) && !rec.has(addresses[i].toLowerCase()))
    .map((r) => campaignDraft(c, r, biz))
    .filter((d) => d !== null);
  const queued = await enqueue(drafts);
  const skipped = { optedOut: reachable.filter((_, i) => out.has(addresses[i])).length, recent: reachable.filter((_, i) => !out.has(addresses[i]) && rec.has(addresses[i].toLowerCase())).length, missing: all.length - reachable.length };
  await pool.query(`update public.campaigns set queued = $2, skipped = $3 where id = $1`, [id, queued, skipped.optedOut + skipped.recent + skipped.missing]);
  return { ok: true, id, audience: all.length, queued, skipped };
}

export type CampaignRow = { id: string; createdAt: string; name: string; segment: string; channel: string; offer: string; audience: number; queued: number; skipped: number; sent: number; failed: number; pending: number; cancelled: number };

export async function listCampaigns(limit = 50): Promise<CampaignRow[]> {
  const { rows } = await pool.query<{ id: string; created_at: Date; name: string; segment: string; channel: string; offer: string; audience: number; queued: number; skipped: number; sent: number; failed: number; pending: number; cancelled: number }>(
    `select c.*, coalesce(o.sent, 0)::int as sent, coalesce(o.failed, 0)::int as failed, coalesce(o.pending, 0)::int as pending, coalesce(o.cancelled, 0)::int as cancelled
       from public.campaigns c
       left join lateral (
         select count(*) filter (where status = 'sent') as sent, count(*) filter (where status = 'failed') as failed,
                count(*) filter (where status = 'pending') as pending, count(*) filter (where status = 'cancelled') as cancelled
           from public.message_outbox where dedupe_key like 'campaign:' || c.id || ':%') o on true
      order by c.created_at desc limit $1`,
    [limit],
  );
  return rows.map((r) => ({ id: r.id, createdAt: r.created_at.toISOString(), name: r.name, segment: r.segment, channel: r.channel, offer: r.offer, audience: r.audience, queued: r.queued, skipped: r.skipped, sent: r.sent, failed: r.failed, pending: r.pending, cancelled: r.cancelled }));
}

/** Sends the next batch of pending messages (campaigns and everything else waiting in the outbox). */
export async function sendBatch(max = 100) {
  return dispatch(Math.max(1, Math.min(max, 100)));
}

export async function importedCount(): Promise<{ total: number; tags: { tag: string; n: number }[] }> {
  const { rows } = await pool.query<{ tag: string; n: number }>(`select tag, count(*)::int as n from public.audience_contacts group by tag order by count(*) desc`);
  return { total: rows.reduce((a, r) => a + r.n, 0), tags: rows };
}
