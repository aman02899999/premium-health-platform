// What each automated message says, and which approved WhatsApp template carries it.
// Pure functions: the scheduler and the admin "send now" button both use them.
import { daysBetween, formatDate, todayIST } from "./dates";
import { formatTrial, istParts, trialStage } from "./trials";

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
  /** A tracked link in the message: /r/<code> counts the click and redirects to url. */
  link?: { code: string; url: string };
};

export type MessageKind = "renew-7" | "renew-1" | "expired-3" | "welcome" | "lead-0" | "lead-2" | "lead-5" | "trial-offer" | "comeback" | "diet-received" | "referral-bonus" | "diet-plan-ready" | "call-followup" | "offer-broadcast" | "review-request" | "trial-booked" | "trial-today" | "trial-missed" | "trial-join" | "trial-join-last";

export type TemplateCategory = "UTILITY" | "MARKETING";

/** Banner images in public/brand/banners, shown as the template's IMAGE header and on top of emails. */
export type TemplateBanner = "offer" | "welcome" | "renewal" | "trial" | "comeback" | "diet" | "referral" | "thanks";

export type TemplateDef = {
  name: string;
  category: TemplateCategory;
  text: string;
  /** IMAGE header: the banner sent above the text. */
  header?: TemplateBanner;
  /** The approved template this one replaces: used (text only) until Meta approves the new one. */
  legacy?: string;
};

/** The quick-reply button on every Marketing template; tapping it opts the number out of promotions. */
export const STOP_PROMOTIONS = "Stop promotions";

/**
 * WhatsApp template names and the text to submit for each in Meta Business Manager (language:
 * English). {{n}} are the params in order. Utility templates must stay about the customer's own
 * membership or request: promotional wording gets them re-categorised as Marketing by Meta.
 * Marketing templates carry the "Stop promotions" button and are never sent to numbers that tapped it.
 * Every template also carries a "Call a coach" button (the number a person answers) and, for v3, the
 * brand banner as an IMAGE header. Params are unchanged from the legacy versions, so a row queued for
 * the old template sends with the new one as soon as Meta approves it.
 */
