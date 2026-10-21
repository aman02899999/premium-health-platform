import "server-only";
import { pool } from "@/health/db";
import { MARKETING_KINDS } from "./messages";
import { insertLead, updateLead } from "./leads";
import { WINDOW_HOURS, buildCallList, contactKey, type Facts, type Outcome, type Prospect, type Signal } from "./call-list-core";

// Who to call today: people who replied to an offer or clicked its link in the last 72 hours and
// haven't joined, paid, opted out or heard from a person yet. Calls happen on the gym's phone; the
// desk records the outcome here.

const TEN = (col: string) => `right(regexp_replace(coalesce(${col}, ''), '\\D', '', 'g'), 10)`;
// Messages written by a person, not the bot, receipts or the scheduler.
const AUTOMATIC = ["auto-reply", "ai-agent", "payment receipt", "scheduled"];

const iso = (d: Date | string) => new Date(d).toISOString();

async function signals(): Promise<Signal[]> {
  const window = `now() - interval '${WINDOW_HOURS} hours'`;
  const [replies, clicks] = await Promise.all([
    // A WhatsApp message from someone within 14 days of a promotion we sent them.
    pool.query<{ phone: string; name: string; at: Date; text: string; campaign: string | null; kind: string }>(
      `with promo as (
         select distinct on (${TEN("o.to_address")}) ${TEN("o.to_address")} as phone, o.sent_at, o.kind, o.to_name, c.name as campaign
           from public.message_outbox o
           left join public.campaigns c on o.dedupe_key like 'campaign:%' and c.id::text = split_part(o.dedupe_key, ':', 2)
          where o.channel = 'whatsapp' and o.status = 'sent' and o.kind = any($1) and o.sent_at > ${window} - interval '14 days'
          order by ${TEN("o.to_address")}, o.sent_at desc)
       select p.phone, coalesce(nullif(max(i.from_name), ''), max(p.to_name), '') as name, max(i.created_at) as at,
              (array_agg(i.body order by i.created_at desc))[1] as text, max(p.campaign) as campaign, max(p.kind) as kind
         from promo p
         join public.social_inbox i on i.channel = 'whatsapp' and i.kind = 'message' and ${TEN("i.from_id")} = p.phone
          and i.created_at > p.sent_at and i.created_at < p.sent_at + interval '14 days' and i.created_at > ${window}
        group by p.phone`,
      [MARKETING_KINDS],
    ),
    // A tracked link clicked in a promotion or a campaign email.
    pool.query<{ channel: string; to_address: string; to_name: string; at: Date; campaign: string | null; kind: string }>(
      `select o.channel, o.to_address, o.to_name, o.first_click_at as at, c.name as campaign, o.kind
         from public.message_outbox o
         left join public.campaigns c on o.dedupe_key like 'campaign:%' and c.id::text = split_part(o.dedupe_key, ':', 2)
        where o.clicks > 0 and o.first_click_at > ${window} and (o.dedupe_key like 'campaign:%' or o.kind = any($1) or o.kind like 'nurture-%')`,
      [MARKETING_KINDS],
    ),
  ]);
  const label = (campaign: string | null, kind: string) => campaign || (kind.startsWith("nurture-") ? "an email" : "an offer");
  const out: Signal[] = replies.rows.map((r) => ({ contact: r.phone, phone: r.phone, email: null, name: r.name, type: "replied", at: iso(r.at), campaign: label(r.campaign, r.kind), text: (r.text ?? "").trim() }));
  // An email click becomes a phone call when we know their number.
  const emails = [...new Set(clicks.rows.filter((c) => c.channel === "email").map((c) => c.to_address.trim().toLowerCase()))];
  const phoneOf = new Map<string, string>();
  if (emails.length) {
    const { rows } = await pool.query<{ email: string; phone: string }>(
      `select distinct on (email) email, phone from (
         select lower(email) as email, ${TEN("phone")} as phone, 0 as rank from public.members where lower(email) = any($1)
         union all select lower(email), ${TEN("phone")}, 1 from public.leads where lower(email) = any($1)
         union all select lower(email), ${TEN("phone")}, 2 from public.audience_contacts where lower(email) = any($1)) x
        where phone ~ '^[6-9][0-9]{9}$' order by email, rank`,
      [emails],
    );
    for (const r of rows) phoneOf.set(r.email, r.phone);
  }
  for (const c of clicks.rows) {
    const email = c.channel === "email" ? c.to_address.trim().toLowerCase() : null;
    const phone = email ? (phoneOf.get(email) ?? null) : contactKey(c.to_address);
    const contact = phone ?? email;
    if (!contact) continue;
    out.push({ contact, phone, email, name: c.to_name ?? "", type: "clicked", at: iso(c.at), campaign: label(c.campaign, c.kind), text: "" });
  }
  return out;
}

