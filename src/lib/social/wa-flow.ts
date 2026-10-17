// The WhatsApp sales conversation, built around one easy yes: the ₹49 7-Day Trial Plan.
// Inside the 24-hour window WhatsApp allows free interactive messages (reply buttons, a list, a
// link button), so the customer taps instead of typing keywords. Pure: what to send for each step,
// with every price taken from the plans the checkout charges.
//
//   "diet plan" → short trial offer + [Start 7-day ₹49] [See all plans] [Talk to coach]
//   Start / "yes" → 3 steps + [Start for ₹49] link button to the checkout
//   See all plans → every plan + [Start 7-day ₹49] [Talk to coach]
//   Talk to coach → the coach takes over (and gets the usual email alert)
//   "hi" → a menu list: diet trial, fees, free gym trial, timings, supplements
import { DIET_CHART, DIET_PLANS } from "@/lib/growth/config";
import { buildReply, detectIntent, type Intent, type ReplyCtx } from "./auto-reply";
import { CONDITION_LABEL, GOAL_TITLE, dietProfile, type DietProfile } from "./diet-profile";

export type WaButton = { id: string; title: string };
export type WaRow = { id: string; title: string; description: string };
export type WaOut =
  | { kind: "text"; body: string }
  | { kind: "buttons"; body: string; footer?: string; buttons: WaButton[] }
  | { kind: "cta"; body: string; footer?: string; label: string; url: string }
  | { kind: "list"; body: string; footer?: string; button: string; rows: WaRow[] };

export type FlowAction = "diet" | "trial7" | "plans" | "coach" | "menu" | Exclude<Intent, "diet" | "hello" | "other">;

const TRIAL = DIET_PLANS.find((p) => p.trial) ?? DIET_PLANS[0];
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const first = (n?: string) => (n ?? "").trim().split(/\s+/)[0]?.replace(/[^\p{L}]/gu, "") ?? "";
const FOOTER = "Royal Fitness Club · Sector 93, Noida";

export const BUTTON = {
  trial7: { id: "rfc_trial7", title: `✅ Start 7-day ${inr(TRIAL.priceRupees)}` },
  plans: { id: "rfc_plans", title: "📋 See all plans" },
  coach: { id: "rfc_coach", title: "💬 Talk to coach" },
} satisfies Record<string, WaButton>;

const MENU: (WaRow & { action: FlowAction })[] = [
  { id: "rfc_m_diet", action: "diet", title: `7-day diet plan ${inr(TRIAL.priceRupees)}`, description: "Personal diet + workout plan, PDF on WhatsApp" },
  { id: "rfc_m_price", action: "price", title: "Membership fees", description: "Gym plans and current offers" },
  { id: "rfc_m_trial", action: "trial", title: "Free gym trial", description: "One free session with a trainer" },
  { id: "rfc_m_visit", action: "visit", title: "Timings & address", description: "Batches and directions" },
  { id: "rfc_m_shop", action: "shop", title: "Supplements", description: "Protein, creatine and more" },
];

const BY_ID: Record<string, FlowAction> = {
  [BUTTON.trial7.id]: "trial7",
  [BUTTON.plans.id]: "plans",
  [BUTTON.coach.id]: "coach",
  ...Object.fromEntries(MENU.map((r) => [r.id, r.action])),
};

/** "yes", "haan", "ok", "49"... right after the trial offer means "start my trial". */
const YES = /^\s*(yes+|y|yeah|yep|ha+n?|haa+n|ji|ok+|okay|sure|start|interested|done|49|₹?\s*49)\b[\s!.]*$/i;

/**
 * What the customer asked for: a tapped button or list row first, then "yes" to a trial offer we
 * just made, then the usual keywords. Null when it is none of these (left to the coach).
 */
export function flowAction(m: { replyId?: string; text: string }, offeredTrial: boolean): { action: FlowAction; tapped: boolean } | null {
  const byId = m.replyId ? BY_ID[m.replyId] : undefined;
  if (byId) return { action: byId, tapped: true };
  if (offeredTrial && YES.test(m.text)) return { action: "trial7", tapped: true };
  const intent = detectIntent(m.text);
  if (intent === "diet") return { action: "diet", tapped: false };
  if (intent === "hello" || intent === "other") return { action: "menu", tapped: false };
  return { action: intent, tapped: false };
}

/** Our auto-replies that make "yes" mean "start the trial". */
export const TRIAL_OFFER_MARK = "7-Day Trial Plan";

const FOOD: Record<NonNullable<DietProfile["food"]>, string> = { veg: "100% vegetarian", egg: "veg + eggs", "non-veg": "non-veg" };
const GOAL_SHORT = (g: DietProfile["goal"]) => GOAL_TITLE[g].replace(/ Program$/, "").toLowerCase();

export const trialUrl = (siteUrl: string) => `${siteUrl}/diet-chart?plan=${TRIAL.id}&utm_source=whatsapp&utm_medium=chat&utm_campaign=trial7#order`;