export const TEMPLATES: Record<MessageKind, TemplateDef> = {
  "renew-7": { name: "rfc_renewal_7d_v3", legacy: "rfc_renewal_7d", header: "renewal", category: "UTILITY", text: "⏰ *Membership reminder*\n\nHi {{1}}, your *{{2}}* membership at {{3}} ends on *{{4}}*.\n\nRenew in one tap to keep your spot and your progress:\n👉 {{5}}" },
  "renew-1": { name: "rfc_renewal_1d_v3", legacy: "rfc_renewal_1d", header: "renewal", category: "UTILITY", text: "⚠️ *Your membership ends tomorrow*\n\nHi {{1}}, your *{{2}}* membership at {{3}} ends on *{{4}}*.\n\nRenew now so your training isn't interrupted:\n👉 {{5}}" },
  "expired-3": { name: "rfc_membership_expired_v3", legacy: "rfc_membership_expired_v2", header: "renewal", category: "UTILITY", text: "Hi {{1}}, your *{{2}}* membership at {{3}} ended on *{{4}}*.\n\nTo renew the same plan, use your personal renewal link:\n👉 {{5}}" },
  welcome: { name: "rfc_welcome_v3", legacy: "rfc_welcome_v2", header: "welcome", category: "UTILITY", text: "👑 *Welcome to {{3}}, {{1}}!*\n\nYour *{{2}}* membership is active until *{{4}}*.\n\n🎟️ Your member code: *{{5}}*\nKeep it for renewals and referrals." },
  "lead-0": { name: "rfc_trial_thanks_v3", legacy: "rfc_trial_thanks", header: "trial", category: "UTILITY", text: "Hi {{1}}, thanks for contacting *{{2}}*! 🙌\n\nYour *free trial session* is ready: one workout with a trainer, no payment needed.\n\nReply with a time that suits you, or call {{3}}." },
  "lead-2": { name: "rfc_trial_reminder_v3", legacy: "rfc_trial_reminder_v2", header: "trial", category: "UTILITY", text: "Hi {{1}}, this is *{{2}}* about your free trial request. ⏳\n\nYour session isn't booked yet. Reply with a day and time that suits you and we'll confirm it." },
  "lead-5": { name: "rfc_trial_last_v3", legacy: "rfc_trial_last_v2", header: "trial", category: "UTILITY", text: "Hi {{1}}, we're closing your free trial request at *{{2}}* this week.\n\nTo book it, reply with a day and time.\n📋 Plan details for your reference: {{3}}" },
  // A visitor who picked a trial time on the website: confirmation, the morning of, and a new time if the desk marked them absent.
  "trial-booked": { name: "rfc_trial_booked_v3", legacy: "rfc_trial_booked_v1", header: "trial", category: "UTILITY", text: "✅ *Free trial booked*\n\nHi {{1}}, your free trial at *{{2}}* is booked for *{{3}}*.\n\n📍 Directions: {{4}}\n\nTo change the time, reply to this message." },
  "trial-today": { name: "rfc_trial_today_v3", legacy: "rfc_trial_today_v1", header: "trial", category: "UTILITY", text: "🔥 *Today's the day, {{1}}!*\n\nSee you at *{{2}}* for your free trial at {{3}}.\n\n👟 Bring sports shoes and a water bottle. Can't make it? Reply here and we'll move it." },
  "trial-missed": { name: "rfc_trial_missed_v3", legacy: "rfc_trial_missed_v1", header: "trial", category: "UTILITY", text: "Hi {{1}}, we missed you at your free trial at *{{2}}*. 😕\n\nYour trial is still open. Pick a new time here:\n👉 {{3}}" },
  // After the desk marks that they came: the plans the next day, and a last word a few days later.
  "trial-join": { name: "rfc_trial_join_v3", legacy: "rfc_trial_join_v1", header: "offer", category: "MARKETING", text: "💪 *That was a strong start, {{1}}!*\n\nThanks for training with us at {{2}}. Keep going with a trainer by your side and start building your dream physique.\n\n🏆 Choose your plan here: {{3}}" },
  "trial-join-last": { name: "rfc_trial_join_last_v3", legacy: "rfc_trial_join_last_v1", header: "offer", category: "MARKETING", text: "Hi {{1}}, the first week decides whether a new habit sticks. 🔥\n\nYour spot at *{{2}}* is ready. Don't let Monday become \"next Monday\" 😉\n\n👉 Plans and online joining: {{3}}" },
  "trial-offer": { name: "rfc_trial_offer_v3", legacy: "rfc_trial_offer_v2", header: "trial", category: "MARKETING", text: "🎟️ *Your FREE workout is still waiting, {{1}}!*\n\nYour free trial session at {{2}} is still available: one workout with a trainer, no payment needed.\n\n👉 Book it here: {{3}}" },
  comeback: { name: "rfc_comeback_offer_v3", legacy: "rfc_comeback_offer_v2", header: "comeback", category: "MARKETING", text: "👀 *The gym misses you, {{1}}!*\n\nIt's been a month since your {{3}} plan at {{2}} ended. Your dumbbells have been asking about you, and your spot is still here.\n\n💪 Restart whenever you're ready: {{4}}" },
  "diet-received": { name: "rfc_diet_order_received_v3", legacy: "rfc_diet_order_received", header: "diet", category: "UTILITY", text: "✅ *Payment received*\n\nHi {{1}}, we've received your payment for a personal diet chart from *{{2}}*.\n\nYour coach will prepare it and send it on WhatsApp within *{{3}}*." },
  // Template with a DOCUMENT header (the plan PDF); the body follows.
  "diet-plan-ready": { name: "rfc_diet_plan_ready", category: "UTILITY", text: "Hi {{1}}, your {{2}} from {{3}} is ready — the PDF is attached above. Follow it from tomorrow, and reply here with any question." },
  // An admin campaign to members, ex-members and imported contacts (Audience page).
  "offer-broadcast": { name: "rfc_offer_broadcast_v3", legacy: "rfc_offer_broadcast_v1", header: "offer", category: "MARKETING", text: "🔥 *WOW, {{1}}! Offer unlocked* 🔥\n\n{{2}} has something special for you:\n\n🎁 {{3}}\n\nGrab it before it's gone and start building your dream physique 💪\n\n👉 See details: {{4}}" },
  // After a customer's WhatsApp call ends (at most once a week per number).
  "call-followup": { name: "rfc_call_followup_v3", legacy: "rfc_call_followup_v1", header: "welcome", category: "MARKETING", text: "Hi {{1}}, thanks for calling *{{2}}*! 📞\n\nIf we missed anything on the call, reply here.\n\n👉 Plans, timings and free trial booking: {{3}}" },
  // Once per person: a member about a month in, or a diet client a week after their plan arrived.
  // Everyone in those windows is asked (Google forbids asking only happy customers), nothing is offered for it.
  "review-request": { name: "rfc_review_request_v3", legacy: "rfc_review_request_v1", header: "thanks", category: "MARKETING", text: "🙏 *Thank you for choosing {{2}}, {{1}}!*\n\nIf you have a minute, an honest Google review helps other people in Noida find us. Good or bad, we read every one.\n\n⭐ {{3}}" },
  "referral-bonus": { name: "rfc_referral_bonus_v3", legacy: "rfc_referral_bonus_v2", header: "referral", category: "MARKETING", text: "🎁 *Bonus days unlocked, {{1}}!*\n\n{{2}} joined {{3}} with your code. *{{4}} bonus days* have been added: your membership now runs until *{{5}}*.\n\nGains are better together 💪" },
};

