// Everything the daily automation can sell, in one list: personal diet plans, workout programmes
// and books from the Premium Library, and library combos. Pure, so captions and images are tested.
//
// Never promoted: the Performance-Enhancing Drugs and Peptides sections (education only; Meta
// restricts accounts that advertise drug content), and any combo that contains one of those books.
import { DIET_PLANS } from "./config";
import { BOOKS, coverSrc, type Book } from "@/lib/library/catalog";
import { BUNDLES, type Bundle } from "@/lib/library/bundles";

export type SaleKind = "diet" | "workout" | "book" | "combo";
export type SaleItem = {
  id: string;
  kind: SaleKind;
  title: string;
  subtitle: string;
  /** Rupees. */
  price: number;
  /** The undiscounted price, shown struck through (combos only: the sum of single prices). */
  listPrice: number | null;
  /** Site path the post links to. */
  path: string;
  /** Public image path (book cover), when there is one. */
  cover: string | null;
  bullets: [string, string, string];
  /** Small label on the image: "52 pages · PDF", "Save ₹1,296". */
  badge: string;
  tags: string[];
  /** Health books: diet and exercise support treatment, never replace it. */
  medical: boolean;
};

const NOT_PROMOTED = new Set(["Performance-Enhancing Drugs", "Peptides & New Compounds"]);
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const DIET_COPY: Record<string, { subtitle: string; bullets: [string, string, string] }> = {
  trial: { subtitle: "Your own diet and workout plan for 7 days", bullets: ["Calories and protein worked out from your body", "7 days of Indian meals in katori and roti measures", "A workout week and a Day-7 review included"] },
  starter: { subtitle: "A 7-day diet chart and workout plan made for you", bullets: ["Built for your goal, food habits and routine", "Matching workouts for the gym or home", "Grocery list and portion guide"] },
  "1m": { subtitle: "A month of coaching to get you started", bullets: ["Your plan plus workouts, made for your body", "Updated at week 2 as you progress", "WhatsApp support for the whole month"] },
  "3m": { subtitle: "Our most chosen plan: 12 weeks, 6 check-ins", bullets: ["Your plan updated every 2 weeks", "Herbs and supplements guidance", "A 12-week roadmap with workouts"] },
  "6m": { subtitle: "Lose it, then keep it off", bullets: ["12 check-ins over 6 months", "A maintenance phase so the weight stays off", "Workouts that progress with you"] },
  premium: { subtitle: "3 months of 1-on-1 coaching", bullets: ["Weekly check-ins with your coach", "A monthly video call", "Priority WhatsApp support"] },
};

const dietItems: SaleItem[] = DIET_PLANS.map((p) => ({
  id: `diet-${p.id}`,
  kind: "diet",
  title: p.name,
  subtitle: DIET_COPY[p.id]?.subtitle ?? p.summary,
  price: p.priceRupees,
  listPrice: null,
  path: `/diet-chart?plan=${p.id}`,
  cover: null,
  bullets: DIET_COPY[p.id]?.bullets ?? [p.summary, "Made for your body by a coach", "Indian food you already eat"],
  badge: p.trial ? "Try it first" : p.months ? `${p.months} month${p.months > 1 ? "s" : ""} · ${p.checkIns} check-ins` : "Diet + workout plan",
  tags: ["DietPlan", "IndianDiet", "PersonalCoach"],
  medical: false,
}));

const promotable = (b: Book) => !NOT_PROMOTED.has(b.category);
const byVolume = new Map(BOOKS.map((b) => [b.volume, b]));

const bookItems: SaleItem[] = BOOKS.filter(promotable).map((b) => ({
  id: `book-${b.slug}`,
  kind: b.category === "Strength & Physique" ? "workout" : "book",
  title: b.title,
  subtitle: b.subtitle,
  price: b.price,
  listPrice: null,
  path: `/library/${b.slug}`,
  cover: coverSrc(b.volume),
  bullets: [b.benefits[0] ?? b.subtitle, b.benefits[1] ?? `${b.pages} pages, ${b.chapters.length} chapters`, b.benefits[2] ?? "Instant PDF download after payment"],
  badge: `Vol. ${b.volume} · ${b.pages} pages · PDF`,
  tags: [b.category === "Strength & Physique" ? "WorkoutPlan" : "FitnessBooks", "RoyalLibrary", b.category.replace(/[^A-Za-z]/g, "")],
  medical: b.category === "Health & Lifestyle Medicine" || b.sensitive,
}));

