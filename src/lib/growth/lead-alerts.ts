// Speed to lead: the coach hears about a website lead the minute it arrives, and again in the
// evening about anyone still waiting for a first call. Pure builders; hooks.ts and the evening
// cron decide when. Email only: WhatsApp can't message the coach without an approved template.
import type { Draft } from "./messages";
import { formatTrial } from "./trials";

export type AlertLead = { id: string; name: string; phone: string; goal: string; message: string; source: string; trialAt: string | null; createdAt: string };

const first = (name: string) => name.trim().split(/\s+/)[0] || name;
const wa10 = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.length === 10 ? `91${d}` : d;
};
/** Click-to-chat link with an opening line ready to send. */
export const replyLink = (l: Pick<AlertLead, "name" | "phone" | "trialAt">, gym: string) =>
  `https://wa.me/${wa10(l.phone)}?text=${encodeURIComponent(
    l.trialAt ? `Hi ${first(l.name)}, this is ${gym}. Your free trial is booked for ${formatTrial(l.trialAt)}. See you then! Any questions before you come?` : `Hi ${first(l.name)}, this is ${gym} about your free trial. What day and time suits you?`,
  )}`;

const ago = (iso: string, now: Date) => {
  const min = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60_000));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
};

/** The instant alert for one lead. */
export function newLeadAlert(l: AlertLead, to: string, gym: string, adminUrl: string): Draft {
  const subject = `New lead: ${l.name}${l.trialAt ? `, trial ${formatTrial(l.trialAt)}` : ", wants a call"}`;
  const body = [
    `${l.name} just asked about ${l.trialAt ? "a free trial" : "joining"} on the website (${l.source}).`,
    [`• Phone: ${l.phone}`, l.goal && `• Goal: ${l.goal}`, l.trialAt ? `• Trial booked: ${formatTrial(l.trialAt)}` : "• No trial time picked: call to fix one", l.message && `• Note: "${l.message.slice(0, 200)}"`].filter(Boolean).join("\n"),
    `People who hear back within 5 minutes book and show up far more often than those called the next day. One tap below opens WhatsApp with a message ready to send. Then mark them "contacted" in Leads.`,
    `Leads: ${adminUrl}?tab=leads`,
    `[[CTA:WhatsApp ${first(l.name)} now|${replyLink(l, gym)}]]`,
  ].join("\n\n");
  return { channel: "email", to, toName: "Coach", kind: "admin-lead-alert", subject: subject.slice(0, 200), body, template: "", params: [], dedupeKey: `admin-lead-alert:${l.id}` };
}

/** Evening reminder: leads still "new" two hours or more after they arrived. One email a day at most. */
export function uncontactedAlert(leads: AlertLead[], to: string, gym: string, adminUrl: string, now: Date, date: string): Draft | null {
  if (!leads.length) return null;
  const lines = leads.slice(0, 20).map((l) => `• ${l.name}, ${l.phone}, waiting ${ago(l.createdAt, now)}${l.trialAt ? `, trial ${formatTrial(l.trialAt)}` : ""}\n  ${replyLink(l, gym)}`);
  const body = [
    `${leads.length} lead${leads.length === 1 ? " is" : "s are"} still waiting for a first call or message. Every hour they wait, they're more likely to join another gym.`,
    lines.join("\n"),
    `Tap a link to open WhatsApp with a message ready, then mark them "contacted" in Leads.`,
    `[[CTA:Open Leads|${adminUrl}?tab=leads]]`,
  ].join("\n\n");
  return { channel: "email", to, toName: "Coach", kind: "admin-lead-escalation", subject: `${leads.length} lead${leads.length === 1 ? "" : "s"} still waiting for you`, body: body.slice(0, 6000), template: "", params: [], dedupeKey: `admin-lead-escalation:${date}` };
}
