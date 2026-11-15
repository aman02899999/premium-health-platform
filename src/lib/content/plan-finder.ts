// "Which plan is for me?": two taps on the home and membership pages. The answer is picked only
// from the admin's own plans, so it can never show a plan or price that isn't on the list below it.
import type { Plan } from "./types";
import { planMonths } from "./plans";

export type FinderWho = "single" | "couple";
export type FinderGoal = "try" | "three" | "six" | "year";

type Priced = Plan & { offer?: { standardDuration: string } };

const TARGET_MONTHS: Record<FinderGoal, number> = { try: 1, three: 3, six: 6, year: 12 };
// Plans named for one group (for example "Female's Special") are pointed to, never recommended to all.
const RESTRICTED = /\b(female|women|ladies|girls|student|senior|kids)/i;

const months = (p: Priced) => planMonths(p.offer?.standardDuration ?? p.duration);

export const restrictedPlans = <T extends Plan>(plans: T[]): T[] => plans.filter((p) => RESTRICTED.test(p.name));

/** The plan whose standard length is closest to what the visitor wants; ties go to the featured, then the cheaper per month. */
export function recommendPlan<T extends Priced>(plans: T[], who: FinderWho, goal: FinderGoal): T | undefined {
  const price = (p: T) => (who === "couple" ? p.couplePrice : p.price);
  const pool = plans.filter((p) => !RESTRICTED.test(p.name) && price(p) > 0);
  const target = TARGET_MONTHS[goal];
  return [...pool].sort(
    (a, b) =>
      Math.abs(months(a) - target) - Math.abs(months(b) - target) ||
      Number(b.featured) - Number(a.featured) ||
      price(a) / months(a) - price(b) / months(b),
  )[0];
}