async function facts(contacts: string[]): Promise<Map<string, Facts>> {
  const phones = contacts.filter((c) => !c.includes("@"));
  const emails = contacts.filter((c) => c.includes("@"));
  const map = new Map<string, Facts>();
  if (!contacts.length) return map;
  const { rows } = await pool.query<{ contact: string; active: boolean; paid_at: Date | null; opted_out: boolean; lead_status: string | null; human_at: Date | null; calls: { at: string; outcome: Outcome }[] | null }>(
    `with who as (select unnest($1::text[]) as contact)
     select w.contact,
       exists (select 1 from public.members m where (${TEN("m.phone")} = w.contact or lower(m.email) = w.contact) and m.expires_on >= current_date) as active,
       (select max(p) from (
          select max(paid_at) as p from public.membership_orders where status = 'paid' and (${TEN("phone")} = w.contact or lower(email) = w.contact)
          union all select max(paid_at) from public.diet_orders where status = 'paid' and (${TEN("phone")} = w.contact or lower(email) = w.contact)
          union all select max(paid_at) from public.shop_orders where status = 'paid' and (${TEN("phone")} = w.contact or lower(email) = w.contact)
          union all select max(paid_at) from public.book_orders where status = 'paid' and lower(email) = w.contact
          union all select max(paid_at) from public.payment_requests where status = 'paid' and phone = w.contact) x) as paid_at,
       exists (select 1 from public.whatsapp_optouts o where ${TEN("o.phone")} = w.contact)
         or exists (select 1 from public.marketing_contacts mc where mc.channel = 'email' and mc.address = w.contact and mc.unsubscribed_at is not null) as opted_out,
       (select l.status from public.leads l where ${TEN("l.phone")} = w.contact or lower(l.email) = w.contact order by l.created_at desc limit 1) as lead_status,
       (select max(r.created_at) from public.chat_replies r where r.channel = 'whatsapp' and r.ok and ${TEN("r.to_id")} = w.contact and not (r.sent_by = any($2))) as human_at,
       (select json_agg(json_build_object('at', to_char(c.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'outcome', c.outcome)) from public.prospect_calls c where c.contact = w.contact) as calls
     from who w`,
    [[...phones, ...emails], AUTOMATIC],
  );
  for (const r of rows)
    map.set(r.contact, {
      activeMember: r.active,
      paidAt: r.paid_at ? iso(r.paid_at) : null,
      optedOut: r.opted_out,
      leadStatus: r.lead_status,
      humanReplyAt: r.human_at ? iso(r.human_at) : null,
      calls: r.calls ?? [],
    });
  return map;
}

/** Today's call list, hottest first (at most 100). */
export async function callList(now = new Date()): Promise<Prospect[]> {
  const s = await signals();
  return buildCallList(s, await facts([...new Set(s.map((x) => x.contact))]), now).slice(0, 100);
}

/** How many people are waiting for a call (0 when the tables aren't there yet). */
export async function callListCount(now = new Date()): Promise<number> {
  return (await callList(now).catch(() => [])).length;
}

/**
 * Records a call. "Interested" makes them a lead (or updates the lead they already are) marked
 * contacted, so the lead follow-ups and trial booking take over from here.
 */
export async function logCall(raw: string, outcome: Outcome, note: string, by: string, name = ""): Promise<{ ok: true; leadId: string | null } | { ok: false; error: string }> {
  const contact = contactKey(raw);
  if (!contact) return { ok: false, error: "That isn't a valid mobile number or email." };
  await pool.query(`insert into public.prospect_calls (contact, outcome, note, by_user) values ($1, $2, $3, $4)`, [contact, outcome, note.trim().slice(0, 300), by.slice(0, 200)]);
  if (outcome !== "interested") return { ok: true, leadId: null };
  const phone = contact.includes("@") ? null : contact;
  const { rows } = await pool.query<{ id: string }>(
    `select id from public.leads where (${TEN("phone")} = $1 or lower(email) = $1) and created_at > now() - interval '60 days' order by created_at desc limit 1`,
    [contact],
  );
  // A lead needs a phone number: someone we only know by email is logged, not made a lead.
  if (!rows[0] && !phone) return { ok: true, leadId: null };
  const leadId =
    rows[0]?.id ??
    (await insertLead({
      name: name.trim().length >= 2 ? name.trim().slice(0, 80) : "Campaign call",
      phone: phone!,
      email: null,
      interest: "membership",
      goal: "",
      message: note.trim().slice(0, 600) || "Interested on a call after an offer.",
      source: "campaign-call",
      marketing: false,
    }));
  await updateLead(leadId, { status: "contacted", ...(note.trim() ? { notes: note.trim().slice(0, 1000) } : {}) });
  return { ok: true, leadId };
}
