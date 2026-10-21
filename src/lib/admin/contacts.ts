import "server-only";
import { pool } from "@/health/db";
import { todayIST } from "@/lib/growth/dates";
import { isContactKey, isKind, normAttr, normTag, type ContactKind, type ContactRow } from "./contacts-core";

// Contacts: everyone the gym knows, one row per person, built on the fly from the tables that
// already hold them (members, leads, imported lists, WhatsApp chats, subscribers, paid orders).
// Nothing is copied, so the directory can never drift from the source tables; only tags and
// attributes are stored here (contact_tags, contact_attributes).

// The same fold as normTag(), in SQL, for tags typed on the import form.
const SQL_TAG = (col: string) => `nullif(trim(left(trim(regexp_replace(regexp_replace(lower(${col}), '[^a-z0-9 _-]+', ' ', 'g'), '\\s+', ' ', 'g')), 30)), '')`;

/** $1 = today (India). Produces `people`: key, name, phone, email, kinds, last_at, until, tags. */
const PEOPLE = `
  src as (
    select m.phone, m.email, m.name, m.updated_at as at, case when m.expires_on >= $1::date then 'member' else 'ex-member' end as kind, m.expires_on as until, null::text as itag from public.members m
    union all select l.phone, l.email, l.name, l.created_at, 'lead', null, null from public.leads l
    union all select a.phone, a.email, a.name, a.updated_at, 'imported', null, a.tag from public.audience_contacts a
    union all select i.from_id, null, i.from_name, i.created_at, 'chat', null, null from public.social_inbox i where i.channel = 'whatsapp' and i.kind = 'message'
    union all select case when c.channel = 'whatsapp' then c.address end, case when c.channel = 'email' then c.address end, coalesce(c.name, ''), c.created_at, 'subscriber', null, null from public.marketing_contacts c
    union all select o.phone, o.email, o.name, o.paid_at, 'customer', null, null from public.membership_orders o where o.status = 'paid'
    union all select o.phone, o.email, o.name, o.paid_at, 'customer', null, null from public.diet_orders o where o.status = 'paid'
    union all select o.phone, o.email, o.name, o.paid_at, 'customer', null, null from public.shop_orders o where o.status = 'paid'
    union all select o.phone, o.email, o.name, o.paid_at, 'customer', null, null from public.book_orders o where o.status = 'paid'
  ),
  norm as (
    select case when d ~ '^(91|0)?[6-9][0-9]{9}$' then right(d, 10) end as phone,
           case when e ~ '^[^@\\s]+@[^@\\s]+$' and char_length(e) <= 120 then e end as email,
           coalesce(nullif(trim(name), ''), '') as name, at, kind, until, ${SQL_TAG("itag")} as itag
      from (select *, regexp_replace(coalesce(phone, ''), '\\D', '', 'g') as d, lower(trim(coalesce(email, ''))) as e from src) x
  ),
  -- An email seen anywhere with a mobile belongs to that mobile's person.
  emk as (select distinct on (email) email, phone from norm where phone is not null and email is not null order by email, phone),
  keyed as (
    select coalesce(n.phone, emk.phone, n.email) as key, n.*
      from norm n left join emk on n.phone is null and emk.email = n.email
     where coalesce(n.phone, n.email) is not null
  ),
  grouped as (
    select key,
           coalesce((array_agg(name order by case kind when 'member' then 0 when 'ex-member' then 1 when 'customer' then 2 when 'lead' then 3 when 'imported' then 4 when 'subscriber' then 5 else 6 end, at desc nulls last) filter (where name <> ''))[1], '') as name,
           max(phone) as phone,
           (array_agg(email order by at desc nulls last) filter (where email is not null))[1] as email,
           array_agg(distinct kind) as kinds,
           max(at) as last_at,
           max(until) as until,
           coalesce(array_agg(distinct itag) filter (where itag is not null and itag ~ '^[a-z0-9]'), '{}') as itags
      from keyed group by key
  ),
  people as (
    select g.key, g.name, g.phone, g.email, g.kinds, g.last_at, g.until,
           array(select distinct u from unnest(g.itags || coalesce((select array_agg(t.tag) from public.contact_tags t where t.contact_key = g.key), '{}')) u order by u) as tags
      from grouped g
  )`;

