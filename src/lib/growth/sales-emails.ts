// Sales emails, built here and sent through the outbox. Both are "nurture-*" kinds, so every one
// carries an unsubscribe link and the one-click List-Unsubscribe headers, and nobody who has
// unsubscribed is queued (the daily run filters them out).
//   - Checkout reminder: someone started paying for a plan, a book or a supplement order and didn't finish. One gentle
//     email, 2–72 hours later; one per order and at most one per person every 14 days.
//   - Coach's Pick: Wednesdays, to people who asked for emails: a diet plan, a programme or book,
//     and a bundle, rotating through the whole catalogue.
import { DIET_PLANS } from "./config";
import type { Draft } from "./messages";
import { SALE_ITEMS, priceLine, type SaleItem } from "./sales-catalog";
import { bundleById } from "@/lib/library/bundles";
import { BOOKS } from "@/lib/library/catalog";

const DAY_MS = 86_400_000;
const dayNumber = (iso: string) => Math.floor(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / DAY_MS);
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";
const utm = (campaign: string) => `utm_source=email&utm_medium=email&utm_campaign=${campaign}`;
const withUtm = (siteUrl: string, path: string, campaign: string) => {
  const [base, hash] = path.split("#");
  return `${siteUrl}${base}${base.includes("?") ? "&" : "?"}${utm(campaign)}${hash ? `#${hash}` : ""}`;
};

/** For "shop", itemId is the store path of a single-item order ("p/<slug>" or "combos/<slug>"), else "". */
export type AbandonedOrder = { kind: "diet" | "book" | "shop"; id: string; name: string; email: string; plan: string; itemId: string; title: string; amountPaise: number };

/** Where to send someone back to finish an order. */
export function resumePath(o: AbandonedOrder): string {
  if (o.kind === "diet") return `/diet-chart?plan=${encodeURIComponent(o.plan)}#order`;
  if (o.kind === "shop") return /^(p|combos)\/[a-z0-9-]{2,80}$/.test(o.itemId) ? `/shop/${o.itemId}` : "/shop";
  const ids = o.itemId.split(",");
  if (ids.length === 1 && BOOKS.some((b) => b.slug === ids[0])) return `/library/${ids[0]}`;
  if (ids.length === 1 && bundleById(ids[0])) return "/library#combos";
  return "/library";
}

export function checkoutReminder(o: AbandonedOrder, siteUrl: string, coach: string, phone: string): Draft {
  const plan = DIET_PLANS.find((p) => p.id === o.plan);
  const what = o.kind === "diet" ? (plan?.name ?? "your diet plan") : o.title.replace(/^Vol\. \d+ · /, "");
  const link = withUtm(siteUrl, resumePath(o), "checkout-reminder");
  const why =
    o.kind === "diet"
      ? ["Calories and protein worked out from your own body", "Indian meals you already eat, in katori and roti measures", "Workouts that match your goal"]
      : o.kind === "shop"
        ? ["Paid securely through Razorpay", "Not sure it suits you? Ask us before you order"]
        : ["Instant PDF download right after payment", "Read on your phone, tablet or laptop", "Your download link is emailed to you too"];
  return {
    channel: "email",
    to: o.email.toLowerCase(),
    toName: o.name.slice(0, 80),
    kind: "nurture-checkout",
    subject: `${firstName(o.name)}, your ${what} is one step away`,
    body: [
      `Hi ${firstName(o.name)},`,
      `You started getting ${what}${o.amountPaise ? ` (${inr(o.amountPaise / 100)})` : ""} but the payment didn't go through. It happens: a bank OTP, a network drop, a busy moment.`,
      why.map((w) => `• ${w}`).join("\n"),
      "If anything stopped you (a payment issue or a question about whether it suits you), just reply to this email or WhatsApp us and we'll help.",
      `[[CTA:Finish getting ${what}|${link}]]`,
      `${coach}\nRoyal Fitness Club · ${phone}`,
      "Already paid? Please ignore this email; your order is safe.",
    ].join("\n\n"),
    template: "",
    params: [],
    // One reminder per order; the daily run also skips anyone reminded in the last 14 days.
    dedupeKey: `checkout:${o.kind}:${o.id}`,
  };
}

/** True on Wednesdays (India date). */
export const isWednesday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay() === 3;
/** True on Mondays (India date): the coach gets the week's Reel scripts. */
export const isMonday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay() === 1;

/** This week's three picks: one diet plan, one programme or book, one bundle. */
export function weeklyPicks(date: string): [SaleItem, SaleItem, SaleItem] {
  const week = Math.floor(dayNumber(date) / 7);
  const of = (pred: (i: SaleItem) => boolean) => {
    const list = SALE_ITEMS.filter(pred);
    return list[((week % list.length) + list.length) % list.length];
  };
  return [of((i) => i.kind === "diet" && i.id !== "diet-trial"), of((i) => i.kind === "workout" || i.kind === "book"), of((i) => i.kind === "combo")];
}

export function coachsPick(date: string, to: string, siteUrl: string, coach: string): Draft {
  const picks = weeklyPicks(date);
  const campaign = `pick-${date}`;
  const section = (i: SaleItem, label: string) =>
    [`${label}: ${i.title}`, i.subtitle, i.bullets.map((b) => `• ${b}`).join("\n"), `${priceLine(i)} → ${withUtm(siteUrl, i.path, campaign)}`].join("\n");
  return {
    channel: "email",
    to: to.toLowerCase(),
    toName: "",
    kind: "nurture-pick",
    subject: `Coach's pick this week: ${picks[1].title}`,
    body: [
      "Hi,",
      `Every Wednesday I pick three things from our store that I would actually recommend this week. Here they are.`,
      section(picks[0], "PLAN"),
      section(picks[1], picks[1].kind === "workout" ? "PROGRAMME" : "READ"),
      section(picks[2], "BUNDLE"),
      `Not sure which one fits you? Start with the 7-day trial plan for ${inr(DIET_PLANS.find((p) => p.trial)!.priceRupees)}: ${withUtm(siteUrl, "/diet-chart?plan=trial#order", campaign)}`,
      `[[CTA:See everything in the library|${withUtm(siteUrl, "/library", campaign)}]]`,
      `${coach}\nRoyal Fitness Club`,
      "Health books and plans support, and never replace, your doctor's advice and medicines.",
    ].join("\n\n"),
    template: "",
    params: [],
    dedupeKey: `pick:${date}:${to.toLowerCase()}`,
  };
}
