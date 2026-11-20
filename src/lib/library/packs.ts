import { BOOKS, type Book } from "./catalog";
import { priceCart, type PriceTable } from "./cart";
import { priceTable } from "./pricing";

// Five-book packs promoted in the library videos (YouTube, Reels). A pack is not a bundle with its
// own price: it is five loose books, so the cart's normal multi-buy discount (30% for 5) applies
// and the price said in a video is exactly what checkout charges. Each pack has a short link,
// /library/pack/<id>, that fills the visitor's cart and opens checkout.

export type Pack = { id: string; name: string; volumes: number[]; slugs: string[] };

const byVolume = new Map(BOOKS.map((b) => [b.volume, b]));

function pack(id: string, name: string, volumes: number[]): Pack {
  const books = volumes.map((v) => byVolume.get(v)).filter((b): b is Book => Boolean(b));
  if (books.length !== volumes.length) throw new Error(`Pack ${id} names a missing volume`);
  return { id, name, volumes, slugs: books.map((b) => b.slug) };
}

export const PACKS: Pack[] = [
  pack("beginner", "Gym Beginner Start", [65, 1, 5, 57, 52]),
  pack("muscle", "Muscle & Strength", [2, 4, 10, 51, 11]),
  pack("fat-loss", "Fat Loss, Women & 40+", [3, 6, 7, 8, 9]),
  pack("indian-food", "Indian Food & Protein", [13, 14, 62, 63, 18]),
  pack("smart-nutrition", "Smart Nutrition", [15, 16, 17, 58, 59]),
  pack("yoga", "Yoga Start", [19, 20, 21, 22, 23]),
  pack("calm-sleep", "Calm Mind & Deep Sleep", [27, 28, 29, 30, 31]),
  pack("habits", "Habits, Discipline & Focus", [34, 35, 37, 42, 33]),
  pack("health", "Health Conditions", [53, 54, 55, 60, 64]),
  pack("mind", "Mind & Confidence", [36, 38, 39, 40, 41]),
];

export const packById = (id: string) => PACKS.find((p) => p.id === id);

/** List price and checkout price in rupees, from the same cart maths checkout uses. */
export function packPrice(p: Pack, table: PriceTable = priceTable()): { list: number; price: number } {
  const q = priceCart(p.slugs, table);
  if (!q) throw new Error(`Pack ${p.id} can't be priced`);
  return { list: q.subtotal, price: q.total };
}

export type Utm = { source: string; medium: string; campaign: string };

/** /library/checkout?add=<slugs>&utm_* — the page adds the books to the cart. */
export function packCheckoutPath(p: Pack, utm?: Utm): string {
  const q = new URLSearchParams({ add: p.slugs.join(",") });
  if (utm) {
    q.set("utm_source", utm.source);
    q.set("utm_medium", utm.medium);
    q.set("utm_campaign", utm.campaign);
    q.set("utm_content", p.id);
  }
  return `/library/checkout?${q.toString().replace(/%2C/g, ",")}`;
}