/** Outbox kinds sent with a Marketing template: these respect "Stop promotions". */
/** Every WhatsApp template kind Meta bills and rate-limits as marketing. */
export const MARKETING_KINDS = (Object.keys(TEMPLATES) as MessageKind[]).filter((k) => TEMPLATES[k].category === "MARKETING");
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
export type LeadLike = { id: string; name: string; phone: string; createdAt: string; status: string; followUps: boolean; trialAt?: string | null; showedUp?: boolean | null };
/** mapsUrl: the Google Maps link from Admin → Business, for directions in the trial confirmation. */
export type Biz = { name: string; phone: string; siteUrl: string; mapsUrl?: string };

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

/** The 10-digit Indian mobile in a lead's phone, or null (only Indian mobiles can be messaged). */
function mobile10(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  const phone10 = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(phone10) ? phone10 : null;
}

export function leadMessage(kind: "lead-0" | "lead-2" | "lead-5" | "trial-offer", l: LeadLike, biz: Biz): Draft | null {
  const phone10 = mobile10(l.phone);
  if (!phone10) return null;
  // The trial offer links to the booking form; the last reminder to the plans.
  const params =
    kind === "trial-offer" ? [first(l.name), biz.name, `${biz.siteUrl}/contact#trial`] : kind === "lead-5" ? [first(l.name), biz.name, `${biz.siteUrl}/membership`] : kind === "lead-0" ? [first(l.name), biz.name, biz.phone] : [first(l.name), biz.name];
  return draft(kind, wa(phone10), l.name, params, `${kind}:${l.id}`);
}

/**
 * Messages about a booked trial. The trial time is part of every key, so a lead who rebooks gets
 * the confirmation and reminders again for the new time.
 */
export function trialMessage(kind: "trial-booked" | "trial-today" | "trial-missed" | "trial-join" | "trial-join-last", l: LeadLike & { trialAt: string }, biz: Biz): Draft | null {
  const phone10 = mobile10(l.phone);
  if (!phone10) return null;
  const n = first(l.name);
  const rebook = `${biz.siteUrl}/contact#trial`;
  const plans = `${biz.siteUrl}/membership`;
  const params =
    kind === "trial-booked" ? [n, biz.name, formatTrial(l.trialAt), biz.mapsUrl || `${biz.siteUrl}/contact`]
    : kind === "trial-today" ? [n, timeOf(l.trialAt), biz.name]
    : kind === "trial-missed" ? [n, biz.name, rebook]
    : [n, biz.name, plans];
  return draft(kind, wa(phone10), l.name, params, `${kind}:${l.id}:${l.trialAt}`);
}