export type ContactFilter = { q?: string; kind?: string; tag?: string };

/** WHERE for a filter, with params numbered after $1 (today). */
function where(f: ContactFilter): { sql: string; params: unknown[] } {
  const parts: string[] = [];
  const params: unknown[] = [];
  const q = (f.q ?? "").trim().toLowerCase().slice(0, 80);
  if (q) {
    const digits = q.replace(/\D/g, "");
    params.push(`%${q.replace(/[%_\\]/g, "\\$&")}%`);
    const p = `$${params.length + 1}`;
    if (digits.length >= 3) {
      params.push(`%${digits.slice(-10)}%`);
      parts.push(`(lower(p.name) like ${p} or p.email like ${p} or p.phone like $${params.length + 1})`);
    } else parts.push(`(lower(p.name) like ${p} or p.email like ${p})`);
  }
  if (isKind(f.kind)) {
    params.push(f.kind);
    parts.push(`$${params.length + 1} = any(p.kinds)`);
  }
  const tag = f.tag ? normTag(f.tag) : null;
  if (tag) {
    params.push(tag);
    parts.push(`$${params.length + 1} = any(p.tags)`);
  }
  return { sql: parts.length ? `where ${parts.join(" and ")}` : "", params };
}

type Raw = { key: string; name: string; phone: string | null; email: string | null; kinds: string[]; tags: string[]; last_at: Date | null; until: string | null; wa_blocked: boolean; unsubscribed: boolean; total?: number };

const toRow = (r: Raw): ContactRow => ({
  key: r.key,
  name: r.name,
  phone: r.phone,
  email: r.email,
  kinds: r.kinds.filter(isKind) as ContactKind[],
  tags: r.tags,
  lastAt: r.last_at ? r.last_at.toISOString() : null,
  memberUntil: r.until,
  waBlocked: r.wa_blocked,
  emailUnsubscribed: r.unsubscribed,
});

const SELECT = `p.key, p.name, p.phone, p.email, p.kinds, p.tags, p.last_at, to_char(p.until, 'YYYY-MM-DD') as until,
  (p.phone is not null and (exists (select 1 from public.whatsapp_optouts o where o.phone = '91' || p.phone) or exists (select 1 from public.whatsapp_unreachable u where u.phone = '91' || p.phone))) as wa_blocked,
  (p.email is not null and exists (select 1 from public.marketing_contacts mc where mc.channel = 'email' and mc.address = p.email and mc.unsubscribed_at is not null)) as unsubscribed`;

export const MAX_PAGE = 200;

/** One page of the directory, most recently active first. */
export async function listContacts(f: ContactFilter, limit = 50, offset = 0, today = todayIST()): Promise<{ rows: ContactRow[]; total: number }> {
  const w = where(f);
  const n = w.params.length;
  const { rows } = await pool.query<Raw>(
    `with ${PEOPLE} select ${SELECT}, count(*) over ()::int as total from people p ${w.sql} order by p.last_at desc nulls last, p.key limit $${n + 2} offset $${n + 3}`,
    [today, ...w.params, Math.min(Math.max(limit, 1), MAX_PAGE), Math.max(offset, 0)],
  );
  return { rows: rows.map(toRow), total: rows[0]?.total ?? (offset ? (await listContacts(f, 1, 0, today)).total : 0) };
}

/** Everyone matching a filter (for campaigns, exports and "tag all matching"), capped. */
export async function allContacts(f: ContactFilter, cap = 20000, today = todayIST()): Promise<ContactRow[]> {
  const w = where(f);
  const { rows } = await pool.query<Raw>(`with ${PEOPLE} select ${SELECT} from people p ${w.sql} order by p.last_at desc nulls last, p.key limit $${w.params.length + 2}`, [today, ...w.params, cap]);
  return rows.map(toRow);
}

