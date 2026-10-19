// The WhatsApp sales conversation, built around one easy yes: the ₹49 7-Day Trial Plan.
// Inside the 24-hour window WhatsApp allows free interactive messages (reply buttons, a list, a
// link button), so the customer taps instead of typing keywords. Pure: what to send for each step,
// with every price taken from the plans the checkout charges.
//
//   "diet plan" → short trial offer + [Start 7-day ₹49] [See all plans] [Talk to coach]
//   Start / "yes" → 3 steps + [Start for ₹49] link button to the checkout
//   See all plans → every plan + [Start 7-day ₹49] [Talk to coach]
//   Talk to coach → the coach takes over (and gets the usual email alert)
//   "hi" → a menu list: diet trial, fees, free gym trial, timings
import { DIET_CHART, DIET_PLANS, type DietPlanId } from "@/lib/growth/config";
import { formatTime, liveChatUrl } from "@/lib/site";
import { detectIntent, type Intent, type ReplyCtx } from "./auto-reply";
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
  gymTrial: { id: "rfc_gymtrial", title: "🏋️ Book free trial" },
  location: { id: "rfc_location", title: "📍 Location" },
  fees: { id: "rfc_fees", title: "💪 Gym fees" },
} satisfies Record<string, WaButton>;

const MENU: (WaRow & { action: FlowAction })[] = [
  { id: "rfc_m_diet", action: "diet", title: `7-day diet plan ${inr(TRIAL.priceRupees)}`, description: "Personal diet + workout plan, PDF on WhatsApp" },
  { id: "rfc_m_price", action: "price", title: "Membership fees", description: "Gym plans and current offers" },
  { id: "rfc_m_trial", action: "trial", title: "Free gym trial", description: "One free session with a trainer" },
  { id: "rfc_m_visit", action: "visit", title: "Timings & address", description: "Batches and directions" },
];

const BY_ID: Record<string, FlowAction> = {
  [BUTTON.trial7.id]: "trial7",
  [BUTTON.plans.id]: "plans",
  [BUTTON.coach.id]: "coach",
  [BUTTON.gymTrial.id]: "trial",
  [BUTTON.location.id]: "visit",
  [BUTTON.fees.id]: "price",
  ...Object.fromEntries(MENU.map((r) => [r.id, r.action])),
};

/** "yes", "haan", "ok", "49"... right after the trial offer means "start my trial". */
const YES = /^\s*(yes+|y|yeah|yep|ha+n?|haa+n|ji|ok+|okay|sure|start|interested|done|49|₹?\s*49)\b[\s!.]*$/i;

