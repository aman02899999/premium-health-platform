import "server-only";
import { pool } from "@/health/db";
import { getContent } from "@/lib/content/store";
import { applyOffer } from "@/lib/offers";
import { SITE_URL } from "@/lib/site";
import { todayIST } from "@/lib/growth/dates";
import { LEAD_STATUSES, updateLead, type LeadStatus } from "@/lib/growth/leads";
import { optedOutOfPromotions, setPromotionsOptOut } from "@/lib/growth/optouts";
import { sendKind } from "@/lib/growth/wa-templates";
import { recordReply, type SendOutcome } from "./chat";
import { chatWindow, peerId } from "./chat-window";
import { indianMobile } from "./inbound";
import { sendWhatsAppInteractive, sendWhatsAppText } from "./meta";
import { QUICK_REPLIES, manualTemplates, type ContactFacts, type QuickReplyId } from "./chat-actions";
import { logText, toInteractive } from "./wa-flow";

// The coach's tools in the admin WhatsApp chat: who the customer is (lead, member, orders),
// private notes, pausing the bot, one-tap replies, and approved templates once the 24-hour window
// has closed.

export type Contact = ContactFacts & {
  notes: string;
  botPausedUntil: string | null;
  leadId: string | null;
  diet: { plan: string; status: string; rupees: number; at: string }[];
};

/** Hours the bot stays quiet after the coach writes, so it never answers over them. */
export const COACH_PAUSE_HOURS = 2;

export async function contactInfo(peer: string): Promise<Contact> {
  const id = peerId(peer);
  const phone = indianMobile(id);
  const [settings, lead, member, diet, name, optedOut] = await Promise.all([
    pool.query<{ notes: string; bot_paused_until: Date | null }>(`select notes, bot_paused_until from public.chat_contacts where peer = $1`, [id]),
    phone
      ? pool.query<{ id: string; status: LeadStatus; interest: string; source: string; created_at: Date }>(
          `select id, status, interest, source, created_at from public.leads where right(regexp_replace(phone, '\\D', '', 'g'), 10) = $1 order by created_at desc limit 1`,
          [phone],
        )
      : null,
    phone
      ? pool.query<{ plan_name: string; expires_on: string; renew_token: string | null }>(
          `select plan_name, to_char(expires_on, 'YYYY-MM-DD') as expires_on, renew_token::text from public.members where phone = $1 order by expires_on desc limit 1`,
          [phone],
        )
      : null,
    phone
      ? pool.query<{ plan: string | null; status: string; amount_paise: number; created_at: Date }>(
          `select to_jsonb(d)->>'plan' as plan, status, amount_paise, created_at from public.diet_orders d where phone = $1 order by created_at desc limit 5`,
          [phone],
        )
      : null,
    pool.query<{ name: string }>(`select from_name as name from public.social_inbox where channel = 'whatsapp' and from_id = $1 and from_name <> '' order by created_at desc limit 1`, [id]),
    optedOutOfPromotions(id),
  ]);
  const s = settings.rows[0];
  const l = lead?.rows[0];
  const m = member?.rows[0];
  return {
    peer: id,
    name: name.rows[0]?.name ?? "",
    optedOut,
    notes: s?.notes ?? "",
    botPausedUntil: s?.bot_paused_until && s.bot_paused_until > new Date() ? s.bot_paused_until.toISOString() : null,
    leadId: l?.id ?? null,
    lead: l ? { status: l.status, interest: l.interest, source: l.source, createdAt: l.created_at.toISOString() } : null,
    member: m ? { planName: m.plan_name, expiresOn: m.expires_on, active: m.expires_on >= todayIST(), renewToken: m.renew_token } : null,
    diet: (diet?.rows ?? []).map((d) => ({ plan: d.plan ?? "", status: d.status, rupees: d.amount_paise / 100, at: d.created_at.toISOString() })),
  };
}

/** True while the coach has the bot paused (or just replied themselves). */
export async function botPaused(peer: string): Promise<boolean> {
  const { rowCount } = await pool.query(`select 1 from public.chat_contacts where peer = $1 and bot_paused_until > now()`, [peerId(peer)]);
  return Boolean(rowCount);
}

