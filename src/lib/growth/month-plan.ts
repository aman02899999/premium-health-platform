// The month plan: on top of the daily Reel, two cheat-sheet feed posts (morning and afternoon)
// and a second Reel every day for 30 days. Pure: the same date and slot always give the same
// post. The cards are in month-plan-cards.ts; this file picks the day's card, its gallery photo,
// its call to action (the running offer, else a free trial) and writes the captions.
import { activeOffer, type Offer } from "@/lib/offers";
import { DIET_PLANS } from "./config";
import { addDays, daysBetween } from "./dates";
import { dailyPost, type DailyPost, type PostBiz } from "./daily-posts";
import { CARDS, type Card } from "./month-plan-cards";

/** First day of the plan (India time) and how long it runs. Outside these dates nothing extra posts. */
export const MONTH_START = "2026-11-01";
export const MONTH_DAYS = 30;

export type FeedSlot = "am" | "pm";

/**
 * The coach's own photos in public/gallery, used behind the cards and the second Reel. Only the
 * photos without words printed on them: a quote under the card's title would fight with it.
 */
export const GALLERY = [
  "aman-sharma-royal-fitness-gym.webp",
  "aman-sharma-between-sets.webp",
  "aman-sharma-front-pose.webp",
  "aman-sharma-back-pose.webp",
  "aman-sharma-chest-shoulders.webp",
  "aman-sharma-gym-selfie.webp",
  "aman-sharma-physique.webp",
  "aman-sharma-back-flex.webp",
  "aman-sharma-slow-success.webp",
  "aman-sharma-even-at-my-worst.webp",
] as const;

export const MEDICAL_NOTE = "General information, not medical advice. If you have a health condition, follow your doctor's advice.";

/** Day 0–29 of the plan, or null outside it. */
export function monthDay(date: string): number | null {
  const d = daysBetween(MONTH_START, date);
  return d >= 0 && d < MONTH_DAYS ? d : null;
}

const cardIndex = (day: number, slot: FeedSlot) => day * 2 + (slot === "am" ? 0 : 1);

export type CardPost = {
  date: string;
  slot: FeedSlot;
  card: Card;
  /** File name in public/gallery. */
  photo: string;
  /** The call to action on the card: a headline and a short line under it. */
  cta: { headline: string; sub: string };
  path: string;
  links: { instagram: string; facebook: string };
  instagram: string;
  facebook: string;
  theme: string;
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const trial = DIET_PLANS.find((p) => p.trial)!;
const prettyDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

/** UTM-tagged link so a sale can be traced to the exact post. */
export function monthLink(siteUrl: string, path: string, channel: "instagram" | "facebook", date: string, slot: string): string {
  const url = new URL(path, siteUrl.replace(/\/$/, "") + "/");
  url.searchParams.set("utm_source", channel);
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", "month-plan");
  url.searchParams.set("utm_content", `${date}-${slot}`);
  return url.toString() + (path.startsWith("/diet-chart") ? "#order" : "");
}

/** What the card sells on this date. Membership cards point to the running offer while it runs. */
export function cardCta(card: Card, date: string, biz: PostBiz, offers: Offer[]): { headline: string; sub: string; path: string } {
  const phone = biz.phone.replace(/^\+91\s*/, "");
  if (card.goal === "diet") return { headline: `Your own diet plan: 7 days for ${inr(trial.priceRupees)}`, sub: `Made for your body by ${biz.coach}`, path: "/diet-chart?plan=trial" };
  const offer = activeOffer(date, offers);
  if (offer) return { headline: `${offer.title}: bonus days on every plan`, sub: `Till ${prettyDate(offer.endsOn)} · Call ${phone}`, path: "/membership" };
  if (card.goal === "pt") return { headline: "Train with a coach: free trial session", sub: `Call or WhatsApp ${phone}`, path: "/membership" };
  return { headline: "Book your free trial session", sub: `Call or WhatsApp ${phone}`, path: "/membership" };
}

function rowsText(card: Card): string {
  if (card.sections.length === 1) return card.sections[0].rows.map(([a, b]) => `▪️ ${a}: ${b}`).join("\n");
  return card.sections.map((s) => `▪️ ${s.head ? `${s.head}: ` : ""}${s.rows.map(([a, b]) => `${a} ${b}`).join(", ")}`).join("\n");
}

/** The feed post for a date and slot, or null outside the plan. */
export function cardPost(date: string, slot: FeedSlot, biz: PostBiz, offers: Offer[]): CardPost | null {
  const day = monthDay(date);
  if (day === null) return null;
  const i = cardIndex(day, slot);
  const card = CARDS[i % CARDS.length];
  const cta = cardCta(card, date, biz, offers);
  const links = { instagram: monthLink(biz.siteUrl, cta.path, "instagram", date, slot), facebook: monthLink(biz.siteUrl, cta.path, "facebook", date, slot) };
  const head = `${card.title.join(" ")}: ${card.subtitle}`;
  const body = [
    rowsText(card),
    card.caption,
    card.source ? `📚 Source: ${card.source}` : "",
    card.medical ? MEDICAL_NOTE : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const sign = [`— ${biz.coach}, ${biz.name}`, `📞 Call or WhatsApp ${biz.phone}`, biz.address ? `📍 ${biz.address}` : ""].filter(Boolean).join("\n");
  const tags = ["RoyalFitnessClub", "CoachAman", ...card.tags, "NoidaGym", "Sector93Noida"].map((t) => `#${t}`).join(" ");
  const ctaLine = `${cta.headline}. ${cta.sub}.`;
  return {
    date,
    slot,
    card,
    photo: GALLERY[(i * 3) % GALLERY.length],
    cta: { headline: cta.headline, sub: cta.sub },
    path: cta.path,
    links,
    theme: `${card.title.join(" ")}`.slice(0, 80),
    // Instagram captions can't hold links: the bio link (/ig) carries them.
    instagram: `${head}\n\n${body}\n\n👉 ${ctaLine} Link in bio.\n💾 Save this for your next workout.\n\n${sign}\n\n${tags}`,
    facebook: `${head}\n\n${body}\n\n👉 ${ctaLine}\n${links.facebook}\n\n${sign}\n\n${tags}`,
  };
}

/**
 * The second Reel's post: a tip from further along the daily calendar (66 days ahead, so it
 * isn't a repeat of anything the daily Reel shows this month, and shop and offer days land on
 * different weekdays), retagged with today's date. Null outside the plan.
 */
export const REEL2_OFFSET = 66;
export function secondReelPost(date: string, biz: PostBiz): DailyPost | null {
  if (monthDay(date) === null) return null;
  const source = addDays(date, REEL2_OFFSET);
  const post = dailyPost(source, biz);
  const retag = (s: string) => s.split(`daily-${source}`).join(`daily-${date}-reel2`);
  return {
    ...post,
    date,
    whatsapp: retag(post.whatsapp),
    instagram: retag(post.instagram),
    google: retag(post.google),
    facebook: retag(post.facebook),
    links: Object.fromEntries(Object.entries(post.links).map(([k, v]) => [k, retag(v)])) as DailyPost["links"],
  };
}

/** The gallery photo behind the second Reel's opening and closing screens. */
export const reelPhoto = (date: string) => GALLERY[((monthDay(date) ?? 0) * 3 + 1) % GALLERY.length];
