// What each automated message says, and which approved WhatsApp template carries it.
// Pure functions: the scheduler and the admin "send now" button both use them.
import { daysBetween, formatDate, todayIST } from "./dates";

export type Channel = "whatsapp" | "email";

export type Draft = {
  channel: Channel;
  to: string; // WhatsApp: country code + number, digits only. Email: address.
  toName: string;
  /** A WhatsApp MessageKind, or an email kind such as "nurture-diet-0" / "diet-plan-email". */
  kind: string;
  /** Email subject (email drafts only). */
  subject?: string;
  /** Storage path of a file: attached to the email, or the WhatsApp template's document header. */
  attachment?: string;
  body: string;
  /** WhatsApp Cloud API template and its body parameters, in order. */
  template: string;
  params: string[];
  /** Same key = same message; the outbox refuses a second copy. */
  dedupeKey: string;
};

export type MessageKind = "renew-7" | "renew-1" | "expired-3" | "welcome" | "lead-0" | "lead-2" | "lead-5" | "diet-received" | "referral-bonus" | "diet-plan-ready";

/**
 * WhatsApp template names and the text to submit for each in Meta Business Manager
 * (category: Utility, language: English). {{n}} are the params in order.
 */
export const TEMPLATES: Record<MessageKind, { name: string; text: string }> = {
  "renew-7": { name: "rfc_renewal_7d", text: "Hi {{1}}, your {{2}} membership at {{3}} ends on {{4}}. Renew in one tap to keep your spot: {{5}}" },
  "renew-1": { name: "rfc_renewal_1d", text: "Hi {{1}}, a reminder that your {{2}} membership at {{3}} ends on {{4}}. Renew now so your training isn't interrupted: {{5}}" },
  "expired-3": { name: "rfc_membership_expired", text: "Hi {{1}}, your membership at {{3}} ended on {{4}}. We'd love to have you back — renew your {{2}} plan here: {{5}}" },
  welcome: { name: "rfc_welcome_member", text: "Welcome to {{3}}, {{1}}! Your {{2}} membership runs until {{4}}. Share your code {{5}} with friends — when they join, you both get bonus days." },
  "lead-0": { name: "rfc_trial_thanks", text: "Hi {{1}}, thanks for contacting {{2}}! Your free trial session is ready. Reply with a time that suits you, or call {{3}}." },
  "lead-2": { name: "rfc_trial_reminder", text: "Hi {{1}}, just checking in from {{2}} — your free trial is still waiting. Reply with a day and time and we'll keep a trainer free for you." },
  "lead-5": { name: "rfc_trial_last", text: "Hi {{1}}, last reminder from {{2}}: see our membership plans and join online here: {{3}}. Reply if you have any questions." },
  "diet-received": { name: "rfc_diet_order_received", text: "Hi {{1}}, we've received your payment for a personal diet chart from {{2}}. Your coach will prepare it and send it on WhatsApp within {{3}}." },
  // Template with a DOCUMENT header (the plan PDF); the body follows.
  "diet-plan-ready": { name: "rfc_diet_plan_ready", text: "Hi {{1}}, your {{2}} from {{3}} is ready — the PDF is attached above. Follow it from tomorrow, and reply here with any question." },
  "referral-bonus": { name: "rfc_referral_bonus", text: "Hi {{1}}, {{2}} joined {{3}} with your code! {{4}} bonus days have been added — your membership now runs until {{5}}." },
};

const fill = (kind: MessageKind, params: string[]) => TEMPLATES[kind].text.replace(/\{\{(\d)\}\}/g, (_, n) => params[Number(n) - 1] ?? "");
const first = (name: string) => name.trim().split(/\s+/)[0] || name;
const wa = (phone10: string) => `91${phone10}`;

export type MemberLike = { id: string; name: string; phone: string; planName: string; expiresOn: string; reminders: boolean; referralCode: string };
export type LeadLike = { id: string; name: string; phone: string; createdAt: string; status: string; followUps: boolean };
export type Biz = { name: string; phone: string; siteUrl: string };

export const renewUrl = (siteUrl: string, token: string) => `${siteUrl}/join?renew=${token}`;

function draft(kind: MessageKind, to: string, toName: string, params: string[], dedupeKey: string): Draft {
  return { channel: "whatsapp", to, toName, kind, body: fill(kind, params), template: TEMPLATES[kind].name, params, dedupeKey };
}

export function renewalMessage(kind: "renew-7" | "renew-1" | "expired-3", m: MemberLike & { renewToken: string }, biz: Biz): Draft {
  // The expiry date is part of the key: after a renewal the next cycle reminds again.
  return draft(kind, wa(m.phone), m.name, [first(m.name), m.planName, biz.name, formatDate(m.expiresOn), renewUrl(biz.siteUrl, m.renewToken)], `${kind}:${m.id}:${m.expiresOn}`);
}

export const welcomeMessage = (m: MemberLike, biz: Biz, orderId: string): Draft =>
  draft("welcome", wa(m.phone), m.name, [first(m.name), m.planName, biz.name, formatDate(m.expiresOn), m.referralCode], `welcome:${orderId}`);

