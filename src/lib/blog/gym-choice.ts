import type { Plan } from "@/lib/content/types";
import { applyOffer, type Offer } from "@/lib/offers";

/**
 * Extras for the gym blog posts people read while choosing a gym (GYM_CHOICE_POSTS in
 * src/lib/adsense.ts). Post bodies can be saved in the admin, so their price tables may go stale;
 * this box is built from the live plans and offers instead, so it always matches /membership.
 */
export type PriceRow = {
  name: string;
  /** What the visitor gets today, e.g. "1 month + 5 bonus days". */
  gets: string;
  price: number;
  /** Standard price shown struck through while an offer is cheaper; 0 otherwise. */
  standardPrice: number;
  /** Price divided by the months you get (bonus months count, bonus days don't), rounded. */
  perMonth: number;
  /** Two people joining together; 0 when the plan has no couple option. */
  couplePrice: number;
};

/** Whole months in a duration, bonus months included: "12 months + 2 months" → 14. Bonus days are left out. */
const months = (duration: string) => [...duration.matchAll(/(\d+)\s*months?/gi)].reduce((n, m) => n + Number(m[1]), 0);

export function livePriceRows(plans: Plan[], today: string, offers: Offer[]): PriceRow[] {
  return applyOffer(plans, today, offers)
    .filter((p) => p.price > 0)
    .map((p) => {
      const n = months(p.duration);
      return {
        name: p.name,
        gets: p.offer?.gets ?? p.duration,
        price: p.price,
        standardPrice: p.originalPrice > p.price ? p.originalPrice : 0,
        perMonth: n ? Math.round(p.price / n) : 0,
        couplePrice: p.couplePrice,
      };
    });
}

const GUIDES: { slug: string; title: string }[] = [
  { slug: "gym-fees-in-noida-membership-cost-guide", title: "Gym fees in Noida: what a membership should cost" },
  { slug: "best-gym-in-sector-93-noida-checklist", title: "10-point checklist before you join a gym in Sector 93" },
  { slug: "sector-93-noida-mein-gym-kaise-chune", title: "Sector 93 Noida mein gym kaise chune (Hindi)" },
  { slug: "gym-for-women-noida-beginners-guide", title: "Gym for women in Noida: a beginner's guide" },
  { slug: "couple-gym-membership-noida-train-together", title: "Couple gym membership in Noida" },
];

/** Links from one gym-choice post to the others, so readers (and Google) find the whole set. */
export function gymChoiceReadNext(slug: string): { href: string; title: string }[] {
  if (!GUIDES.some((g) => g.slug === slug)) return [];
  return GUIDES.filter((g) => g.slug !== slug).map((g) => ({ href: `/blog/${g.slug}`, title: g.title }));
}

/** The two guides linked from the membership page for visitors still comparing gyms. */
export const MEMBERSHIP_GUIDES = GUIDES.slice(0, 2).map((g) => ({ href: `/blog/${g.slug}`, title: g.title }));
