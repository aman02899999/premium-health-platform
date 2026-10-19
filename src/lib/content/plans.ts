// Plan maths and copy shared by the membership page, the printable price sheet and the plans PDF.
// Everything is derived from the admin's plans (after any running offer), so summaries, the
// comparison matrix and the documents never disagree with the prices on the plan cards.
import type { Business, Faq, Plan } from "./types";
import { formatINR, formatTime } from "@/lib/site";

/** Whole months in a duration, counting offer bonus months ("12 months + 2 months" → 14; bonus days don't count). */
export const planMonths = (d: string) =>
  Math.max(
    1,
    d.split("+").reduce((sum, part) => {
      const n = Number(part.match(/\d+/)?.[0] ?? 0);
      return sum + (/year/i.test(part) ? n * 12 : /month/i.test(part) ? n : 0);
    }, 0),
  );

type Priced = Plan & { offer?: { title: string; gets: string; standardPrice: number; standardDuration: string; perks?: string[] } };

const INHERIT = /^everything in (.+)$/i;

/**
 * Features each plan includes. "Everything in Quarterly" pulls in Quarterly's features (and,
 * through it, Monthly's), so the matrix shows ticks the way the plan cards describe them.
 */
export function planFeatures(plans: Priced[]): { features: string[]; has: (planId: string, feature: string) => boolean } {
  const byName = new Map(plans.map((p) => [p.name.trim().toLowerCase(), p]));
  const own = (p: Plan) => p.perks.filter((x) => !INHERIT.test(x.trim()));
  // A running offer's perks belong to that plan only; "Everything in Annual" means the standard Annual.
  const standard = (p: Priced) => own(p).filter((x) => !p.offer?.perks?.includes(x));
  const memo = new Map<string, Set<string>>();
  const includes = (p: Priced, seen: Set<string>, inherited = false): Set<string> => {
    const key = `${p.id}:${inherited}`;
    const hit = memo.get(key);
    if (hit) return hit;
    const set = new Set(inherited ? standard(p) : own(p));
    for (const perk of p.perks) {
      const m = perk.trim().match(INHERIT);
      const parent = m && byName.get(m[1].trim().toLowerCase());
      if (parent && !seen.has(parent.id)) for (const f of includes(parent, new Set([...seen, p.id]), true)) set.add(f);
    }
    memo.set(key, set);
    return set;
  };
  const features: string[] = [];
  for (const p of plans) for (const f of own(p)) if (!features.includes(f)) features.push(f);
  return { features, has: (planId, f) => (plans.find((p) => p.id === planId) ? includes(plans.find((p) => p.id === planId)!, new Set()).has(f) : false) };
}

/** The plan the others are measured against: the shortest standard plan. */
export function basePlan<T extends Priced>(plans: T[]): T | undefined {
  const std = (p: T) => p.offer?.standardDuration ?? p.duration;
  return [...plans].sort((a, b) => planMonths(std(a)) - planMonths(std(b)))[0];
}

export const perMonth = (p: Plan) => Math.round(p.price / planMonths(p.duration));

/** Percent saved per month versus paying the base plan's standard monthly rate every month. */
export function savingPct(p: Priced, base: Priced | undefined): number {
  if (!base || base.id === p.id) return 0;
  const baseRate = (base.offer?.standardPrice ?? base.price) / planMonths(base.offer?.standardDuration ?? base.duration);
  const pct = Math.round((1 - perMonth(p) / baseRate) * 100);
  return pct > 0 ? pct : 0;
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** 3–5 plain sentences describing a plan, built only from its own data. */
export function planSummary(p: Priced, plans: Priced[]): string {
  const base = basePlan(plans);
  const months = planMonths(p.duration);
  const s: string[] = [];
  s.push(
    p.offer
      ? `${p.name} is ${p.offer.gets} for ${formatINR(p.price)} during the ${p.offer.title} (standard price ${formatINR(p.offer.standardPrice)} for ${p.offer.standardDuration}).`
      : `${p.name} is a ${p.duration} membership for ${formatINR(p.price)}, about ${formatINR(perMonth(p))} a month.`,
  );
  const pct = savingPct(p, base);
  if (pct > 0 && base) s.push(`That works out ${pct}% cheaper per month than paying the ${base.name} rate every month.`);
  const own = p.perks.filter((x) => !INHERIT.test(x.trim()));
  const parent = p.perks.map((x) => x.trim().match(INHERIT)?.[1]).find(Boolean);
  if (own.length) s.push(`It includes ${list(own.slice(0, 3).map(lower))}${parent ? `, on top of everything in ${parent}` : ""}.`);
  if (p.couplePrice > 0) s.push(`Joining with a partner? Two people pay ${formatINR(p.couplePrice)} together, ${formatINR(Math.round(p.couplePrice / 2))} each.`);
  s.push(
    months <= 1
      ? "Best for trying the gym properly or a short stay in Noida."
      : months <= 3
        ? "A good length for a first fat-loss or strength block with regular check-ins."
        : months <= 6
          ? "Long enough to see real changes in strength and body shape."
          : "The best value if you plan to train through the year.",
  );
  return s.slice(0, 5).join(" ");
}

/** Plan questions answered from the published Refund & Cancellation Policy, plus opening hours. */
export function planFaqs(b: Business): Faq[] {
  const hours = b.hours.map((h) => `${h.label.toLowerCase()} ${formatTime(h.open)}–${formatTime(h.close)} (${h.days})`).join(" and ");
  return [
    {
      id: "plan-usage",
      q: "When can I use my membership?",
      a: `Any batch, any day we're open: ${hours}. Your plan starts on the day it is activated at the front desk, usually your first visit, and runs for its full duration from then.`,
    },
    {
      id: "plan-cancel",
      q: "Can I cancel and get a refund?",
      a: "A membership paid online can be cancelled for a full refund until it is activated at the front desk (your first visit), within 7 days of payment. Once activated, membership fees are not refundable. Duplicate or failed payments are always refunded in full.",
    },
    {
      id: "plan-freeze",
      q: "Can I freeze or pause my plan?",
      a: "There is no automatic freeze. For medical reasons or relocation, talk to us and we'll consider pausing your plan. Ask before your break so the dates can be recorded.",
    },
    {
      id: "plan-transfer",
      q: "Can I transfer my membership to someone else?",
      a: "No. Memberships are personal and can't be transferred to another person. If you want to train with someone, the couple price for two people joining together is the better option.",
    },
  ];
}