/** "No thanks", "nahi chahiye"... to a campaign offer: left for the coach, never answered with prices. */
const NO = /\b(no+|nope|not interested|nahi+|nahin|nhi|na|mat|don'?t|do not|wrong number|who is this|kaun)\b/i;

/**
 * What the customer asked for: a tapped button or list row first, then "yes" to a trial offer we
 * just made, then the usual keywords. After a campaign offer (afterOffer), "yes", "interested" or
 * anything without a keyword means the offer, so they get the fees rather than the general menu;
 * a "no" is null (logged and left to the coach).
 */
export function flowAction(m: { replyId?: string; text: string }, offeredTrial: boolean, afterOffer = false): { action: FlowAction; tapped: boolean } | null {
  const byId = m.replyId ? BY_ID[m.replyId] : undefined;
  if (byId) return { action: byId, tapped: true };
  if (offeredTrial && YES.test(m.text)) return { action: "trial7", tapped: true };
  if (afterOffer && YES.test(m.text)) return { action: "price", tapped: true };
  const intent = detectIntent(m.text);
  if (intent === "diet") return { action: "diet", tapped: false };
  if (afterOffer && intent === "other" && NO.test(m.text)) return null;
  if (intent === "hello" || intent === "other") return { action: afterOffer ? "price" : "menu", tapped: false };
  return { action: intent, tapped: false };
}

/** Our auto-replies that make "yes" mean "start the trial". */
export const TRIAL_OFFER_MARK = "7-Day Trial Plan";

const FOOD: Record<NonNullable<DietProfile["food"]>, string> = { veg: "pure veg", egg: "veg + eggs", "non-veg": "non-veg" };
const GOAL: Record<DietProfile["goal"], string> = { "fat-loss": "Fat loss", "muscle-gain": "Muscle gain", "weight-gain": "Healthy weight gain", toning: "Toning", general: "" };

export const trialUrl = (siteUrl: string) => `${siteUrl}/diet-chart?plan=${TRIAL.id}&utm_source=whatsapp&utm_medium=chat&utm_campaign=trial7#order`;

/** The line every reply carries: the number a person answers (calls and the WhatsApp Business app). */
const liveLine = (b: ReplyCtx["business"]) => `📞 Call / WhatsApp a coach: ${b.phone}`;

const hours = (b: ReplyCtx["business"]) => b.hours.map((h) => `${h.label}: ${formatTime(h.open)} – ${formatTime(h.close)}`);
const days = (b: ReplyCtx["business"]) => [...new Set(b.hours.map((h) => h.days))].join(", ");

// The diet offer: who the coach is, the ₹49 trial in four lines, delivery time. Nothing else.
function dietOffer(c: ReplyCtx): WaOut {
  const p = dietProfile(c.text ?? "");
  const hi = first(c.name);
  return {
    kind: "buttons",
    body: [
      `Hi${hi ? ` ${hi}` : ""}! 👋 I'm *Coach Aman Sharma*`,
      `Certified Nutritionist · 15+ years experience`,
      ``,
      `Start with my *${TRIAL.name}* for just *${inr(TRIAL.priceRupees)}* 👇`,
      GOAL[p.goal] ? `🎯 Made for your goal: *${GOAL[p.goal]}*` : null,
      ``,
      `🥗 Diet chart made for you (${p.food ? FOOD[p.food] : "veg / egg / non-veg"}, home food)`,
      `🏋️ 7-day workout plan (gym or home)`,
      `📊 Your daily calories & protein target`,
      `💬 Day-7 review with me on WhatsApp`,
      ``,
      `📄 Delivered here within *${DIET_CHART.turnaround}*`,
      p.condition ? `\n_We plan around ${CONDITION_LABEL[p.condition]}. Guidance only, not medical treatment._` : null,
    ]
      .filter((l) => l !== null)
      .join("\n"),
    footer: FOOTER,
    buttons: [BUTTON.trial7, BUTTON.plans, BUTTON.coach],
  };
}

function trialSteps(c: ReplyCtx): WaOut {
  return {
    kind: "cta",
    body: [
      `Great choice! 🎉 Just 3 easy steps:`,
      ``,
      `1️⃣ Tap *Start for ${inr(TRIAL.priceRupees)}* below`,
      `2️⃣ Fill a 2-minute form (age, height, weight, food)`,
      `3️⃣ Pay ${inr(TRIAL.priceRupees)} by UPI or card`,
      ``,
      `✅ Your plan arrives here within *${DIET_CHART.turnaround}*`,
    ].join("\n"),
    footer: "Questions? Just reply here.",
    label: `Start for ${inr(TRIAL.priceRupees)}`,
    url: trialUrl(c.siteUrl),
  };
}

/** One short line per plan; the checkout's own summary is the fallback. */
const PLAN_LINE: Partial<Record<DietPlanId, { icon: string; line: string; tag?: string }>> = {
  trial: { icon: "🟢", line: "Try it: diet + workout for 1 week" },
  starter: { icon: "⚪", line: "One-time 7-day diet chart + workout plan" },
  "1m": { icon: "🔵", line: "Plan + 1 update + WhatsApp support" },
  "3m": { icon: "⭐", line: "Updated every 2 weeks + supplement guidance", tag: "Most popular" },
  "6m": { icon: "🟣", line: "12 check-ins + keep the weight off" },
  premium: { icon: "👑", line: "Weekly check-ins + monthly video call" },
};

function allPlans(c: ReplyCtx): WaOut {
  return {
    kind: "buttons",
    body: [
      `*Diet & Workout Plans* 🥗🏋️`,
      `by Coach Aman Sharma`,
      ...DIET_PLANS.map((p) => {
        const l = PLAN_LINE[p.id];
        return `\n${l?.icon ?? "•"} *${p.name}* – ${inr(p.priceRupees)}${l?.tag ? ` _(${l.tag})_` : ""}\n${l?.line ?? p.summary}`;
      }),
      ``,
      `👉 New here? Start with the *${inr(TRIAL.priceRupees)}* trial.`,
      `Full details: ${c.siteUrl}/diet-chart`,
    ].join("\n"),
    footer: FOOTER,
    buttons: [BUTTON.trial7, BUTTON.coach],
  };
}

function askDetails(): string {
  return [
    `To make your plan, please send 👇`,
    ``,
    `1. Goal (fat loss / muscle gain / weight gain / toning)`,
    `2. Age`,
    `3. Height & weight`,
    `4. Veg / egg / non-veg`,
    `5. Any health issue or medicine`,
    ``,
    `_Example: Fat loss, 28, 5'6", 82 kg, veg, thyroid_`,
  ].join("\n");
}

function coachHandOff(c: ReplyCtx): WaOut {
  const b = c.business;
  return {
    kind: "buttons",
    body: [`Thank you! 🙏 *Coach Aman* will reply here personally soon.`, `🕐 ${hours(b).join(" · ")} (${days(b)})`, `📞 Prefer to talk? Call or WhatsApp the coach: ${b.phone}`, ``, askDetails()].join("\n"),
    footer: FOOTER,
    buttons: [BUTTON.trial7],
  };
}

function fees(c: ReplyCtx): WaOut {
  const plans = c.plans.filter((p) => p.price > 0);
  const offer = plans.find((p) => p.offer)?.offer;
  const couple = plans.find((p) => p.couplePrice > 0 && /^\s*1\s*month/i.test(p.offer?.standardDuration ?? p.duration));
  const ends = offer ? new Date(`${offer.endsOn}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";
  return {
    kind: "buttons",
    body: [
      `*Gym Membership* 💪`,
      ``,
      ...plans.map((p) => `• *${p.name}* – ${inr(p.price)} · ${p.offer?.gets ?? p.duration}`),
      ``,
      offer ? `🎉 ${offer.title}: these prices till *${ends}*` : null,
      couple ? `👫 Couples: ${inr(couple.couplePrice)}/month for two` : null,
      `✅ First session *FREE*: try before you join`,
      ``,
      `Join online: ${c.siteUrl}/membership`,
      ``,
      liveLine(c.business),
      `💬 Get the offer from a coach: ${liveChatUrl(c.business.phone, offer ? `Hi, I want the ${offer.title}` : "Hi, I'd like to join the gym")}`,
    ]
      .filter((l) => l !== null)
      .join("\n"),
    footer: FOOTER,
    buttons: [BUTTON.gymTrial, BUTTON.location, BUTTON.coach],
  };
}

function gymTrial(c: ReplyCtx): WaOut {
  const b = c.business;
  return {
    kind: "buttons",
    body: [
      `Your *first session is FREE* 💪`,
      ``,
      `A trainer will:`,
      `✅ Check your goal & fitness level`,
      `✅ Show you the right workout`,
      `✅ Answer your diet questions`,
      ``,
      `🕐 ${hours(b).join(" · ")}`,
      `📅 ${days(b)}`,
      ``,
      `👉 Reply with a *day & time* and we'll book you in.`,
      liveLine(b),
    ].join("\n"),
    footer: FOOTER,
    buttons: [BUTTON.location, BUTTON.fees, BUTTON.coach],
  };
}

