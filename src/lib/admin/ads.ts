import "server-only";
import { pool } from "@/health/db";
import { todayIST } from "@/lib/growth/dates";
import { adSlug, adSource, isPlatform, isSlug, parseRupees, AD_PAGES, type Platform } from "./ads-core";

// Every paid order with its attribution (shop totals are whole rupees).
const ORDERS = `
  select 'm' || id as oid, amount_paise::bigint - refunded_paise as net, paid_at, right(regexp_replace(phone, '\\D', '', 'g'), 10) as phone, attribution from public.membership_orders where status = 'paid'
  union all select 'd' || id, amount_paise - refunded_paise, paid_at, phone, attribution from public.diet_orders where status = 'paid'
  union all select 's' || id, total::bigint * 100 - refunded_paise, paid_at, phone, attribution from public.shop_orders where status = 'paid'
  union all select 'b' || id, amount_paise - refunded_paise, paid_at, right(regexp_replace(phone, '\\D', '', 'g'), 10), attribution from public.book_orders where status = 'paid'
  union all select 'r' || id, amount_paise - refunded_paise, paid_at, phone, attribution from public.payment_requests where status = 'paid'`;

// Tagged with the campaign at first or last touch (UTM values are stored lowercased).
const TAGGED = (alias: string) => `(${alias}.attribution -> 'first' ->> 'campaign' = c.slug or ${alias}.attribution -> 'last' ->> 'campaign' = c.slug)`;

export type AdRow = {
  id: string;
  name: string;
  platform: Platform;
  slug: string;
  landing: string;
  startOn: string;
  endOn: string | null;
  spendPaise: number;
  notes: string;
  active: boolean;
  leads: number;
  /** Paid orders: tagged orders, plus orders by a lead from this ad paid after the lead came in. */
  orders: number;
  netPaise: number;
};

export async function listAds(): Promise<AdRow[]> {
  const { rows } = await pool.query<{ id: string; name: string; platform: Platform; slug: string; landing: string; start_on: string; end_on: string | null; spend_paise: string; notes: string; active: boolean; leads: number; orders: number; net: string }>(
    `with o as (${ORDERS}),
     -- Each campaign's leads, once: a chat that carried its "(ad …)" tag, or a tagged web visit.
     ad_leads as (
       select c.id as cid, right(regexp_replace(l.phone, '\\D', '', 'g'), 10) as phone, l.created_at
         from public.ad_campaigns c join public.leads l on l.source = 'ad:' || c.slug or ${TAGGED("l")}
     ),
     -- Its sales: tagged orders, and orders those leads paid after enquiring (each order once).
     hits as (
       select c.id as cid, o.oid, o.net from public.ad_campaigns c join o on ${TAGGED("o")}
       union
       select al.cid, o.oid, o.net from ad_leads al join o on o.phone = al.phone and o.paid_at >= al.created_at
     )
     select c.id, c.name, c.platform, c.slug, c.landing, to_char(c.start_on, 'YYYY-MM-DD') as start_on, to_char(c.end_on, 'YYYY-MM-DD') as end_on, c.spend_paise::text, c.notes, c.active,
            (select count(*)::int from ad_leads a where a.cid = c.id) as leads,
            (select count(*)::int from hits h where h.cid = c.id) as orders,
            (select coalesce(sum(h.net), 0)::text from hits h where h.cid = c.id) as net
       from public.ad_campaigns c
      order by c.active desc, c.start_on desc, c.created_at desc`,
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    platform: r.platform,
    slug: r.slug,
    landing: r.landing,
    startOn: r.start_on,
    endOn: r.end_on,
    spendPaise: Number(r.spend_paise),
    notes: r.notes,
    active: r.active,
    leads: r.leads,
    orders: r.orders,
    netPaise: Number(r.net),
  }));
}

export type AdRequest = { name?: unknown; platform?: unknown; landing?: unknown; startOn?: unknown; spend?: unknown };

export async function createAd(b: AdRequest, by: string): Promise<{ ok: true; id: string; slug: string } | { ok: false; error: string }> {
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 80) : "";
  if (!name) return { ok: false, error: "Name the campaign, e.g. “Diwali offer – Sector 93”." };
  if (!isPlatform(b.platform)) return { ok: false, error: "Pick where the ad runs." };
  const landing = AD_PAGES.find((p) => p.path === b.landing)?.path;
  if (!landing) return { ok: false, error: "Pick the page the ad opens." };
  const today = todayIST();
  const startOn = typeof b.startOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.startOn) ? b.startOn : today;
  const spend = b.spend === undefined || b.spend === "" ? 0 : parseRupees(b.spend);
  if (spend === null) return { ok: false, error: "Spend must be a number of rupees." };
  let slug = adSlug(name);
  if (slug.length < 3) slug = `ad-${slug || "campaign"}`;
  // Same name twice: add the date so each campaign keeps its own tag.
  const taken = await pool.query(`select 1 from public.ad_campaigns where slug = $1`, [slug]);
  if (taken.rowCount) slug = `${slug.slice(0, 30)}-${today.slice(5).replace("-", "")}`;
  if (!isSlug(slug)) return { ok: false, error: "Use letters and numbers in the name." };
  const ins = await pool.query<{ id: string }>(
    `insert into public.ad_campaigns (created_by, name, platform, slug, landing, start_on, spend_paise) values ($1, $2, $3, $4, $5, $6, $7) on conflict (slug) do nothing returning id`,
    [by.slice(0, 200), name, b.platform, slug, landing, startOn, spend * 100],
  );
  if (!ins.rows[0]) return { ok: false, error: "A campaign with this name already exists today; change the name a little." };
  return { ok: true, id: ins.rows[0].id, slug };
}

/** Spend is the running total from the ad platform's bill; it replaces the old figure. */
export async function updateAd(id: string, patch: { spend?: unknown; active?: unknown; notes?: unknown }): Promise<string | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return "Unknown campaign.";
  if (patch.spend !== undefined) {
    const s = parseRupees(patch.spend);
    if (s === null) return "Spend must be a number of rupees.";
    await pool.query(`update public.ad_campaigns set spend_paise = $2, updated_at = now() where id = $1`, [id, s * 100]);
  }
  if (typeof patch.active === "boolean")
    await pool.query(`update public.ad_campaigns set active = $2, end_on = case when $2 then null else coalesce(end_on, greatest(start_on, $3::date)) end, updated_at = now() where id = $1`, [id, patch.active, todayIST()]);
  if (typeof patch.notes === "string") await pool.query(`update public.ad_campaigns set notes = $2, updated_at = now() where id = $1`, [id, patch.notes.trim().slice(0, 500)]);
  return null;
}

/** The lead source for a WhatsApp chat that came from a Click-to-WhatsApp ad, when the tag is real. */
export async function adLeadSource(slug: string | null): Promise<string | null> {
  if (!slug) return null;
  const { rowCount } = await pool.query(`select 1 from public.ad_campaigns where slug = $1`, [slug]);
  return rowCount ? adSource(slug) : null;
}

/** What is and isn't connected, so the page says plainly why a number may be missing. */
export function adsSetup(): { key: string; label: string; on: boolean; why: string }[] {
  return [
    {
      key: "capi",
      label: "Meta Conversions API",
      on: !!process.env.META_CAPI_TOKEN,
      why: "Sends leads and purchases to Meta so its ads optimise for real customers. Add META_CAPI_TOKEN (Events Manager → your pixel → Settings → Generate access token) in Vercel.",
    },
  ];
}
