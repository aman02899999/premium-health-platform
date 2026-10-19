// Free-trial booking: the slots a visitor can pick, and what each booked lead hears before and
// after the visit. Pure: the form, the API and the daily run share it. All times are India time.
import { addDays, daysBetween, todayIST } from "./dates";

const IST_OFFSET_MS = 330 * 60_000;
const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export type Hours = { days: string; open: string; close: string }[];
export type SlotDay = { date: string; label: string; times: string[] };

/** How far ahead a visitor can book. */
export const BOOKING_DAYS = 7;

const minutes = (hhmm: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
};
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const weekday = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();

/**
 * Whether a block of opening hours covers a weekday. Reads what the admin typed in Business →
 * Hours: "Monday – Saturday", "Mon-Fri", "Sunday", "Daily", "All days". Unreadable text counts as
 * Monday to Saturday, the gym's usual week.
 */
export function coversDay(days: string, day: number): boolean {
  const t = days.toLowerCase();
  if (/daily|every ?day|all days|7 days|mon\w*\s*[–—-]\s*sun/.test(t)) return true;
  const idx = (s: string) => DAY_NAMES.findIndex((d) => d.startsWith(s.slice(0, 3)));
  const range = /([a-z]{3,})\w*\s*(?:[–—-]|to)\s*([a-z]{3,})/.exec(t);
  if (range) {
    const a = idx(range[1]);
    const b = idx(range[2]);
    if (a >= 0 && b >= 0) return a <= b ? day >= a && day <= b : day >= a || day <= b;
  }
  const named = DAY_NAMES.map((d, i) => (new RegExp(`\\b${d.slice(0, 3)}`).test(t) ? i : -1)).filter((i) => i >= 0);
  if (named.length) return named.includes(day);
  return day !== 0;
}

/** Hourly start times inside each block, leaving an hour before closing. */
function timesFor(date: string, hours: Hours): string[] {
  const out = new Set<string>();
  for (const h of hours) {
    if (!coversDay(h.days, weekday(date))) continue;
    const open = Math.ceil(minutes(h.open) / 60) * 60;
    const close = minutes(h.close);
    if (!Number.isFinite(open) || !Number.isFinite(close)) continue;
    for (let m = open; m + 60 <= close; m += 60) out.add(hhmm(m));
  }
  return [...out].sort();
}

/** Minutes past midnight, India time, for `now`. */
const nowMinutes = (now: Date) => {
  const d = new Date(now.getTime() + IST_OFFSET_MS);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};

/** The bookable days from today: open days only, today only for times at least 2 hours away. */
export function trialSlots(hours: Hours, now = new Date()): SlotDay[] {
  const today = todayIST(now);
  const out: SlotDay[] = [];
  for (let i = 0; i < BOOKING_DAYS; i++) {
    const date = addDays(today, i);
    const times = timesFor(date, hours).filter((t) => i > 0 || minutes(t) >= nowMinutes(now) + 120);
    if (times.length) out.push({ date, label: dayLabel(date, today), times });
  }
  return out;
}

export function dayLabel(date: string, today: string): string {
  const diff = daysBetween(today, date);
  const d = new Date(`${date}T00:00:00Z`);
  const short = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  return diff === 0 ? `Today, ${short}` : diff === 1 ? `Tomorrow, ${short}` : short;
}

/** "6:00 PM" from "18:00". */
export function timeLabel(t: string): string {
  const m = minutes(t);
  const h = Math.floor(m / 60);
  return `${h % 12 || 12}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** The chosen slot as an instant, or null if it isn't one of the slots offered right now. */
export function parseTrialSlot(date: unknown, time: unknown, hours: Hours, now = new Date()): string | null {
  if (typeof date !== "string" || typeof time !== "string") return null;
  const day = trialSlots(hours, now).find((d) => d.date === date);
  if (!day?.times.includes(time)) return null;
  return toInstant(date, time);
}

/** "2026-10-21" + "18:00" (India time) → ISO instant. */
export const toInstant = (date: string, time: string) => new Date(Date.parse(`${date}T${time}:00Z`) - IST_OFFSET_MS).toISOString();

/** The India date and time of an instant. */
export function istParts(iso: string): { date: string; time: string } {
  const d = new Date(new Date(iso).getTime() + IST_OFFSET_MS).toISOString();
  return { date: d.slice(0, 10), time: d.slice(11, 16) };
}

/** "Tue 21 Oct, 6:00 PM" for messages. */
export function formatTrial(iso: string): string {
  const { date, time } = istParts(iso);
  const d = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  return `${d}, ${timeLabel(time)}`;
}

/**
 * Where a booked lead is, from what the desk marked:
 * - booked: trial ahead (or today), nobody has marked the visit yet
 * - unmarked: the trial day passed and the desk hasn't said whether they came
 * - no-show: the desk marked that they didn't come
 * - came: the desk marked the visit (status "trial")
 */
export type TrialStage = "booked" | "unmarked" | "no-show" | "came";

export function trialStage(l: { status: string; trialAt: string | null; showedUp: boolean | null }, today: string): TrialStage | null {
  if (!l.trialAt) return null;
  if (l.status === "trial" || l.showedUp === true) return "came";
  if (l.showedUp === false) return "no-show";
  return istParts(l.trialAt).date >= today ? "booked" : "unmarked";
}
