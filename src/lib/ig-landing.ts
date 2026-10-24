// What the Instagram bio page (/ig) leads with. Pure, so the copy follows the offer calendar on
// its own: during an offer the strip counts down to its last day; outside one it sells the free
// trial. Prices come from applyOffer, the same numbers the join page charges.
import type { SiteContent } from "./content/types";
import { activeOffer, applyOffer, type OfferPlan } from "./offers";
import { daysBetween } from "./growth/dates";

export type IgLanding = {
  /** The short line in the pill, e.g. "FESTIVE OFFER". */
  badge: string;
  /** "Ends today", "1 day left", "12 days left"; empty outside an offer. */
  countdown: string;
  /** One line under the pill: the headline deal. */
  deal: string;
  /** Plans on sale today, cheapest first; offer plans only during an offer. */
  plans: OfferPlan[];
  endsOn: string | null;
};

export function countdownLabel(today: string, endsOn: string) {
  const left = daysBetween(today, endsOn);
  if (left <= 0) return "Ends today";
  return left === 1 ? "1 day left" : `${left} days left`;
}

export function igLanding(c: SiteContent, today: string): IgLanding {
  const offer = activeOffer(today, c.offers);
  const plans = applyOffer(c.plans, today, c.offers).filter((p) => p.price > 0);
  if (!offer) {
    return { badge: "FREE TRIAL", countdown: "", deal: "Train free for a day · No payment needed", plans: plans.sort((a, b) => a.price - b.price), endsOn: null };
  }
  const onOffer = plans.filter((p) => p.offer).sort((a, b) => a.price - b.price);
  const monthly = onOffer.find((p) => p.id === "monthly") ?? onOffer[0];
  const deal = monthly?.offer ? `${monthly.name} ₹${monthly.price.toLocaleString("en-IN")} · ${monthly.offer.gets}${monthly.offer.perks?.[0] ? ` + ${monthly.offer.perks[0].toLowerCase()}` : ""}` : offer.title;
  return { badge: offer.title.toUpperCase(), countdown: countdownLabel(today, offer.endsOn), deal, plans: onOffer, endsOn: offer.endsOn };
}
