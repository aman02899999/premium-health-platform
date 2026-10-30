// Daily marketing: one ready-to-post message a day for WhatsApp Status, Instagram and the Google
// Business Profile, each linking to a plan with UTM tags so sales can be traced back to the post.
// Pure: the same date always gives the same post. Honest by rule: no invented results, reviews,
// numbers or fake deadlines; health claims are framed as support, never cure.
import { DIET_PLANS, REFERRER_BONUS_DAYS } from "./config";
import { TIPS, type Category, type Tip } from "./content-library";
import { MEDICAL_NOTE, feedSaleItem, priceLine, saleCta, saleHook, type SaleItem } from "./sales-catalog";
import type { Draft } from "./messages";
import { keywordsFor, socialCaption, tipIntro, type CaptionInput } from "./captions";

/** `shopOpen`: the supplement store's admin switch; supplement tips link to it only while it's on. */
export type PostBiz = { name: string; phone: string; siteUrl: string; coach: string; membershipFrom?: number; area?: string; address?: string; shopOpen?: boolean };
export type Channel = "whatsapp" | "instagram" | "google" | "facebook";
export type DailyPost = {
  date: string;
  theme: string;
  /** Short line for the admin list. */
  title: string;
  whatsapp: string;
  instagram: string;
  google: string;
  /** Facebook Page post: like Instagram, but Facebook keeps links clickable. */
  facebook: string;
  /** The landing page (without tracking), and the same page tagged per channel. */
  path: string;
  links: Record<Channel, string>;
  /** What to photograph or design for today's post. */
  visual: string;
  /** Tip posts: the three points and takeaway shown on the image. Offer posts: the body text. */
  points: string[];
  takeaway: string;
  category: Category | "Offer" | "Shop";
  /** Shop posts: the product's cover image path, when it has one. */
  cover: string | null;
  /** The call to action on its own ("Get your plan"), for cards and Reels. */
  cta: string;
  /** Health content: carries the "not medical advice" line. */
  medical: boolean;
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const trial = DIET_PLANS.find((p) => p.trial)!;
const three = DIET_PLANS.find((p) => p.id === "3m")!;
const perDay = (p: { priceRupees: number; months: number }) => Math.round(p.priceRupees / (p.months * 30));

type Idea = {
  theme: string;
  path: string;
  visual: string;
  /** Hook line, body, call to action: assembled per channel below. */
  build: (b: PostBiz) => { hook: string; body: string; cta: string };
  tags: string[];
};

const IDEAS: Idea[] = [
  {
    theme: "7-day trial offer",
    path: "/diet-chart?plan=trial",
    visual: "Phone screen showing page 1 of a trial PDF (blur the client's name), gold '₹49' sticker.",
    build: (b) => ({
      hook: `Your own diet plan for ${inr(trial.priceRupees)}?`,
      body: `Not a copied chart. ${b.coach} works out your calories and protein from your body, then writes a 7-day Indian diet in katori and roti measures, with a workout week to match.`,
      cta: `Try 7 days for ${inr(trial.priceRupees)}`,
    }),
    tags: ["DietPlan", "IndianDiet", "FatLoss"],
  },
  {
    theme: "Protein tip",
    path: "/diet-chart?plan=3m",
    visual: "Overhead shot of a thali: dal, paneer or eggs, curd, sabzi, 2 rotis. Label the protein in each.",
    build: (b) => ({
      hook: "Most Indian diets are short on protein, not long on roti.",
      body: "Add one protein to every meal: dal, curd, paneer, eggs, chana or chicken. It keeps you full and protects muscle while you lose fat. Your exact daily number depends on your weight and goal.",
      cta: `Get your number in a plan from ${b.coach}`,
    }),
    tags: ["Protein", "IndianFood", "HealthyEating"],
  },
  {
    theme: "Myth vs fact: rice",
    path: "/diet-chart?plan=trial",
    visual: "Split image: 'MYTH: rice makes you fat' / 'FACT: portions do'. Katori of rice in the middle.",
    build: () => ({
      hook: "Myth: you must stop eating rice to lose weight.",
      body: "Fact: fat loss comes from your total calories, not one food. A measured katori of rice with dal and sabzi fits most plans. What matters is how much, and what it is eaten with.",
      cta: "Get a plan with the foods you already eat",
    }),
    tags: ["MythBusting", "WeightLoss", "IndianDiet"],
  },
  {
    theme: "Free gym trial (Noida)",
    path: "/contact",
    visual: "Short video walking through the gym floor at a quiet hour; end on the front desk.",
    build: (b) => ({
      hook: `Looking for a gym near ${b.area ?? "Sector 93, Noida"}?`,
      body: `Come for a free trial session at ${b.name}. A trainer checks your goal and any injuries, then shows you a plan you can follow from day one.${b.membershipFrom ? ` Membership from ${inr(b.membershipFrom)} a month.` : ""}`,
      cta: `Book your free trial: call ${b.phone}`,
    }),
    tags: ["NoidaGym", "Sector93Noida", "GymNearMe"],
  },
  {
    theme: "3-month plan value",
    path: "/diet-chart?plan=3m",
    visual: "Simple graphic: '₹2,999 ÷ 90 days = ₹33 a day', with '6 check-ins' underneath.",
    build: (b) => ({
      hook: `${inr(perDay(three))} a day for a coach in your pocket.`,
      body: `The ${three.name} is ${inr(three.priceRupees)} for 90 days: a plan made for your body, updated every 2 weeks at ${three.checkIns} check-ins, with herbs and supplements guidance and a 12-week roadmap. ${b.coach} adjusts it when progress slows.`,
      cta: "Start your 3-month plan",
    }),
    tags: ["Transformation", "DietCoach", "FitnessIndia"],
  },
  {
    theme: "Personal training",
    path: "/contact",
    visual: "Trainer correcting a client's squat form (with the client's permission).",
    build: (b) => ({
      hook: "Form first, then weight.",
      body: `With personal training at ${b.name}, every rep is checked, your programme is built for your goal, and someone makes sure you actually turn up. Ideal if you are new, coming back from a break or working around an old injury.`,
      cta: `Ask about personal training: ${b.phone}`,
    }),
    tags: ["PersonalTrainer", "NoidaFitness", "StrengthTraining"],
  },
  {
    theme: "Consistency",
    path: "/diet-chart?plan=trial",
    visual: "Calendar page with 5 of 7 days ticked. Caption overlay: '5 good days out of 7'.",
    build: () => ({
      hook: "You don't need a perfect week. You need 5 good days out of 7.",
      body: "Plan tomorrow's meals tonight, keep water near you, and walk after dinner. Small, repeatable steps beat a crash diet every time.",
      cta: "Want a week planned for you? Try 7 days",
    }),
    tags: ["Motivation", "Consistency", "HealthyHabits"],
  },
  {
    theme: "PCOS & thyroid support",
    path: "/diet-chart?plan=3m",
    visual: "Calm flat-lay: methi seeds, cinnamon, curd, vegetables, a notebook titled 'my plan'.",
    build: (b) => ({
      hook: "PCOS or thyroid? Your diet should know about it.",
      body: `${b.coach} builds plans around your condition and medicines: steady carbs, enough protein, and kitchen herbs with safe doses. It supports your treatment; it never replaces your doctor.`,
      cta: "Get a plan that fits your health",
    }),
    tags: ["PCOS", "Thyroid", "WomensHealth"],
  },
  {
    theme: "Veg protein list",
    path: "/diet-chart?plan=trial",
    visual: "Carousel: paneer, soya chunks, chana, rajma, curd, moong dal — each with grams of protein per serving.",
    build: () => ({
      hook: "Vegetarian and stuck on protein?",
      body: "Paneer, curd, soya chunks, chana, rajma, moong dal and milk all count. Spread them across your meals instead of loading one meal.",
      cta: "Get a veg plan with your daily protein worked out",
    }),
    tags: ["VegetarianProtein", "VegDiet", "Protein"],
  },
  {
    theme: "Steps & walking",
    path: "/membership",
    visual: "Phone step-counter screenshot next to gym shoes.",
    build: (b) => ({
      hook: "Walking is the most underrated fat-loss tool.",
      body: `Aim for 7,000–10,000 steps a day, plus 3 strength sessions a week. Steps burn calories; strength training keeps your muscle. Train at ${b.name} and we'll set both up for you.`,
      cta: "See membership plans",
    }),
    tags: ["Walking", "StepsChallenge", "FatLoss"],
  },
  {
    theme: "Refer a friend",
    path: "/membership",
    visual: "Two friends high-fiving after a workout.",
    build: (b) => ({
      hook: "Training is easier with a friend.",
      body: `Members get a referral code. When a friend joins with it, you both get bonus days: ${REFERRER_BONUS_DAYS} extra days for you. Ask at the front desk at ${b.name} for your code.`,
      cta: "Join and train together",
    }),
    tags: ["WorkoutBuddy", "GymFriends", "NoidaGym"],
  },
  {
    theme: "Festive eating",
    path: "/diet-chart?plan=trial",
    visual: "A festive plate with sweets in one small katori and plenty of sabzi/dal.",
    build: () => ({
      hook: "Enjoy the festival without undoing your progress.",
      body: "Eat your regular protein-rich meals first, then enjoy sweets in a small portion. Walk after big meals and drink water between them. One heavy day never ruins a plan; giving up does.",
      cta: "Get back on track with a 7-day plan",
    }),
    tags: ["FestiveSeason", "HealthyFestival", "BalancedDiet"],
  },
  {
    theme: "Train together",
    path: "/membership",
    visual: "Couple or two friends training side by side.",
    build: (b) => ({
      hook: "Consistency is easier as a team.",
      body: `Train with your partner, sibling or best friend at ${b.name}. You keep each other going on the days you don't feel like it. Ask about our plans for two people.`,
      cta: "See membership plans",
    }),
    tags: ["CoupleWorkout", "TrainTogether", "NoidaGym"],
  },
  {
    theme: "Weight-loss plateau",
    path: "/diet-chart?plan=3m",
    visual: "Line graph that drops, flattens, then drops again after an 'adjusted plan' marker.",
    build: (b) => ({
      hook: "Weight stuck for 3 weeks?",
      body: `That's normal: as you lose weight, your body needs less food, so the same chart stops working. On our 3-month plan ${b.coach} adjusts your calories and workouts every 2 weeks so progress keeps going.`,
      cta: "Start a plan that updates with you",
    }),
    tags: ["Plateau", "WeightLossJourney", "DietCoach"],
  },
];

const DAY_MS = 86_400_000;
const dayNumber = (iso: string) => Math.floor(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / DAY_MS);

/** Adds UTM tags so a sale can be traced to the channel and the day's post. */
export function trackedLink(siteUrl: string, path: string, channel: Channel, date: string): string {
  const url = new URL(path, siteUrl.replace(/\/$/, "") + "/");
  url.searchParams.set("utm_source", channel);
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", `daily-${date}`);
  return url.toString() + (path.startsWith("/diet-chart") ? "#order" : "");
}

// The calendar, week by week: five tip days, one shop day (a diet plan, workout programme,
// book or combo) and one gym offer day. The tips run 18 weeks (about 4 months) before they
// repeat; shop and offer days keep rotating through their own lists. Day 0 is 16 Oct 2026.
const CALENDAR_START = dayNumber("2026-10-16");
const SHOP_DAY = 2;
const OFFER_DAY = 6;
/** How many days in [0, i) fall on weekday r of the calendar week. */
const daysOn = (i: number, r: number) => Math.floor((i + 6 - r) / 7);
const tipDaysBefore = (i: number) => i - daysOn(i, SHOP_DAY) - daysOn(i, OFFER_DAY);
/** Whole weeks, enough for every tip once (the last few tip days of the cycle wrap round). */
export const CALENDAR_DAYS = Math.ceil(TIPS.length / 5) * 7;

// Rotate topics so a week mixes fat loss, muscle, health, supplements, food and recovery
// instead of fourteen fat-loss posts in a row.
const ORDERED: Tip[] = (() => {
  const groups = new Map<Category, Tip[]>();
  for (const t of TIPS) groups.set(t.category, [...(groups.get(t.category) ?? []), t]);
  const queues = [...groups.values()];
  const out: Tip[] = [];
  while (out.length < TIPS.length) for (const q of queues) if (q.length) out.push(q.shift()!);
  return out;
})();

type Slot = { kind: "tip"; tip: Tip } | { kind: "offer"; idea: Idea } | { kind: "shop"; item: SaleItem; n: number };
function slotFor(date: string): Slot {
  const d = dayNumber(date) - CALENDAR_START;
  const weekday = ((d % 7) + 7) % 7;
  const week = Math.floor(d / 7);
  if (weekday === OFFER_DAY) return { kind: "offer", idea: IDEAS[((week % IDEAS.length) + IDEAS.length) % IDEAS.length] };
  if (weekday === SHOP_DAY) return { kind: "shop", item: feedSaleItem(week, date), n: week };
  const i = ((d % CALENDAR_DAYS) + CALENDAR_DAYS) % CALENDAR_DAYS;
  return { kind: "tip", tip: ORDERED[tipDaysBefore(i) % ORDERED.length] };
}

// What a reader of each kind of tip most likely wants next.
const TIP_CTA: Record<Category, { path: string; cta: (b: PostBiz) => string }> = {
  "Fat loss": { path: "/diet-chart?plan=trial", cta: () => `Want this built into a plan for your body? Try 7 days for ${inr(trial.priceRupees)}` },
  "Food facts": { path: "/diet-chart?plan=trial", cta: () => `Get a 7-day Indian diet made for you, ${inr(trial.priceRupees)}` },
  "Health & diet": { path: "/diet-chart?plan=3m", cta: (b) => `Get a diet plan that fits your reports, from ${b.coach}` },
  "Women's health": { path: "/diet-chart?plan=3m", cta: (b) => `Get a plan made around your health, from ${b.coach}` },
  "Muscle gain": { path: "/membership", cta: (b) => `Train with us: free trial session, call ${b.phone}` },
  Recovery: { path: "/membership", cta: (b) => `Train with a coach who plans this for you: ${b.phone}` },
  Supplements: { path: "/shop", cta: () => "Genuine supplements, explained honestly: Royal Supplements Store" },
};
/** Supplement tips while the store is switched off ("Coming soon"): send people to the coach instead. */
const SUPPLEMENTS_CLOSED_CTA = { path: "/contact", cta: (b: PostBiz) => `Not sure which supplement you need? Ask ${b.coach} before you buy: ${b.phone}` };
const MEDICAL = new Set<Category>(["Health & diet", "Women's health"]);

/** The post for an IST date ("YYYY-MM-DD"). The same date always gives the same post. */
export function dailyPost(date: string, biz: PostBiz): DailyPost {
  const slot = slotFor(date);
  const sign = [`— ${biz.coach}, ${biz.name}`, biz.address ? `📍 ${biz.address}` : "", `📞 ${biz.phone}`].filter(Boolean).join("\n");
  let theme: string, path: string, visual: string, hook: string, cta: string, tagList: string[], points: string[], takeaway: string, category: DailyPost["category"];
  let bodyText: string;
  let social: Omit<CaptionInput, "hook" | "cta" | "link" | "keywords" | "tags">;
  let cover: string | null = null;
  let medical = false;
  if (slot.kind === "tip") {
    const t = slot.tip;
    ({ theme, category } = t);
    const tipCta = t.category === "Supplements" && !biz.shopOpen ? SUPPLEMENTS_CLOSED_CTA : TIP_CTA[t.category];
    ({ path } = tipCta);
    cta = tipCta.cta(biz);
    hook = t.hook;
    points = [...t.points];
    takeaway = t.takeaway;
    tagList = t.tags;
    medical = MEDICAL.has(t.category);
    visual = "Auto-generated tip card (1080×1350) with the three points.";
    bodyText = `${points.map((p) => `✅ ${p}`).join("\n")}\n\n💡 ${takeaway}${MEDICAL.has(t.category) ? "\n\nGeneral information, not medical advice. Keep taking the medicines your doctor prescribed." : ""}`;
    social = { description: tipIntro(t.category), points, takeaway, medicalNote: medical ? "General information, not medical advice. Keep taking the medicines your doctor prescribed." : undefined };
  } else if (slot.kind === "shop") {
    const it = slot.item;
    theme = it.title;
    category = "Shop";
    path = it.path;
    hook = saleHook(it, slot.n);
    cta = saleCta(it);
    points = [...it.bullets];
    takeaway = priceLine(it);
    tagList = it.tags;
    visual = "Auto-generated product card (1080×1350).";
    cover = it.cover;
    medical = it.medical;
    bodyText = `${it.title}: ${it.subtitle}\n\n${points.map((p) => `✅ ${p}`).join("\n")}\n\n💰 ${takeaway}${it.medical ? `\n\n${MEDICAL_NOTE}` : ""}`;
    social = { description: `${it.title}: ${it.subtitle}`, points, takeaway: `Price: ${takeaway}`, medicalNote: it.medical ? MEDICAL_NOTE : undefined };
  } else {
    const idea = slot.idea;
    const built = idea.build(biz);
    ({ theme, path, visual } = idea);
    hook = built.hook;
    cta = built.cta;
    tagList = idea.tags;
    points = [built.body];
    takeaway = "";
    category = "Offer";
    bodyText = built.body;
    social = { description: built.body };
  }
  const links = {
    whatsapp: trackedLink(biz.siteUrl, path, "whatsapp", date),
    instagram: trackedLink(biz.siteUrl, path, "instagram", date),
    google: trackedLink(biz.siteUrl, path, "google", date),
    facebook: trackedLink(biz.siteUrl, path, "facebook", date),
  };
  // Instagram and Facebook: the shared caption format (description, CTA, keywords, hashtags).
  const caption = (channel: "instagram" | "facebook") => socialCaption({ ...social, hook, cta, link: links.facebook, keywords: keywordsFor(category), tags: tagList }, biz, channel);
  return {
    date,
    theme,
    title: hook,
    whatsapp: `*${hook}*\n\n${bodyText}\n\n👉 ${cta}\n${links.whatsapp}\n\n${sign}`,
    // Instagram captions can't hold clickable links: they point to the bio link instead.
    instagram: caption("instagram"),
    google: `${hook} ${slot.kind === "tip" ? `${points.join(" ")} ${takeaway}` : bodyText} ${cta}. ${links.google}`,
    facebook: caption("facebook"),
    path,
    links,
    visual,
    points,
    takeaway,
    category,
    cover,
    cta,
    medical,
  };
}

/** Today's post and the days after it, for planning the week. */
export function upcomingPosts(from: string, biz: PostBiz, days = 7): DailyPost[] {
  return Array.from({ length: days }, (_, i) => dailyPost(new Date(Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10)) + i * DAY_MS).toISOString().slice(0, 10), biz));
}