const comboOk = (c: Bundle) => c.volumes.every((v) => promotable(byVolume.get(v)!));
const comboItems: SaleItem[] = BUNDLES.filter(comboOk).map((c) => {
  const titles = c.volumes.map((v) => byVolume.get(v)!.title);
  return {
    id: `combo-${c.id}`,
    kind: "combo",
    title: c.name,
    subtitle: c.tagline,
    price: c.price,
    listPrice: c.listPrice,
    path: `/library#${c.kind === "combo" ? "combos" : "collections"}`,
    cover: coverSrc(c.volumes[0]),
    bullets: [`${titles.length} books: ${titles[0]}, ${titles[1]}${titles.length > 2 ? " and more" : ""}`, c.forWho.length > 110 ? `${c.forWho.slice(0, 107).trimEnd()}…` : c.forWho, `${inr(c.listPrice - c.price)} less than buying them one by one`],
    badge: `Save ${inr(c.listPrice - c.price)}`,
    tags: ["BookBundle", "RoyalLibrary", "FitnessBooks"],
    medical: c.volumes.some((v) => byVolume.get(v)!.sensitive),
  };
});

/** Every sellable item, alternating diet plan → workout programme → book → combo so no two days look alike. */
export const SALE_ITEMS: SaleItem[] = (() => {
  const queues = [dietItems, bookItems.filter((b) => b.kind === "workout"), bookItems.filter((b) => b.kind === "book"), comboItems].map((q) => [...q]);
  const out: SaleItem[] = [];
  while (queues.some((q) => q.length)) for (const q of queues) if (q.length) out.push(q.shift()!);
  return out;
})();

const DAY_MS = 86_400_000;
const dayNumber = (iso: string) => Math.floor(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / DAY_MS);
const pick = (n: number) => SALE_ITEMS[((n % SALE_ITEMS.length) + SALE_ITEMS.length) % SALE_ITEMS.length];

/** The Instagram Story item for a date: one item a day through the whole catalogue. */
export const storyItem = (date: string) => pick(dayNumber(date));
/**
 * The item for the n-th feed sale post, offset half a cycle from the story rotation. The offset alone
 * can still land on the story's item for some weeks, so when the post's date is known, step past it.
 */
export const feedSaleItem = (n: number, date?: string) => {
  const base = n + Math.floor(SALE_ITEMS.length / 2);
  if (!date) return pick(base);
  // Jump a quarter cycle (outside the run of neighbouring weeks' items), then nudge if still clashing.
  const story = storyItem(date).id;
  for (const step of [0, Math.floor(SALE_ITEMS.length / 4), Math.floor(SALE_ITEMS.length / 4) + 1]) if (pick(base + step).id !== story) return pick(base + step);
  return pick(base);
};

// ---------- Copy ----------

const HOOKS: Record<SaleKind, ((i: SaleItem) => string)[]> = {
  diet: [
    () => "Stop guessing what to eat.",
    () => "Your diet should be made for YOUR body.",
    () => "What if your diet came with a coach?",
    () => "Same food you love. Planned for your goal.",
  ],
  workout: [
    (i) => `${i.title}: the programme, not just exercises.`,
    () => "Training without a plan is just exercising.",
    () => "Know exactly what to do every session.",
  ],
  book: [
    (i) => i.subtitle,
    () => "A coach's notes, in one PDF.",
    (i) => `${i.title}: save this one.`,
  ],
  combo: [
    (i) => `${i.title}: save ${inr((i.listPrice ?? i.price) - i.price)}.`,
    (i) => `${i.subtitle}. Everything in one bundle.`,
  ],
};

export function saleHook(item: SaleItem, n: number): string {
  const list = HOOKS[item.kind];
  return list[((n % list.length) + list.length) % list.length](item);
}

export const priceLine = (i: SaleItem) => (i.listPrice ? `${inr(i.price)} (instead of ${inr(i.listPrice)})` : inr(i.price));

export const MEDICAL_NOTE = "Supports, never replaces, your doctor's advice and medicines.";

export function saleBody(item: SaleItem): string {
  return [`${item.title}: ${item.subtitle}`, item.bullets.map((b) => `✅ ${b}`).join("\n"), `💰 ${priceLine(item)}`, item.medical ? MEDICAL_NOTE : ""].filter(Boolean).join("\n\n");
}

export const saleCta = (i: SaleItem) =>
  i.kind === "diet" ? (i.id === "diet-trial" ? `Start for ${inr(i.price)}` : "Get your plan") : i.kind === "combo" ? "Get the bundle" : i.kind === "workout" ? "Get the programme" : "Get the PDF";

/** A ready-to-film Reel script for an item: hook, four beats with on-screen text, and a caption. */
export function reelScript(item: SaleItem, n: number): string {
  const hook = saleHook(item, n);
  const beats = [
    `0–3s  On screen: "${hook}" (face to camera, or a fast close-up of the ${item.cover ? "book on a phone" : "plan PDF"})`,
    `3–8s  "${item.bullets[0]}."`,
    `8–14s "${item.bullets[1]}."`,
    `14–20s "${item.bullets[2]}."`,
    `20–25s "${item.title}, ${priceLine(item)}. Link in bio." (end on the price)`,
  ];
  return [`REEL: ${item.title}`, ...beats, `Caption: ${hook} ${saleCta(item)} — link in bio.`, "Audio: a trending instrumental; keep your voice over it."].join("\n");
}
