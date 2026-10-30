// Pure rules for the member tools' saved data (food log, check-ins, cloud sync), kept out of
// the React components so they can be tested.
import type { Portion } from "@/lib/fitness/foods";
import { SYNC_KEYS } from "@/lib/supabase/config";

/** localStorage key naming the account the saved tool data on this device belongs to. */
export const OWNER_KEY = "rfc-sync-owner";

/** Every localStorage key that holds a member's own data (cleared on sign-out). */
export const MEMBER_KEYS = [...SYNC_KEYS, OWNER_KEY] as const;

/**
 * Whether data saved on this device may be shown to / uploaded for this account. Data saved
 * while signed out (no owner) belongs to whoever signs in next; data saved under another
 * account never does, so a shared or family phone can't mix two people's logs.
 */
export const localBelongsTo = (owner: string | null, userId: string) => !owner || owner === userId;

export type FoodDay = { date: string; items: Portion[] };

/**
 * The food log is one day's list. Older saves were a bare list with no date: treat those as
 * today's (the best guess), and start an empty list once the saved day is over.
 */
export function foodLogFor(value: unknown, today: string): FoodDay {
  if (Array.isArray(value)) return { date: today, items: value as Portion[] };
  const v = value as Partial<FoodDay> | null;
  if (v && typeof v.date === "string" && Array.isArray(v.items)) return v.date === today ? (v as FoodDay) : { date: today, items: [] };
  return { date: today, items: [] };
}

/** Count of foods in a saved food log, whatever its format. */
export const foodCount = (value: unknown) => (Array.isArray(value) ? value.length : Array.isArray((value as FoodDay | null)?.items) ? (value as FoodDay).items.length : 0);

export type CheckIn = { date: string; weight: number; waist: number };

/**
 * Adds a check-in. A second check-in on the same date fills in what it has and keeps the rest,
 * so logging weight in the morning and waist later doesn't wipe the weight.
 */
export function addCheckIn(list: CheckIn[], entry: CheckIn): CheckIn[] {
  const old = list.find((x) => x.date === entry.date);
  const merged = old ? { date: entry.date, weight: entry.weight || old.weight, waist: entry.waist || old.waist } : entry;
  return [...list.filter((x) => x.date !== entry.date), merged].sort((a, b) => a.date.localeCompare(b.date));
}

/** Signing in on a device with check-ins made while signed out: keep both, the account's copy wins a clash. */
export function mergeCheckIns(cloud: CheckIn[], local: CheckIn[]): CheckIn[] {
  return local.reduce((acc, e) => (acc.some((x) => x.date === e.date) ? acc : addCheckIn(acc, e)), [...cloud].sort((a, b) => a.date.localeCompare(b.date)));
}

/** "2026-10-29" → "29 Oct" (adds the year when it isn't the current one). Never shifts the day. */
export function shortDate(iso: string, today = new Date().toISOString().slice(0, 10)) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  const sameYear = iso.slice(0, 4) === today.slice(0, 4);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }), timeZone: "UTC" });
}