export const IDEA_COUNT = IDEAS.length;
export const TIP_COUNT = TIPS.length;

/** The morning email to the coach with the day's post, ready to copy. One per day (deduped). */
export type CoachExtras = { story?: { title: string; imageUrl: string }; reels?: string[] };

export function coachPostEmail(post: DailyPost, to: string, adminUrl: string, extras: CoachExtras = {}): Draft {
  const story = extras.story ? `\n\nINSTAGRAM STORY (posted automatically)\n${extras.story.title}\n${extras.story.imageUrl}\nAlso share it to your Facebook and WhatsApp Status.` : "";
  const reels = extras.reels?.length ? `\n\nTHIS WEEK'S REELS (film 20–25 seconds each on your phone)\n\n${extras.reels.join("\n\n")}` : "";
  return {
    channel: "email",
    to,
    toName: "Coach",
    kind: "coach-daily-post",
    subject: `Today's post: ${post.theme}`,
    body: `Today's post (${post.theme}). It goes out by itself as a Reel on Instagram and Facebook at about 7 pm, when most people are online. Below: the same post for WhatsApp Status and Google.\n\nPHOTO / DESIGN\n${post.visual}\n\nWHATSAPP STATUS\n${post.whatsapp}\n\nINSTAGRAM CAPTION\n${post.instagram}\n\nGOOGLE BUSINESS POST\n${post.google}${story}${reels}\n\n[[CTA:Open today's post|${adminUrl}]]`,
    template: "",
    params: [],
    dedupeKey: `coach-daily-post:${post.date}`,
  };
}
