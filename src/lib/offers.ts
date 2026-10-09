// Time-boxed price offers, applied over the admin's standard plans. Pure (no I/O): the plan
// cards, the join page and the server-side price quote all call applyOffer, so the price a
// visitor sees is the price Razorpay charges. Outside the dates the standard plans come back
// on their own — nobody has to remember to take the offer down.
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

/** The offer running on `today` (YYYY-MM-DD, India time), if any. */
export function activeOffer(today: string, offers: Offer[] = OFFERS): Offer | null {
  return offers.find((o) => today >= o.startsOn && today <= o.endsOn) ?? null;
}

/** A plan as shown and sold today. `standardDuration` is what couples get (no bonus). */
export type OfferPlan = Plan & { offer?: { title: string; gets: string; endsOn: string; standardPrice: number; standardDuration: string } };

export function applyOffer(plans: Plan[], today: string, offers: Offer[] = OFFERS): OfferPlan[] {
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
            offer: { title: o.title, gets: po.gets, endsOn: o.endsOn, standardPrice: p.price, standardDuration: p.duration },
          }
        : p,
    );
    for (const x of o.extraPlans) if (x.after === p.id && !plans.some((q) => q.id === x.plan.id)) out.push({ ...x.plan, offer: { title: o.title, gets: x.gets, endsOn: o.endsOn, standardPrice: x.plan.price, standardDuration: x.plan.duration } });
  }
  return out;
}
