// Shareable result cards for the gym calculators. The card image is drawn from the inputs, not
// from text in the URL: the route recomputes the result with the same formulas, so nobody can put
// their own words on a card with the gym's name on it. Pure: the calculator, the image route and
// the tests share it.
import { ACTIVITY_LEVELS, heartRateZones, macros, oneRepMax, tdee, waterIntake, type ActivityId, type Goal, type Sex } from "./calculators";

/**
 * Fitness numbers people like to post. Health-risk results (BMI category, body fat, diabetes
 * risk, waist-to-height, ideal weight) never get a card: they are private, and a shared card can
 * shame or worry someone.
 */
export const SHAREABLE = new Set(["tdee", "macro", "one-rep-max", "water", "heart-rate"] as const);
export type ShareKey = typeof SHAREABLE extends Set<infer K> ? K : never;

type Body = { sex: Sex; age: number; weight: number; height: number; activity: ActivityId };
export type CardInput =
  | ({ key: "tdee" } & Body)
  | ({ key: "macro"; goal: Goal } & Body)
  | { key: "one-rep-max"; weight: number; reps: number }
  | { key: "water"; weight: number; minutes: number; hot: boolean }
  | { key: "heart-rate"; age: number; resting: number };

export type Card = { headline: string; value: string; unit: string; lines: string[] };

const kcal = (n: number) => n.toLocaleString("en-IN");

export function cardFor(i: CardInput): Card {
  switch (i.key) {
    case "tdee": {
      const r = tdee(i.sex, i.weight, i.height, i.age, i.activity);
      return { headline: "My daily calories", value: kcal(r.maintain), unit: "kcal", lines: [`Fat loss: about ${kcal(r.fatLoss)} kcal`, `Lean gain: about ${kcal(r.gain)} kcal`] };
    }
    case "macro": {
      const m = macros(tdee(i.sex, i.weight, i.height, i.age, i.activity).maintain, i.weight, i.goal);
      const goal = i.goal === "lose" ? "Fat loss" : i.goal === "gain" ? "Muscle gain" : "Maintain";
      return { headline: `My daily protein · ${goal}`, value: String(m.protein), unit: "g protein", lines: [`${kcal(m.calories)} kcal a day`, `Carbs ${m.carbs} g · Fat ${m.fat} g`] };
    }
    case "one-rep-max": {
      const r = oneRepMax(i.weight, i.reps);
      return { headline: "My estimated 1-rep max", value: String(r.estimate), unit: "kg", lines: [`From ${i.weight} kg × ${i.reps} reps`, `Working sets at 80%: ${r.table.find((t) => t.pct === 80)!.weight} kg`] };
    }
    case "water": {
      const r = waterIntake(i.weight, i.minutes, i.hot);
      return { headline: "My daily water target", value: String(r.litres), unit: "litres", lines: [`About ${r.glasses} glasses of 250 ml`, i.minutes ? `Includes ${i.minutes} min of training` : "On a rest day"] };
    }
    case "heart-rate": {
      const r = heartRateZones(i.age, i.resting);
      const z2 = r.zones[1];
      return { headline: "My fat-burn heart-rate zone", value: `${z2.low}–${z2.high}`, unit: "bpm", lines: [`Zone 2 · max heart rate about ${r.max} bpm`, `Worked out with the ${r.method} method`] };
    }
  }
}

// ---------- query string (short keys keep the image URL small) ----------

const ACTIVITY_IDS = ACTIVITY_LEVELS.map((a) => a.id) as readonly string[];

/** Same ranges as the calculator sliders: anything outside them is not drawn. */
function num(v: string | null, min: number, max: number): number | null {
  if (v === null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

export function cardQuery(i: CardInput): string {
  const p = new URLSearchParams({ k: i.key });
  if (i.key === "tdee" || i.key === "macro") {
    p.set("s", i.sex === "male" ? "m" : "f");
    p.set("a", String(i.age));
    p.set("w", String(i.weight));
    p.set("h", String(i.height));
    p.set("act", i.activity);
    if (i.key === "macro") p.set("g", i.goal);
  } else if (i.key === "one-rep-max") {
    p.set("w", String(i.weight));
    p.set("r", String(i.reps));
  } else if (i.key === "water") {
    p.set("w", String(i.weight));
    p.set("m", String(i.minutes));
    p.set("hot", i.hot ? "1" : "0");
  } else {
    p.set("a", String(i.age));
    p.set("rest", String(i.resting));
  }
  return p.toString();
}

export function parseCardQuery(p: URLSearchParams): CardInput | null {
  const key = p.get("k");
  if (key === "tdee" || key === "macro") {
    const s = p.get("s");
    const sex: Sex | null = s === "m" ? "male" : s === "f" ? "female" : null;
    const age = num(p.get("a"), 15, 80);
    const weight = num(p.get("w"), 30, 200);
    const height = num(p.get("h"), 120, 220);
    const act = p.get("act") ?? "";
    if (!sex || age === null || weight === null || height === null || !ACTIVITY_IDS.includes(act)) return null;
    const body = { sex, age, weight, height, activity: act as ActivityId };
    if (key === "tdee") return { key, ...body };
    const g = p.get("g");
    return g === "lose" || g === "maintain" || g === "gain" ? { key, ...body, goal: g } : null;
  }
  if (key === "one-rep-max") {
    const weight = num(p.get("w"), 5, 300);
    const reps = num(p.get("r"), 1, 12);
    return weight === null || reps === null || !Number.isInteger(reps) ? null : { key, weight, reps };
  }
  if (key === "water") {
    const weight = num(p.get("w"), 30, 200);
    const minutes = num(p.get("m"), 0, 180);
    const hot = p.get("hot");
    return weight === null || minutes === null || (hot !== "1" && hot !== "0") ? null : { key, weight, minutes, hot: hot === "1" };
  }
  if (key === "heart-rate") {
    const age = num(p.get("a"), 15, 85);
    const resting = num(p.get("rest"), 40, 100);
    return age === null || resting === null ? null : { key, age, resting };
  }
  return null;
}

// ---------- sharing ----------

/** The calculator page, tagged so shares show up in analytics as their own source. */
export function toolShareUrl(siteUrl: string, slug: string, key: string): string {
  return `${siteUrl}/tools/${slug}?utm_source=share&utm_medium=result_card&utm_campaign=${encodeURIComponent(key)}`;
}

export function shareText(c: Card, url: string): string {
  return `${c.headline}: ${c.value} ${c.unit} 💪\nWork out yours free (takes 10 seconds): ${url}`;
}
