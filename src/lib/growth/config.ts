// Business rules for the growth features. Change a number here and redeploy.

/** Bonus days added to the existing member's membership when a friend joins with their code. */
export const REFERRER_BONUS_DAYS = 7;
/** Bonus days added to the new member's first membership when they join with a code. */
export const REFERRED_BONUS_DAYS = 7;

/** Personal diet chart, prepared by a coach with the Diet Calculator. */
export const DIET_CHART = {
  priceRupees: 999,
  turnaround: "48 hours",
};

/** Diet + training plans sold online. Prices are charged on the server from this list. */
export type DietPlanId = "trial" | "starter" | "1m" | "3m" | "6m" | "premium";
export type DietPlan = { id: DietPlanId; name: string; priceRupees: number; months: number; checkIns: number; summary: string; popular?: boolean; trial?: boolean };
export const DIET_PLANS: DietPlan[] = [
  // One per phone number; the PDF is watermarked "7-DAY TRIAL PLAN" and shows what the full programme adds.
  { id: "trial", name: "7-Day Trial Plan", priceRupees: 49, months: 0, checkIns: 1, summary: "Your personal 7-day diet chart + workouts · Day-7 review · one per person", trial: true },
  { id: "starter", name: "Starter Chart", priceRupees: 999, months: 0, checkIns: 0, summary: "7-day diet chart + workout plan" },
  { id: "1m", name: "1-Month Kickstart", priceRupees: 1999, months: 1, checkIns: 2, summary: "Plan + 1 update at week 2 · WhatsApp support" },
  { id: "3m", name: "3-Month Transformation", priceRupees: 2999, months: 3, checkIns: 6, summary: "Updated every 2 weeks · herbs & supplements · 12-week roadmap", popular: true },
  { id: "6m", name: "6-Month Lifestyle", priceRupees: 4999, months: 6, checkIns: 12, summary: "12 check-ins + maintenance phase so the weight stays off" },
  { id: "premium", name: "3-Month Premium 1-on-1", priceRupees: 5999, months: 3, checkIns: 12, summary: "Weekly check-ins · monthly video call · priority WhatsApp" },
];
export const dietPlan = (id: unknown): DietPlan => DIET_PLANS.find((p) => p.id === id) ?? DIET_PLANS.find((p) => p.id === "starter")!;
export const isDietPlanId = (id: unknown): id is DietPlanId => DIET_PLANS.some((p) => p.id === id);

/** Referral codes look like RFC-AMAN-7K2Q. */
const CODE_RE = /^RFC-[A-Z0-9]{2,8}-[A-Z0-9]{4}$/;
export const looksLikeReferralCode = (s: string) => CODE_RE.test(s.trim().toUpperCase());
export const normaliseCode = (s: string) => s.trim().toUpperCase();

// No 0/O/1/I/L: codes are read aloud and typed from WhatsApp.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** A new referral code from the member's first name; `random` is injectable for tests. */
export function makeReferralCode(name: string, random: () => number = Math.random): string {
  const firstName = name.trim().split(/\s+/)[0] ?? "";
  const stem = (firstName.normalize("NFKD").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 6) || "FIT").padEnd(2, "X");
  let tail = "";
  for (let i = 0; i < 4; i++) tail += ALPHABET[Math.floor(random() * ALPHABET.length) % ALPHABET.length];
  return `RFC-${stem}-${tail}`;
}
