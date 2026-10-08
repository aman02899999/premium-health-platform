// Calendar maths for memberships, always in India time (IST, UTC+5:30, no daylight saving).
// Dates are ISO "YYYY-MM-DD" strings so no time zone can shift them.

const IST_OFFSET_MS = 330 * 60_000;

/** Today's date in India. */
export function todayIST(now = new Date()): string {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

const toUTC = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUTC = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const isIsoDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && fromUTC(toUTC(s)) === s;

export const addDays = (iso: string, days: number) => fromUTC(toUTC(iso) + days * 86_400_000);

/** Whole days from a to b (b − a). */
export const daysBetween = (a: string, b: string) => Math.round((toUTC(b) - toUTC(a)) / 86_400_000);

/** Adds calendar months, clamping to the month's last day (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const total = m - 1 + months;
  const year = y + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return fromUTC(Date.UTC(year, month, Math.min(d, last)));
}

export type Span = { months: number; days: number };

/**
 * Reads a plan duration the admin typed ("1 month", "3 Months", "12 months", "1 year",
 * "15 months", "2 weeks", "10 days"). Returns null when it can't be read with certainty,
 * so no membership is ever given a guessed expiry.
 */
export function parseDuration(text: string): Span | null {
  const m = text.trim().toLowerCase().match(/^(\d{1,3})\s*(day|days|week|weeks|month|months|mo|year|years|yr|yrs)$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!n) return null;
  const unit = m[2];
  if (unit.startsWith("day")) return { months: 0, days: n };
  if (unit.startsWith("week")) return { months: 0, days: n * 7 };
  if (unit.startsWith("y")) return { months: n * 12, days: 0 };
  return { months: n, days: 0 };
}

/** Last valid day of a membership that starts on `start` (inclusive): 8 Oct + 1 month → 7 Nov. */
export function expiryFor(start: string, span: Span): string {
  return addDays(addDays(addMonths(start, span.months), span.days), -1);
}

/**
 * When a paid plan starts. A renewal before expiry starts the day after the current
 * membership ends, so no paid day is lost; a lapsed member starts today (or the date chosen).
 */
export function renewalStart(today: string, requested: string | null, currentExpiry: string | null): string {
  let start = requested && requested > today ? requested : today;
  if (currentExpiry && currentExpiry >= start) start = addDays(currentExpiry, 1);
  return start;
}

/** "7 Nov 2026" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${y}`;
}