const timeOf = (iso: string) => formatTrial(iso).split(", ").pop()!;

/** Email: the booking confirmation for a visitor who gave an address (transactional). */
export const trialBookedEmail = (l: { id: string; name: string; email: string; trialAt: string }, biz: Biz & { address?: string }): Draft => ({
  channel: "email",
  to: l.email.toLowerCase(),
  toName: l.name,
  kind: "trial-booked-email",
  subject: `Your free trial: ${formatTrial(l.trialAt)}`,
  body: `Hi ${first(l.name)},\n\nYour free trial at ${biz.name} is booked for ${formatTrial(l.trialAt)}.\n\n${biz.address ? `Where: ${biz.address}\n` : ""}What to bring: sports shoes, a water bottle and a small towel.\nWhat happens: a short chat about your goal, a few movement checks, and a workout with a trainer. No payment needed.\n\nNeed a different time? Reply to this email or call ${biz.phone}.\n[[CTA:Get directions|${biz.mapsUrl || `${biz.siteUrl}/contact`}]]`,
  template: "",
  params: [],
  dedupeKey: `trial-booked-email:${l.id}:${l.trialAt}`,
});

/** What a booked lead is due today, from the stage the desk marked. */
function trialDue(l: LeadLike & { trialAt: string }, today: string, biz: Biz): Draft | null {
  const stage = trialStage({ status: l.status, trialAt: l.trialAt, showedUp: l.showedUp ?? null }, today);
  const since = daysBetween(istParts(l.trialAt).date, today);
  const open = l.status === "new" || l.status === "contacted";
  if (stage === "booked" && open && since === 0) return trialMessage("trial-today", l, biz);
  if (stage === "no-show" && open && since >= 0 && since <= 5) return trialMessage("trial-missed", l, biz);
  if (stage === "came" && l.status === "trial") {
    if (since >= 1 && since <= 3) return trialMessage("trial-join", l, biz);
    if (since >= 4 && since <= 7) return trialMessage("trial-join-last", l, biz);
  }
  return null;
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

/** WhatsApp: the Google review request, at most once per number ever. */
export const reviewRequestMessage = (p: { name: string; phone: string }, biz: Biz, reviewUrl: string): Draft =>
  draft("review-request", wa(p.phone), p.name, [first(p.name), biz.name, reviewUrl], `review-request:${wa(p.phone)}`);

/** Email: the same request, once per address ever; "nurture-" so it carries the unsubscribe link. */
export const reviewRequestEmail = (p: { name: string; email: string }, biz: Biz, reviewUrl: string): Draft => ({
  channel: "email",
  to: p.email.toLowerCase(),
  toName: p.name,
  kind: "nurture-review",
  subject: `A quick favour, ${first(p.name)}?`,
  body: `Hi ${first(p.name)},\n\nThank you for choosing ${biz.name}. If you have a minute, an honest Google review helps other people in Noida find a gym they can trust. Good or bad, tell it as it is: we read every one.\n\n[[CTA:Write a Google review|${reviewUrl}]]\n\nThank you,\n${biz.name}`,
  template: "",
  params: [],
  dedupeKey: `nurture-review:${p.email.toLowerCase()}`,
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
  // One person, one set of reminders: when a number was entered more than once (or by someone
  // spamming a stranger's number into the form), only its newest enquiry is followed up.
  const newest = new Map<string, LeadLike>();
  for (const l of leads) {
    const key = mobile10(l.phone) ?? l.phone;
    const seen = newest.get(key);
    if (l.followUps && (!seen || l.createdAt > seen.createdAt)) newest.set(key, l);
  }
  for (const l of newest.values()) {
    // A booked trial replaces the "please book" reminders with ones about the visit itself.
    if (l.trialAt) {
      const d = trialDue({ ...l, trialAt: l.trialAt }, today, biz);
      if (d) out.push(d);
      continue;
    }
    if (l.status !== "new" && l.status !== "contacted") continue;
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

