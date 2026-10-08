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
