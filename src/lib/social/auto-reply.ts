// Automatic first replies to WhatsApp messages, Instagram DMs and Instagram comments.
// Pure: every price, offer, address and timing comes from the same content and offer rules the
// website uses, so a reply can never quote a price the site doesn't charge.
import { DIET_PLANS } from "@/lib/growth/config";
import type { OfferPlan } from "@/lib/offers";
import type { Business } from "@/lib/content/types";
import { formatTime } from "@/lib/site";

export type Intent = "price" | "diet" | "trial" | "visit" | "shop" | "hello" | "other";

// Checked in this order: "diet plan kitne ka" is a diet question, "free trial fees" a price
// question, and "weight loss membership" a membership one.
const RULES: [Exclude<Intent, "hello" | "other">, RegExp][] = [
  ["diet", /\b(diet|chart|meal|nutrition)\b/i],
  ["price", /\b(price|prices|pricing|fee|fees|charges?|rate|rates|cost|kitn[aei]|kitne|paise|membership|plan|plans|package|offer|join|joining)\b/i],
  ["trial", /\b(trial|demo|free\s*session|try)\b/i],
  ["visit", /\b(time|timing|timings|open|close|closed|hours?|address|location|kah[aā]n?|where|map|direction|sunday|batch)\b/i],
  ["shop", /\b(supplements?|protein|whey|creatine|gainer|pre-?workout|eaa|bcaa|shop|store|blackkwolf|multivitamin)\b/i],
  ["diet", /\b(weight|fat|vajan|wajan|motapa|belly|khana)\b/i],
];
const GREETING = /^\s*(hi+|hello+|hey+|hii+|namaste|namaskar|ram ram|good (morning|evening|afternoon)|info|details?|start|menu|help)\b[\s!.?]*$/i;

export function detectIntent(text: string): Intent {
  const t = text.trim();
  if (!t) return "other";
  for (const [intent, re] of RULES) if (re.test(t)) return intent;
  return GREETING.test(t) ? "hello" : "other";
}

/** Keyword intents are worth a reply on their own; a greeting or anything else only opens a conversation. */
export const isKeyword = (i: Intent) => i !== "hello" && i !== "other";

export type ReplyCtx = {
  business: Pick<Business, "name" | "phone" | "address" | "hours" | "googleMapsUrl">;
  /** Plans as sold today (offer applied). */
  plans: OfferPlan[];
  siteUrl: string;
  /** First name of the person, if known. */
  name?: string;
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const firstName = (n?: string) => (n ?? "").trim().split(/\s+/)[0]?.replace(/[^\p{L}]/gu, "") ?? "";

function priceReply(c: ReplyCtx): string {
  const plans = c.plans.filter((p) => p.price > 0);
  const lines = plans.map((p) => {
    const what = p.offer?.gets ?? p.duration;
    const was = p.offer && p.offer.standardPrice > p.price ? ` (regular ${inr(p.offer.standardPrice)})` : "";
    return `• ${p.name}: ${inr(p.price)} for ${what}${was}`;
  });
  const offer = plans.find((p) => p.offer)?.offer;
  const couple = plans.find((p) => p.couplePrice > 0 && /^\s*1\s*month/i.test(p.offer?.standardDuration ?? p.duration));
  return [
    `*${c.business.name}: membership fees*`,
    ...lines,
    offer ? `\n${offer.title} prices are valid until ${new Date(`${offer.endsOn}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}.` : "",
    couple ? `Couples joining together: ${inr(couple.couplePrice)} a month for two.` : "",
    `\nJoin online: ${c.siteUrl}/membership`,
    `Want to try first? Reply *TRIAL* for a free session.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function dietReply(c: ReplyCtx): string {
  return [
    `*Personal diet plans from our coach*`,
    ...DIET_PLANS.map((p) => `• ${p.name}: ${inr(p.priceRupees)}`),
    `\nEach plan is made for your body numbers, food preference (veg or non-veg) and any health condition you tell us about. Delivered as a PDF on WhatsApp.`,
    `Order here: ${c.siteUrl}/diet-chart#order`,
  ].join("\n");
}

function hoursLines(b: ReplyCtx["business"]): string[] {
  return b.hours.map((h) => `• ${h.label}: ${formatTime(h.open)} – ${formatTime(h.close)} (${h.days})`);
}

function visitReply(c: ReplyCtx): string {
  const a = c.business.address;
  return [
    `*${c.business.name}*`,
    `📍 ${a.street}, ${a.locality}, ${a.city} ${a.postalCode}`,
    c.business.googleMapsUrl ? `Map: ${c.business.googleMapsUrl}` : "",
    `\n*Timings*`,
    ...hoursLines(c.business),
    `\nCall: ${c.business.phone}`,
    `Reply *TRIAL* to book a free session.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function trialReply(c: ReplyCtx): string {
  return [
    `Your first session at ${c.business.name} is free. 💪`,
    `A trainer checks your goal, fitness level and any injury, then shows you a plan you can start on day one.`,
    `\nReply with a *day and time* that suits you. Our batches:`,
    ...hoursLines(c.business),
    `\nOr book online: ${c.siteUrl}/contact`,
  ].join("\n");
}

function shopReply(c: ReplyCtx): string {
  return [
    `*Royal Supplements Store*`,
    `Protein, pre-workout, amino acids, multivitamins and more. See prices and order here: ${c.siteUrl}/shop`,
    `\nNot sure what you need? Tell us your goal and a coach will suggest what is worth buying, and what isn't.`,
  ].join("\n");
}

function menuReply(c: ReplyCtx): string {
  const hi = firstName(c.name);
  return [
    `Hi${hi ? ` ${hi}` : ""}! Thanks for messaging ${c.business.name}. 👋`,
    `Reply with one word:`,
    `*PRICE*: membership fees and offers`,
    `*DIET*: personal diet plans`,
    `*TRIAL*: book a free trial session`,
    `*TIMING*: address and gym timings`,
    `*SHOP*: supplements`,
    `\nA coach will also reply to you personally during gym hours.`,
  ].join("\n");
}

/** The reply text for an intent, in WhatsApp formatting (*bold*). */
export function buildReply(intent: Intent, c: ReplyCtx): string {
  switch (intent) {
    case "price":
      return priceReply(c);
    case "diet":
      return dietReply(c);
    case "trial":
      return trialReply(c);
    case "visit":
      return visitReply(c);
    case "shop":
      return shopReply(c);
    default:
      return menuReply(c);
  }
}

/** Instagram shows asterisks literally. */
export const forInstagram = (text: string) => text.replace(/\*([^*\n]+)\*/g, "$1");

/**
 * Whether to answer automatically. Keywords always get an answer (it is the information they
 * asked for). Anything else gets the menu only when it opens a conversation, so the bot never
 * talks over a coach who is already chatting with the person. Comments are answered only for
 * keywords ("Comment PRICE"), never for ordinary comments.
 */
export function shouldReply(intent: Intent, kind: "message" | "comment", hadRecentMessage: boolean): boolean {
  if (kind === "comment") return isKeyword(intent);
  return isKeyword(intent) || !hadRecentMessage;
}
