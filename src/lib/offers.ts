// Time-boxed price offers, applied over the admin's standard plans. Pure (no I/O): the plan
// cards, the join page and the server-side price quote all call applyOffer with the offers saved
// in site_content (admin → Offers), so the price a visitor sees is the price Razorpay charges.
// Outside the dates the standard plans come back on their own — nobody has to remember to take
// the offer down. FESTIVE_2026 is the built-in default until the admin saves offers of their own.
import type { Plan } from "./content/types";

type PlanOffer = {
  price: number;
  /** Added to the plan's duration, e.g. "1 month" → "1 month + 5 days". */
  bonus: string;
  /** What the visitor gets, in plain words. Calendar months, so no "35 days"-style counts. */
  gets: string;
  perks: string[];
  /** Strike-through standard price; omitted when the offer isn't cheaper (Annual adds months instead). */
  showStandard: boolean;
};

export type Offer = {
  id: string;
  title: string;
  banner: string;
  /** Inclusive dates, India time. */
  startsOn: string;
  endsOn: string;
  /** Single-person prices only; couple prices stay standard. Keyed by plan id. */
  plans: Record<string, PlanOffer>;
  /** Plans that exist only during the offer, shown after `after`. */
  extraPlans: { after: string; plan: Plan; gets: string }[];
};

export const FESTIVE_2026: Offer = {
  id: "festive-2026",
  title: "Festive Offer",
  banner: "Festive Offer — 31 Dec 2026 tak 🎉 Monthly se Annual plans par bonus days + free diet guidance.",
  startsOn: "2026-10-08",
  endsOn: "2026-12-31",
  plans: {
    monthly: { price: 1500, bonus: "5 days", gets: "1 month + 5 bonus days", perks: ["Free diet consultation"], showStandard: true },
    quarterly: { price: 4000, bonus: "10 days", gets: "3 months + 10 bonus days", perks: ["Free diet consultation"], showStandard: true },
    "half-yearly": { price: 7000, bonus: "20 days", gets: "6 months + 20 bonus days", perks: ["Free diet consultation"], showStandard: true },
    yearly: { price: 14000, bonus: "2 months", gets: "14 months (12 + 2 FREE) · sirf ₹1,000/month", perks: ["Free customised diet plan"], showStandard: false },
  },
  extraPlans: [
    {
      after: "half-yearly",
      gets: "6 months + customised calorie-based diet plan",
      plan: {
        id: "female-special",
        name: "Female's Special",
        duration: "6 months",
        price: 7000,
        couplePrice: 0,
        originalPrice: 0,
        perks: ["Customised calorie-based diet plan (worth ₹1,499)", "Full gym floor access", "Morning & evening batches"],
        featured: false,
      },
    },
  ],
};

export const OFFERS: Offer[] = [FESTIVE_2026];

/** The offer running on `today` (YYYY-MM-DD, India time), if any. Pass the saved offers (`content.offers`). */
export function activeOffer(today: string, offers: Offer[]): Offer | null {
  return offers.find((o) => today >= o.startsOn && today <= o.endsOn) ?? null;
}

/** A plan as shown and sold today. `standardDuration` is what couples get (no bonus). */
export type OfferPlan = Plan & { offer?: { title: string; gets: string; endsOn: string; standardPrice: number; standardDuration: string; perks?: string[] } };

export function applyOffer(plans: Plan[], today: string, offers: Offer[]): OfferPlan[] {
  const o = activeOffer(today, offers);
  if (!o) return plans;
  const out: OfferPlan[] = [];
  for (const p of plans) {
    const po = o.plans[p.id];
    // Only discount a plan the admin still sells at a higher or equal standard price.
    out.push(
      po && p.price > 0 && po.price <= p.price
        ? {
            ...p,
            price: po.price,
            duration: `${p.duration} + ${po.bonus}`,
            originalPrice: po.showStandard && po.price < p.price ? p.price : 0,
            perks: [...po.perks, ...p.perks],
            offer: { title: o.title, gets: po.gets, endsOn: o.endsOn, standardPrice: p.price, standardDuration: p.duration, perks: po.perks },
          }
        : p,
    );
    for (const x of o.extraPlans) if (x.after === p.id && !plans.some((q) => q.id === x.plan.id)) out.push({ ...x.plan, offer: { title: o.title, gets: x.gets, endsOn: o.endsOn, standardPrice: x.plan.price, standardDuration: x.plan.duration } });
  }
  return out;
}

