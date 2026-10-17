// Automatic first replies to WhatsApp messages, Instagram DMs and Instagram comments.
// Pure: every price, offer, address and timing comes from the same content and offer rules the
// website uses, so a reply can never quote a price the site doesn't charge.
import { DIET_CHART, DIET_PLANS } from "@/lib/growth/config";
import type { OfferPlan } from "@/lib/offers";
import type { Business } from "@/lib/content/types";
import { formatTime } from "@/lib/site";
import { CONDITION_LABEL, GOAL_TITLE, dietProfile, type DietProfile } from "./diet-profile";

export type Intent = "price" | "diet" | "trial" | "visit" | "shop" | "hello" | "other";

// Checked in this order: "diet plan kitne ka" is a diet question, "free trial fees" a price
// question, and "weight loss membership" a membership one.
const RULES: [Exclude<Intent, "hello" | "other">, RegExp][] = [
  ["diet", /\b(diet|chart|meal|nutrition)\b/i],
  ["price", /\b(price|prices|pricing|fee|fees|charges?|rate|rates|cost|kitn[aei]|kitne|paise|membership|plan|plans|package|offer|join|joining)\b/i],
  ["trial", /\b(trial|demo|free\s*session|try)\b/i],
  ["visit", /\b(time|timing|timings|open|close|closed|hours?|address|location|kah[aā]n?|where|map|direction|sunday|batch)\b/i],
  ["shop", /\b(supplements?|protein|whey|creatine|gainer|pre-?workout|eaa|bcaa|shop|store|blackkwolf|multivitamin)\b/i],
  ["diet", /\b(weight|fat|vajan|wajan|motapa|belly|khana|muscle|bulk|pcos|pcod|thyroid|diabetes|sugar)\b/i],
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
  /** What they wrote, so a diet reply can be about their goal. */
  text?: string;
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

const FOOD_LINE: Record<NonNullable<DietProfile["food"]>, string> = { veg: "100% vegetarian", egg: "vegetarian + eggs", "non-veg": "non-veg" };

const GOAL_DIET: Record<DietProfile["goal"], string> = {
  "fat-loss": "a calorie deficit with high protein, so you lose fat, not muscle",
  "muscle-gain": "high-protein meals in a controlled surplus to build lean muscle",
  "weight-gain": "calorie-rich, wholesome meals to gain weight the healthy way",
  toning: "balanced meals that keep you lean while you build shape",
  general: "balanced meals for energy, strength and steady progress",
};

const GOAL_WORKOUT: Record<DietProfile["goal"], string> = {
  "fat-loss": "fat-burning workouts, gym or home, plus a daily step target",
  "muscle-gain": "strength training split for muscle growth, gym or home",
  "weight-gain": "strength training to put the weight on as muscle",
  toning: "strength + conditioning workouts, gym or home",
  general: "workouts matched to your diet, gym or home",
};

const CONDITION_DIET: Record<NonNullable<DietProfile["condition"]>, string> = {
  pcos: "PCOS-friendly, low-GI Indian meals",
  thyroid: "thyroid-friendly meals and timing",
  diabetes: "low-GI meals to keep blood sugar steady",
  bp: "low-salt, heart-friendly meals",
};

/**
 * The first reply to a diet enquiry, written around what they asked for: their goal, food and any
 * health condition they mentioned. The recommended programme and every price come from the plans
 * the checkout charges.
 */
function dietReply(c: ReplyCtx): string {
  const p = dietProfile(c.text ?? "");
  const hi = firstName(c.name);
  const main = DIET_PLANS.find((d) => d.popular) ?? DIET_PLANS[DIET_PLANS.length - 1];
  const others = DIET_PLANS.filter((d) => d.id !== main.id && d.id !== "premium");
  const food = p.food ? FOOD_LINE[p.food] : "veg / egg / non-veg";
  const forWhat = p.condition ? ` for ${CONDITION_LABEL[p.condition]}` : "";
  return [
    `Hi${hi ? ` ${hi}` : ""}! 🙏 Welcome to *${c.business.name}*.`,
    `\nI'm *Coach Aman Sharma*, Certified Nutritionist since 2016.`,
    `\nHere's my *${main.months}-Month ${GOAL_TITLE[p.goal]}${forWhat}*, built on your body measurements, not a copy-paste chart:`,
    ``,
    `📊 *Body analysis*: BMI, body fat %, lean mass, waist risk, your exact calories & protein`,
    `🥗 *Personal diet chart*: ${food}, your regional food, ${p.condition ? CONDITION_DIET[p.condition] : GOAL_DIET[p.goal]}, measured in katori & roti`,
    `🏋️ *Workout plan*: ${GOAL_WORKOUT[p.goal]}`,
    `🔄 *Plan updated every 2 weeks*: ${main.checkIns} check-ins; calories, meals & workouts adjusted to your progress`,
    `🌿 *Herbs & supplement guidance*${p.condition ? ` for ${CONDITION_LABEL[p.condition]}` : " for any health condition (thyroid, PCOS, sugar, BP)"}`,
    `🛒 Weekly grocery list, 12-week roadmap & habit tracker`,
    `💬 *WhatsApp support* for ${main.months} months`,
    `📄 Branded PDF within *${DIET_CHART.turnaround}*`,
    ``,
    `💰 *${main.name}: ${inr(main.priceRupees)}*`,
    `Other options: ${others.map((d) => `${d.name} ${inr(d.priceRupees)}`).join(" · ")}`,
    `\n👉 Start here: ${c.siteUrl}/diet-chart?plan=${main.id}#order`,
    `Or reply *YES* and the coach will send you a short form 📋`,
    p.condition ? `\n_General guidance, not medical treatment. Herbs and supplements support, and never replace, your doctor's advice._` : null,
  ]
    .filter((l) => l !== null)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
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