function visit(c: ReplyCtx): WaOut {
  const b = c.business;
  const a = b.address;
  const body = [`📍 *${b.name}*`, `${a.street}, ${a.locality}, ${a.city} ${a.postalCode}`, ``, `🕐 *Timings* (${days(b)})`, ...hours(b), ``, liveLine(b)].join("\n");
  return b.googleMapsUrl ? { kind: "cta", body, footer: FOOTER, label: "Open in Maps", url: b.googleMapsUrl } : { kind: "buttons", body, footer: FOOTER, buttons: [BUTTON.gymTrial, BUTTON.coach] };
}

function menu(c: ReplyCtx): WaOut {
  const hi = first(c.name);
  return {
    kind: "list",
    body: `Hi${hi ? ` ${hi}` : ""}! 👋 Welcome to *${c.business.name}*, Noida.\n\nHow can we help you today? Tap *Choose an option* below 👇\n\n${liveLine(c.business)}`,
    footer: "A coach also replies personally in gym hours",
    button: "Choose an option",
    rows: MENU.map(({ id, title, description }) => ({ id, title, description })),
  };
}

/** The messages for one step, in order. Price and timings keep their full text replies. */
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
    case "price":
      return [fees(c)];
    case "trial":
      return [gymTrial(c)];
    case "visit":
      return [visit(c)];
    default:
      return [menu(c)];
  }
}

/** The "send your goal, age, height, weight" message (a coach quick reply). */
export const askDetailsMessage = (): WaOut => ({ kind: "text", body: askDetails() });

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