// ---------- checks for offers saved from the admin ----------

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const isDay = (s: unknown): s is string => typeof s === "string" && DAY.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
const days = (a: string, b: string) => (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000;
const blank = (s: unknown) => typeof s !== "string" || !s.trim();
const rupees = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n > 0 && n <= 200_000;
/** Deeper cuts than this are almost always a missing zero (₹150 for ₹1,500). */
const MAX_DISCOUNT = 0.7;
const MIN_EXTRA_PLAN_PRICE = 100;

/**
 * Errors block the save; warnings are shown in the admin but saved anyway. Messages are written
 * for the gym owner, naming the offer and plan as the admin shows them.
 */
export function validateOffers(offers: unknown, plans: Plan[]): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!Array.isArray(offers)) return { errors: ["Offers must be a list"], warnings };
  const byId = new Map(plans.map((p) => [p.id, p]));
  const ids = new Set<string>();
  const list = offers as Offer[];
  for (const o of list) {
    const name = blank(o?.title) ? "An offer" : `"${o.title.trim()}"`;
    if (!o || typeof o !== "object") {
      errors.push("An offer is empty");
      continue;
    }
    if (typeof o.id !== "string" || !/^[a-z0-9-]{2,40}$/.test(o.id)) errors.push(`${name} needs an id of lowercase letters, numbers and hyphens`);
    else if (ids.has(o.id)) errors.push(`${name}: the id "${o.id}" is used twice`);
    else ids.add(o.id);
    if (blank(o.title)) errors.push("Every offer needs a title");
    else if (o.title.length > 60) errors.push(`${name}: keep the title under 60 characters`);
    if (typeof o.banner !== "string" || o.banner.length > 200) errors.push(`${name}: keep the banner under 200 characters`);
    const startOk = isDay(o.startsOn);
    const endOk = isDay(o.endsOn);
    if (!startOk) errors.push(`${name}: the start date is not a real date`);
    if (!endOk) errors.push(`${name}: the end date is not a real date`);
    if (startOk && endOk) {
      if (o.endsOn < o.startsOn) errors.push(`${name} ends before it starts`);
      else if (days(o.startsOn, o.endsOn) > 366) errors.push(`${name} runs longer than a year; split it into two offers`);
    }
    if (!o.plans || typeof o.plans !== "object" || Array.isArray(o.plans)) {
      errors.push(`${name}: plan prices are missing`);
      continue;
    }
    for (const [planId, po] of Object.entries(o.plans)) {
      const plan = byId.get(planId);
      if (!plan) {
        errors.push(`${name}: there is no plan "${planId}" on the Membership tab`);
        continue;
      }
      const label = `${name} → ${plan.name}`;
      if (!rupees(po?.price)) {
        errors.push(typeof po?.price === "number" && po.price > 0 && !Number.isInteger(po.price) ? `${label}: the price must be in whole rupees` : `${label}: the price must be between ₹1 and ₹2,00,000`);
        continue;
      }
      if (plan.price > 0 && po.price > plan.price) warnings.push(`${label}: ₹${po.price.toLocaleString("en-IN")} is more than the standard ₹${plan.price.toLocaleString("en-IN")}, so it won't be used`);
      else if (plan.price > 0 && po.price < plan.price * (1 - MAX_DISCOUNT)) errors.push(`${label}: ₹${po.price.toLocaleString("en-IN")} is more than 70% off the standard ₹${plan.price.toLocaleString("en-IN")}. Check for a missing zero`);
      if (blank(po.gets)) errors.push(`${label}: say what the member gets, e.g. "1 month + 5 bonus days"`);
      if (typeof po.bonus !== "string") errors.push(`${label}: the bonus time must be text, e.g. "5 days"`);
      if (!Array.isArray(po.perks) || po.perks.some((x) => typeof x !== "string")) errors.push(`${label}: perks must be a list of lines`);
    }
    for (const x of Array.isArray(o.extraPlans) ? o.extraPlans : []) {
      const p = x?.plan;
      const label = `${name} → ${blank(p?.name) ? "offer-only plan" : p.name.trim()}`;
      if (!p || typeof p.id !== "string" || !/^[a-z0-9-]{2,40}$/.test(p.id)) {
        errors.push(`${label} needs an id of lowercase letters, numbers and hyphens`);
        continue;
      }
      if (byId.has(p.id)) errors.push(`${label}: the id "${p.id}" is already used by a Membership plan`);
      if (!byId.has(x.after)) errors.push(`${label}: choose which plan it shows after`);
      if (!rupees(p.price) || p.price < MIN_EXTRA_PLAN_PRICE) errors.push(`${label}: the price must be ₹${MIN_EXTRA_PLAN_PRICE} or more, in whole rupees`);
      if (blank(p.name) || blank(p.duration)) errors.push(`${label} needs a name and a duration`);
    }
  }
  const dated = list.filter((o) => o && isDay(o.startsOn) && isDay(o.endsOn) && o.startsOn <= o.endsOn).sort((a, b) => a.startsOn.localeCompare(b.startsOn));
  for (let i = 1; i < dated.length; i++) {
    if (dated[i].startsOn <= dated[i - 1].endsOn) errors.push(`"${dated[i - 1].title}" and "${dated[i].title}" overlap; only one offer can run on a day`);
  }
  return { errors, warnings };
}