export function leadMessage(kind: "lead-0" | "lead-2" | "lead-5", l: LeadLike, biz: Biz): Draft | null {
  const digits = l.phone.replace(/\D/g, "");
  const phone10 = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  if (!/^[6-9]\d{9}$/.test(phone10)) return null; // only Indian mobiles can be messaged
  const params = kind === "lead-5" ? [first(l.name), biz.name, `${biz.siteUrl}/membership`] : kind === "lead-0" ? [first(l.name), biz.name, biz.phone] : [first(l.name), biz.name];
  return draft(kind, wa(phone10), l.name, params, `${kind}:${l.id}`);
}

export const dietReceivedMessage = (o: { id: string; name: string; phone: string }, biz: Biz, turnaround: string): Draft =>
  draft("diet-received", wa(o.phone), o.name, [first(o.name), biz.name, turnaround], `diet-received:${o.id}`);

/** WhatsApp: the plan PDF as a document, sent once per plan file. */
export const dietPlanWhatsApp = (o: { id: string; name: string; phone: string }, planName: string, file: string, biz: Biz): Draft => ({
  ...draft("diet-plan-ready", wa(o.phone), o.name, [first(o.name), planName, biz.name], `diet-plan-ready:${o.id}:${file}`),
  attachment: file,
});

/** Email: the plan PDF attached (transactional — sent whether or not they opted in to marketing). */
export const dietPlanEmail = (o: { id: string; name: string; email: string }, planName: string, file: string, biz: Biz & { coach: string }): Draft => ({
  channel: "email",
  to: o.email.toLowerCase(),
  toName: o.name,
  kind: "diet-plan-email",
  subject: `Your ${planName} is ready, ${first(o.name)}`,
  body: `Hi ${first(o.name)},\n\nYour ${planName} from ${biz.name} is attached as a PDF.\n\nHow to use it:\n• Start with page 1 for your body analysis and daily targets.\n• Follow the 7-day diet chart — measures are in katori, roti and spoons.\n• The weekly programme shows which days to train and what to eat before and after.\n• Check the Guidance pages before starting any herb or supplement.\n\nQuestions? Reply to this email or message ${biz.coach} on WhatsApp at ${biz.phone}.\n\n— ${biz.coach}, ${biz.name}\n[[CTA:Message your coach|https://wa.me/${biz.phone.replace(/\D/g, "")}]]`,
  template: "",
  params: [],
  attachment: file,
  dedupeKey: `diet-plan-email:${o.id}:${file}`,
});

/** Email: order received (transactional). */
export const dietReceivedEmail = (o: { id: string; name: string; email: string }, planName: string, turnaround: string, biz: Biz): Draft => ({
  channel: "email",
  to: o.email.toLowerCase(),
  toName: o.name,
  kind: "diet-received-email",
  subject: `Payment received — your ${planName} is being prepared`,
  body: `Hi ${first(o.name)},\n\nThanks for choosing ${biz.name}. We've received your payment for the ${planName}.\n\nYour coach is preparing your plan from the details you shared. It will reach you on WhatsApp and by email within ${turnaround}.\n\nIf anything in your details has changed — weight, medicines, health — reply to this email before we send your plan.`,
  template: "",
  params: [],
  dedupeKey: `diet-received-email:${o.id}`,
});

export const referralBonusMessage = (referrer: MemberLike, referredName: string, days: number, biz: Biz, rewardId: string): Draft =>
  draft("referral-bonus", wa(referrer.phone), referrer.name, [first(referrer.name), first(referredName), biz.name, String(days), formatDate(referrer.expiresOn)], `referral-bonus:${rewardId}`);

/**
 * Everything due today. Run daily; re-running is harmless (the outbox dedupes), and a missed
 * day is caught up because each reminder has a window rather than one exact date.
 */
export function dueMessages(today: string, members: (MemberLike & { renewToken: string })[], leads: LeadLike[], biz: Biz): Draft[] {
  const out: Draft[] = [];
  for (const m of members) {
    if (!m.reminders) continue;
    const left = daysBetween(today, m.expiresOn); // 0 = last day
    if (left >= 2 && left <= 7) out.push(renewalMessage("renew-7", m, biz));
    else if (left >= 0 && left <= 1) out.push(renewalMessage("renew-1", m, biz));
    else if (left <= -3 && left >= -10) out.push(renewalMessage("expired-3", m, biz));
  }
  for (const l of leads) {
    if (!l.followUps || (l.status !== "new" && l.status !== "contacted")) continue;
    const age = daysBetween(todayIST(new Date(l.createdAt)), today);
    const kind = age <= 1 ? "lead-0" : age >= 2 && age <= 4 ? "lead-2" : age >= 5 && age <= 8 ? "lead-5" : null;
    if (!kind) continue;
    const d = leadMessage(kind, l, biz);
    if (d) out.push(d);
  }
  return out;
}

/** Click-to-chat link for sending a draft by hand from the admin's own WhatsApp. */
export const waLink = (to: string, body: string) => `https://wa.me/${to.replace(/\D/g, "")}?text=${encodeURIComponent(body)}`;

