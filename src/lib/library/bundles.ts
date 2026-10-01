import { BOOKS, CATEGORIES, type Book } from "./catalog";

// Combo offers: hand-picked sets for one goal, plus one bundle per library section.
// Each is priced from its books' real single prices, so the saving shown is genuine.

export type Bundle = {
  id: string;
  kind: "combo" | "section";
  name: string;
  tagline: string;
  /** Who it's for / what it solves. */
  forWho: string;
  volumes: number[];
  slugs: string[];
  /** Sum of the single-book prices, in rupees. */
  listPrice: number;
  /** Bundle price, in rupees. */
  price: number;
};

const COMBO_OFF = 0.4;
const SECTION_OFF = 0.5;

/** Price after `off`, rounded down to a …99 figure. */
const offerPrice = (list: number, off: number) => Math.floor((list * (1 - off) + 1) / 100) * 100 - 1;

const byVolume = new Map(BOOKS.map((b) => [b.volume, b]));

function make(id: string, kind: Bundle["kind"], name: string, tagline: string, forWho: string, volumes: number[]): Bundle {
  const books = volumes.map((v) => byVolume.get(v)).filter((b): b is Book => Boolean(b));
  if (books.length !== volumes.length) throw new Error(`Bundle ${id} names a missing volume`);
  const listPrice = books.reduce((s, b) => s + b.price, 0);
  return { id, kind, name, tagline, forWho, volumes, slugs: books.map((b) => b.slug), listPrice, price: offerPrice(listPrice, kind === "combo" ? COMBO_OFF : SECTION_OFF) };
}

const COMBOS: Bundle[] = [
  make("combo-transformation", "combo", "Body Transformation Starter", "Lose fat, build strength, eat the Indian way", "Beginners who want a complete 90-day start: training, fat loss, food and running.", [1, 3, 13, 14, 52]),
  make("combo-muscle", "combo", "Muscle Builder Stack", "Size and strength, done right", "Lifters chasing muscle: hypertrophy, the big three, protein, lean bulking, supplements and recovery.", [2, 4, 14, 17, 15, 11]),
  make("combo-women", "combo", "Women's Strength & Hormones", "Train, eat and feel good in every season", "Women who want strength training, hormone-friendly eating, PCOS support and a healthy body image.", [6, 16, 25, 54, 36]),
  make("combo-fat-loss", "combo", "Fat Loss for Life", "Lose it once, keep it off", "Anyone stuck in the diet cycle: the fat-loss system, Indian meals, meal prep, emotional eating and habits.", [3, 13, 18, 37, 34]),
  make("combo-40-plus", "combo", "Strong After 40 Longevity Pack", "Stay strong, mobile and independent", "Adults over 40: strength, mobility, heart health, everyday function and honest longevity science.", [7, 8, 55, 57, 60, 50]),
  make("combo-health", "combo", "Diabetes & Heart Health Pack", "Exercise and food as medicine", "People managing blood sugar, blood pressure or heart risk — with their doctor.", [53, 55, 13, 58, 9]),
  make("combo-calm", "combo", "Calm Mind & Deep Sleep", "Less anxiety, better sleep, more focus", "Busy, stressed people who want calmer days and deeper nights.", [27, 30, 31, 29, 33]),
  make("combo-coach", "combo", "The Coach's Toolkit", "Programme, coach and keep clients", "Personal trainers and coaches: programming, client psychology, motivation, supplements and injury prevention.", [12, 40, 39, 34, 15, 8]),
];

const SECTION_COPY: Record<string, [string, string]> = {
  "Strength & Physique": ["Every training book we publish", "Lifters at any level — from first session to coaching others."],
  "Nutrition for Performance": ["Eat for results, the Indian way", "Anyone who wants clear, practical nutrition without fads."],
  Yoga: ["From first pose to the Sutras", "Beginners, lifters with tight hips, desk workers and serious practitioners."],
  "Meditation & Breathwork": ["Calm, focus and deep rest", "Anyone who wants a steadier mind and better sleep."],
  "Psychology & Mindset": ["Habits, discipline and resilience", "People who know what to do but struggle to keep doing it."],
  "Health & Lifestyle Medicine": ["Exercise as medicine for real conditions", "Families and adults managing diabetes, PCOS, heart health or ageing."],
  "Performance-Enhancing Drugs": ["The honest, harm-reduction truth", "Lifters, coaches and parents who want facts — no doses, cycles or sources."],
  "Peptides & New Compounds": ["Peptides, GLP-1 and longevity claims, decoded", "Anyone weighing a new compound or medicine and wanting the evidence first."],
};

const SECTIONS: Bundle[] = CATEGORIES.map((cat) => {
  const vols = BOOKS.filter((b) => b.category === cat).map((b) => b.volume);
  const id = `section-${cat.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  const [tagline, forWho] = SECTION_COPY[cat] ?? ["", ""];
  return make(id, "section", `The ${cat} Collection`, tagline, forWho, vols);
});

export const BUNDLES: Bundle[] = [...COMBOS, ...SECTIONS];

export const bundleById = (id: string) => BUNDLES.find((b) => b.id === id);
export const bundlesWithBook = (slug: string) => BUNDLES.filter((b) => b.slugs.includes(slug));