/** Pauses the bot until `until` (null resumes it). Keeps a longer pause already set unless `force`. */
export async function pauseBot(peer: string, until: Date | null, force = true): Promise<void> {
  await pool.query(
    `insert into public.chat_contacts (peer, bot_paused_until) values ($1, $2)
     on conflict (peer) do update set bot_paused_until = case when $3 or public.chat_contacts.bot_paused_until is null or public.chat_contacts.bot_paused_until < $2 then $2 else public.chat_contacts.bot_paused_until end,
       updated_at = now()`,
    [peerId(peer), until, force],
  );
}

export async function saveNotes(peer: string, notes: string): Promise<void> {
  await pool.query(
    `insert into public.chat_contacts (peer, notes) values ($1, $2) on conflict (peer) do update set notes = excluded.notes, updated_at = now()`,
    [peerId(peer), notes.slice(0, 2000)],
  );
}

export async function setLeadStatus(peer: string, status: string): Promise<SendOutcome> {
  if (!LEAD_STATUSES.includes(status as LeadStatus)) return { ok: false, error: "Unknown status", status: 400 };
  const c = await contactInfo(peer);
  if (!c.leadId) return { ok: false, error: "This number isn't a lead", status: 404 };
  await updateLead(c.leadId, { status: status as LeadStatus });
  return { ok: true };
}

export async function setOptOut(peer: string, optedOut: boolean): Promise<void> {
  await setPromotionsOptOut(peerId(peer), optedOut);
}

async function windowOpen(id: string) {
  const { rows } = await pool.query<{ at: Date | null }>(`select max(created_at) as at from public.social_inbox where channel = 'whatsapp' and kind = 'message' and from_id = $1`, [id]);
  return chatWindow(rows[0]?.at ?? null).open;
}

/** One tap: the trial button, the plans, fees, timings... sent as the coach, inside the window. */
export async function sendQuickReply(peer: string, quick: string, by: string): Promise<SendOutcome> {
  const id = peerId(peer);
  const q = QUICK_REPLIES.find((r) => r.id === (quick as QuickReplyId));
  if (!q) return { ok: false, error: "Unknown quick reply", status: 400 };
  if (!(await windowOpen(id))) return { ok: false, error: "The 24-hour window is closed: send a template instead.", status: 409 };
  const c = await getContent();
  const name = (await contactInfo(id)).name;
  const steps = q.build({ business: c.business, plans: applyOffer(c.plans, todayIST()), siteUrl: SITE_URL, name, text: "" });
  for (const step of steps) {
    const interactive = toInteractive(step);
    let res = interactive ? await sendWhatsAppInteractive(id, interactive) : await sendWhatsAppText(id, step.body);
    // Same safety net as the bot: a refused button message goes again as plain text.
    if (!res.ok && interactive) res = await sendWhatsAppText(id, logText(step));
    await recordReply({ to: id, body: logText(step), by, ok: res.ok, error: res.ok ? null : res.error, externalId: res.ok ? res.id : null });
    if (!res.ok) return { ok: false, error: res.error, status: 502 };
  }
  await pauseBot(id, new Date(Date.now() + COACH_PAUSE_HOURS * 3_600_000), false);
  return { ok: true };
}

/** An approved template, the only way to write first once the 24-hour window has closed. */
export async function sendManualTemplate(peer: string, kind: string, by: string): Promise<SendOutcome> {
  const contact = await contactInfo(peer);
  const biz = (await getContent()).business;
  const t = manualTemplates(contact, { name: biz.name, phone: biz.phone, siteUrl: SITE_URL }).find((x) => x.kind === kind);
  if (!t) return { ok: false, error: "That template doesn't fit this customer", status: 400 };
  if (t.marketing && contact.optedOut) return { ok: false, error: "This customer tapped Stop promotions: only utility messages are allowed.", status: 409 };
  const res = await sendKind(contact.peer, t.kind, t.name, t.params);
  await recordReply({ to: contact.peer, body: `📨 Template ${t.name}\n${t.preview}`, by, ok: res.ok, error: res.ok ? null : res.error, externalId: res.ok ? res.id : null });
  return res.ok ? { ok: true } : { ok: false, error: res.error, status: 502 };
}