/** Totals for the sidebar: everyone, each kind, each tag. */
export async function contactFacets(today = todayIST()): Promise<{ total: number; kinds: Record<string, number>; tags: { tag: string; n: number }[] }> {
  const { rows } = await pool.query<{ total: number; kinds: Record<string, number> | null; tags: { tag: string; n: number }[] | null }>(
    `with ${PEOPLE}
     select (select count(*)::int from people) as total,
            (select jsonb_object_agg(k, n) from (select k, count(*)::int as n from people, unnest(kinds) k group by k) x) as kinds,
            (select jsonb_agg(jsonb_build_object('tag', t, 'n', n) order by n desc, t) from (select t, count(*)::int as n from people, unnest(tags) t group by t) y) as tags`,
    [today],
  );
  return { total: rows[0]?.total ?? 0, kinds: rows[0]?.kinds ?? {}, tags: rows[0]?.tags ?? [] };
}

export type ContactDetail = {
  contact: ContactRow;
  attributes: { name: string; value: string }[];
  messages: { at: string; channel: string; kind: string; status: string; delivery: string | null; read: boolean; clicks: number; error: string | null }[];
};

export async function getContact(key: string, today = todayIST()): Promise<ContactDetail | null> {
  if (!isContactKey(key)) return null;
  const { rows } = await pool.query<Raw>(`with ${PEOPLE} select ${SELECT} from people p where p.key = $2`, [today, key]);
  if (!rows[0]) return null;
  const c = toRow(rows[0]);
  const addresses = [c.phone ? `91${c.phone}` : null, c.email].filter((a): a is string => !!a);
  const [attrs, msgs] = await Promise.all([
    pool.query<{ name: string; value: string }>(`select name, value from public.contact_attributes where contact_key = $1 order by name`, [key]),
    pool.query<{ at: Date; channel: string; kind: string; status: string; delivery: string | null; read_at: Date | null; clicks: number; last_error: string | null }>(
      `select coalesce(sent_at, created_at) as at, channel, kind, status, delivery, read_at, clicks, last_error from public.message_outbox where to_address = any($1) order by coalesce(sent_at, created_at) desc limit 20`,
      [addresses],
    ),
  ]);
  return {
    contact: c,
    attributes: attrs.rows,
    messages: msgs.rows.map((m) => ({ at: m.at.toISOString(), channel: m.channel, kind: m.kind, status: m.status, delivery: m.delivery, read: !!m.read_at, clicks: m.clicks, error: m.last_error })),
  };
}

/** Adds a tag to people. Returns how many gained it. */
export async function addTag(keys: string[], rawTag: string, by: string): Promise<number> {
  const tag = normTag(rawTag);
  const ks = [...new Set(keys.filter(isContactKey))];
  if (!tag || !ks.length) return 0;
  const r = await pool.query(`insert into public.contact_tags (contact_key, tag, created_by) select k, $2, $3 from unnest($1::text[]) k on conflict do nothing`, [ks, tag, by.slice(0, 200)]);
  return r.rowCount ?? 0;
}

/** Removes a tag from people, including a tag that came from an imported list. */
export async function removeTag(keys: string[], rawTag: string): Promise<number> {
  const tag = normTag(rawTag);
  const ks = [...new Set(keys.filter(isContactKey))];
  if (!tag || !ks.length) return 0;
  const a = await pool.query(`delete from public.contact_tags where contact_key = any($1) and tag = $2`, [ks, tag]);
  const b = await pool.query(`update public.audience_contacts set tag = '', updated_at = now() where ${SQL_TAG("tag")} = $2 and (phone = any($1) or lower(email) = any($1))`, [ks, tag]);
  return (a.rowCount ?? 0) + (b.rowCount ?? 0);
}

/** Sets an attribute; an empty value removes it. */
export async function setAttribute(key: string, rawName: string, value: string): Promise<boolean> {
  const name = normAttr(rawName);
  if (!isContactKey(key) || !name) return false;
  const v = value.trim().slice(0, 200);
  if (!v) await pool.query(`delete from public.contact_attributes where contact_key = $1 and name = $2`, [key, name]);
  else
    await pool.query(`insert into public.contact_attributes (contact_key, name, value) values ($1, $2, $3) on conflict (contact_key, name) do update set value = excluded.value, updated_at = now()`, [key, name, v]);
  return true;
}