function dietOffer(c: ReplyCtx): WaOut {
  const p = dietProfile(c.text ?? "");
  const hi = first(c.name);
  const goal = p.goal === "general" ? "" : ` for *${GOAL_SHORT(p.goal)}*`;
  return {
    kind: "buttons",
    body: [
      `Hi${hi ? ` ${hi}` : ""}! 🙏 I'm *Coach Aman Sharma*, Certified Nutritionist with 15+ years of coaching experience.`,
      ``,
      `Try my plan${goal} for one week first 👇`,
      ``,
      `*${TRIAL.name}: just ${inr(TRIAL.priceRupees)}*`,
      `✅ Personal diet chart: ${p.food ? FOOD[p.food] : "veg, egg or non-veg"}, your home food, in katori & roti`,
      `✅ 7-day workout plan, gym or home`,
      `✅ Day-7 review with me on WhatsApp`,
      `📄 Your PDF here within ${DIET_CHART.turnaround}`,
      ``,
      `One trial per person.${p.condition ? ` We take ${CONDITION_LABEL[p.condition]} into account; this is guidance, not medical treatment.` : ""}`,
    ].join("\n"),
    footer: FOOTER,
    buttons: [BUTTON.trial7, BUTTON.plans, BUTTON.coach],
  };
}

function trialSteps(c: ReplyCtx): WaOut {
  return {
    kind: "cta",
    body: [
      `Great choice! 🎉 Here's how your *${TRIAL.name}* works:`,
      ``,
      `1️⃣ Tap the button below and answer a few quick questions: age, height, weight, food habits (2 minutes)`,
      `2️⃣ Pay ${inr(TRIAL.priceRupees)} by UPI or card`,
      `3️⃣ Your personal plan arrives right here on WhatsApp within ${DIET_CHART.turnaround}`,
      ``,
      `Any question? Just reply here.`,
    ].join("\n"),
    footer: FOOTER,
    label: `Start for ${inr(TRIAL.priceRupees)}`,
    url: trialUrl(c.siteUrl),
  };
}

function allPlans(c: ReplyCtx): WaOut {
  return {
    kind: "buttons",
    body: [
      `*Diet & workout plans* by Coach Aman Sharma`,
      ``,
      ...DIET_PLANS.map((p) => `• *${p.name}: ${inr(p.priceRupees)}*\n  ${p.summary}`),
      ``,
      `Details: ${c.siteUrl}/diet-chart`,
      `New here? Start with the ${inr(TRIAL.priceRupees)} trial and upgrade later.`,
    ].join("\n"),
    footer: FOOTER,
    buttons: [BUTTON.trial7, BUTTON.coach],
  };
}

function coachHandOff(c: ReplyCtx): WaOut {
  return {
    kind: "text",
    body: [
      `Done! 🙌 Coach Aman will reply here personally, usually within a few hours during gym timings.`,
      ``,
      `To help faster, send your *goal, age, height and weight* in one message.`,
      `Want to start right away? The ${inr(TRIAL.priceRupees)} trial is here: ${trialUrl(c.siteUrl)}`,
    ].join("\n"),
  };
}

function menu(c: ReplyCtx): WaOut {
  const hi = first(c.name);
  return {
    kind: "list",
    body: `Hi${hi ? ` ${hi}` : ""}! 👋 Welcome to *${c.business.name}*.\n\nWhat would you like to know? Tap below and choose. A coach also replies personally during gym timings.`,
    footer: FOOTER,
    button: "Choose an option",
    rows: MENU.map(({ id, title, description }) => ({ id, title, description })),
  };
}

/** The messages for one step, in order. Price, timings and the shop keep their full text replies. */
export function flowReply(action: FlowAction, c: ReplyCtx): WaOut[] {
  switch (action) {
    case "diet":
      return [dietOffer(c)];
    case "trial7":
      return [trialSteps(c)];
    case "plans":
      return [allPlans(c)];
    case "coach":
      return [coachHandOff(c)];
    case "menu":
      return [menu(c)];
    default:
      // Fees, free gym trial, timings, supplements: the full answer, then one tap to the diet trial.
      return [{ kind: "buttons", body: buildReply(action, c).slice(0, 1024), footer: FOOTER, buttons: [BUTTON.trial7, BUTTON.coach] }];
  }
}

/** The Cloud API "interactive" object (null for plain text). */
export function toInteractive(o: WaOut): Record<string, unknown> | null {
  const footer = o.kind !== "text" && o.footer ? { footer: { text: o.footer.slice(0, 60) } } : {};
  const body = { text: o.body.slice(0, 1024) };
  switch (o.kind) {
    case "buttons":
      return { type: "button", body, ...footer, action: { buttons: o.buttons.slice(0, 3).map((b) => ({ type: "reply", reply: { id: b.id, title: b.title.slice(0, 20) } })) } };
    case "cta":
      return { type: "cta_url", body, ...footer, action: { name: "cta_url", parameters: { display_text: o.label.slice(0, 20), url: o.url } } };
    case "list":
      return {
        type: "list",
        body,
        ...footer,
        action: { button: o.button.slice(0, 20), sections: [{ title: "Royal Fitness Club", rows: o.rows.slice(0, 10).map((r) => ({ id: r.id, title: r.title.slice(0, 24), description: r.description.slice(0, 72) })) }] },
      };
    default:
      return null;
  }
}

/** How a sent step reads in the admin chat. */
export function logText(o: WaOut): string {
  switch (o.kind) {
    case "buttons":
      return `${o.body}\n\n${o.buttons.map((b) => `[${b.title}]`).join(" ")}`;
    case "cta":
      return `${o.body}\n\n[${o.label}] ${o.url}`;
    case "list":
      return `${o.body}\n\n${o.rows.map((r) => `• ${r.title}`).join("\n")}`;
    default:
      return o.body;
  }
}
