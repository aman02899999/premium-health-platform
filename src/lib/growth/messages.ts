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

export type MessageKind = "renew-7" | "renew-1" | "expired-3" | "welcome" | "lead-0" | "lead-2" | "lead-5" | "trial-offer" | "comeback" | "diet-received" | "referral-bonus" | "diet-plan-ready" | "call-followup";

export type TemplateCategory = "UTILITY" | "MARKETING";

/** The quick-reply button on every Marketing template; tapping it opts the number out of promotions. */
export const STOP_PROMOTIONS = "Stop promotions";

/**
 * WhatsApp template names and the text to submit for each in Meta Business Manager (language:
 * English). {{n}} are the params in order. Utility templates must stay about the customer's own
 * membership or request: promotional wording gets them re-categorised as Marketing by Meta.
 * Marketing templates carry the "Stop promotions" button and are never sent to numbers that tapped it.
 */
export const TEMPLATES: Record<MessageKind, { name: string; category: TemplateCategory; text: string }> = {
  "renew-7": { name: "rfc_renewal_7d", category: "UTILITY", text: "Hi {{1}}, your {{2}} membership at {{3}} ends on {{4}}. Renew in one tap to keep your spot: {{5}}" },
  "renew-1": { name: "rfc_renewal_1d", category: "UTILITY", text: "Hi {{1}}, a reminder that your {{2}} membership at {{3}} ends on {{4}}. Renew now so your training isn't interrupted: {{5}}" },
  "expired-3": { name: "rfc_membership_expired_v2", category: "UTILITY", text: "Hi {{1}}, your {{2}} membership at {{3}} ended on {{4}}. To renew the same plan, use your renewal link: {{5}}" },
  welcome: { name: "rfc_welcome_v2", category: "UTILITY", text: "Welcome to {{3}}, {{1}}! Your {{2}} membership is active until {{4}}. Your member code is {{5}}. Keep it for renewals and referrals." },
  "lead-0": { name: "rfc_trial_thanks", category: "UTILITY", text: "Hi {{1}}, thanks for contacting {{2}}! Your free trial session is ready. Reply with a time that suits you, or call {{3}}." },
  "lead-2": { name: "rfc_trial_reminder_v2", category: "UTILITY", text: "Hi {{1}}, this is {{2}} about your free trial request. Your session isn't booked yet. Reply with a day and time that suits you and we'll confirm it." },
  "lead-5": { name: "rfc_trial_last_v2", category: "UTILITY", text: "Hi {{1}}, we're closing your free trial request at {{2}} this week. To book it, reply with a day and time. Plan details for your reference: {{3}}" },
  "trial-offer": { name: "rfc_trial_offer_v2", category: "MARKETING", text: "Hi {{1}}, your free trial session at {{2}} is still available: one workout with a trainer, no payment needed. Book it here: {{3}}" },
  comeback: { name: "rfc_comeback_offer_v2", category: "MARKETING", text: "Hi {{1}}, it's been a month since your {{3}} plan at {{2}} ended. Your spot is still here. Restart whenever you're ready: {{4}}" },
  "diet-received": { name: "rfc_diet_order_received", category: "UTILITY", text: "Hi {{1}}, we've received your payment for a personal diet chart from {{2}}. Your coach will prepare it and send it on WhatsApp within {{3}}." },
  // Template with a DOCUMENT header (the plan PDF); the body follows.
  "diet-plan-ready": { name: "rfc_diet_plan_ready", category: "UTILITY", text: "Hi {{1}}, your {{2}} from {{3}} is ready — the PDF is attached above. Follow it from tomorrow, and reply here with any question." },
  // After a customer's WhatsApp call ends (at most once a week per number).
  "call-followup": { name: "rfc_call_followup_v1", category: "MARKETING", text: "Hi {{1}}, thanks for calling {{2}}! If we missed anything on the call, reply here. Plans, timings and free trial booking: {{3}}" },
  "referral-bonus": { name: "rfc_referral_bonus_v2", category: "MARKETING", text: "Hi {{1}}, {{2}} joined {{3}} with your code! {{4}} bonus days have been added — your membership now runs until {{5}}." },
};

/** Outbox kinds sent with a Marketing template: these respect "Stop promotions". */
export const isMarketingKind = (kind: string) => (TEMPLATES as Record<string, { category: TemplateCategory }>)[kind]?.category === "MARKETING";

/** "Stop promotions" (the button, or typed) opts out; "Start promotions" opts back in. */
export function promotionsRequest(text: string): "stop" | "start" | null {
  const t = text.trim().toLowerCase().replace(/[.!]+$/, "");
  if (t === "stop promotions" || t === "stop" || t === "unsubscribe") return "stop";
  if (t === "start promotions") return "start";
  return null;
}

/**
 * The body text submitted to Meta for review. Meta rejects a body that ends with a variable, and
 * "...within {{3}}." still counts, so those get a closing line. Only the stored template changes:
 * the site sends the same template name and parameters.
 */
export const templateBody = (text: string) => (/\{\{\d+\}\}[\s.,!?]*$/.test(text) ? `${text}\n\nSee you at the gym!` : text);

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

export function leadMessage(kind: "lead-0" | "lead-2" | "lead-5" | "trial-offer", l: LeadLike, biz: Biz): Draft | null {
  const digits = l.phone.replace(/\D/g, "");
  const phone10 = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  if (!/^[6-9]\d{9}$/.test(phone10)) return null; // only Indian mobiles can be messaged
  // The trial offer links to the booking form; the last reminder to the plans.
  const params =
    kind === "trial-offer" ? [first(l.name), biz.name, `${biz.siteUrl}/contact#trial`] : kind === "lead-5" ? [first(l.name), biz.name, `${biz.siteUrl}/membership`] : kind === "lead-0" ? [first(l.name), biz.name, biz.phone] : [first(l.name), biz.name];
  return draft(kind, wa(phone10), l.name, params, `${kind}:${l.id}`);
}

/** A month after a membership ended without a renewal: one win-back message per end date. */
export const comebackMessage = (m: MemberLike & { renewToken: string }, biz: Biz): Draft =>
  draft("comeback", wa(m.phone), m.name, [first(m.name), biz.name, m.planName, renewUrl(biz.siteUrl, m.renewToken)], `comeback:${m.id}:${m.expiresOn}`);

/** The follow-up after a customer's WhatsApp call; one per call, and the sender limits it to one a week. */
export const callFollowUpMessage = (c: { id: string; from: string; fromName: string }, biz: Biz): Draft =>
  draft("call-followup", c.from.replace(/\D/g, ""), c.fromName, [c.fromName ? first(c.fromName) : "there", biz.name, `${biz.siteUrl}/membership`], `call-followup:${c.id}`);

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
    else if (left <= -30 && left >= -37) out.push(comebackMessage(m, biz));
  }
  for (const l of leads) {
    if (!l.followUps || (l.status !== "new" && l.status !== "contacted")) continue;
    const age = daysBetween(todayIST(new Date(l.createdAt)), today);
    const kind = age <= 1 ? "lead-0" : age >= 2 && age <= 4 ? "lead-2" : age >= 5 && age <= 8 ? "lead-5" : age >= 14 && age <= 20 ? "trial-offer" : null;
    if (!kind) continue;
    const d = leadMessage(kind, l, biz);
    if (d) out.push(d);
  }
  return out;
}

/** Click-to-chat link for sending a draft by hand from the admin's own WhatsApp. */
export const waLink = (to: string, body: string) => `https://wa.me/${to.replace(/\D/g, "")}?text=${encodeURIComponent(body)}`;

