// Validation for everything the admin saves. Pure: returns a message or the clean value.
import { DEFAULT_SETTINGS, slugify } from "./defaults";
import type { Category, Combo, NutritionRow, Post, Product, ShopSettings } from "./types";

type R = Record<string, unknown>;
const t = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const n = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN);
const int = (v: unknown, lo: number, hi: number): number | null => {
  const x = n(v);
  return Number.isInteger(x) && x >= lo && x <= hi ? x : null;
};
const list = (v: unknown, maxItems: number, maxLen: number) =>
  (Array.isArray(v) ? v : typeof v === "string" ? v.split(/\n|,/) : [])
    .map((x) => (typeof x === "string" ? x.trim().slice(0, maxLen) : ""))
    .filter(Boolean)
    .slice(0, maxItems);
const uuid = (v: unknown) => (typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ? v : undefined);
const url = (v: unknown) => {
  const s = t(v, 500);
  return s && (/^https:\/\//.test(s) || /^\/[^/]/.test(s)) ? s : null;
};
const slugOf = (v: unknown, fallback: string, max: number) => {
  const s = slugify(t(v, max) || fallback).slice(0, max);
  return s.length >= 2 ? s : "";
};
const seo = (b: R) => ({ seoTitle: t(b.seoTitle, 70) || null, seoDescription: t(b.seoDescription, 170) || null });

export function parseProduct(b: R): (Omit<Product, "updatedAt" | "id"> & { id?: string }) | string {
  const name = t(b.name, 120);
  if (name.length < 2) return "Enter the product name.";
  const slug = slugOf(b.slug, name, 80);
  if (!slug) return "The URL name must have letters or numbers.";
  const listPrice = int(b.listPrice, 1, 1_000_000);
  if (listPrice === null) return "Enter the real price in whole rupees.";
  const discountPct = b.discountPct === null || b.discountPct === "" || b.discountPct === undefined ? null : int(b.discountPct, 0, 90);
  if (discountPct === null && b.discountPct !== null && b.discountPct !== "" && b.discountPct !== undefined) return "Discount must be 0–90%, or empty to use the category discount.";
  const stock = int(b.stock, 0, 1_000_000);
  if (stock === null) return "Enter stock as a whole number (0 or more).";
  const nutrition: NutritionRow[] = (Array.isArray(b.nutrition) ? b.nutrition : [])
    .map((r) => ({ label: t((r as R)?.label, 60), value: t((r as R)?.value, 60) }))
    .filter((r) => r.label && r.value)
    .slice(0, 30);
  return {
    id: uuid(b.id),
    slug,
    name,
    brand: t(b.brand, 60),
    categoryId: uuid(b.categoryId) ?? null,
    sku: t(b.sku, 60) || null,
    listPrice,
    discountPct,
    stock,
    size: t(b.size, 60),
    flavours: list(b.flavours, 20, 60),
    images: list(b.images, 12, 500).filter((u) => url(u)),
    shortDescription: t(b.shortDescription, 300),
    description: t(b.description, 20000),
    highlights: list(b.highlights, 12, 160),
    nutrition,
    howToUse: t(b.howToUse, 2000),
    warnings: t(b.warnings, 2000),
    featured: b.featured === true,
    active: b.active !== false,
    ...seo(b),
  };
}

export function parseCategory(b: R): (Omit<Category, "id"> & { id?: string }) | string {
  const name = t(b.name, 60);
  if (name.length < 2) return "Enter the category name.";
  const slug = slugOf(b.slug, name, 60);
  if (!slug) return "The URL name must have letters or numbers.";
  const discountPct = int(b.discountPct, 0, 90);
  if (discountPct === null) return "Discount must be a whole number from 0 to 90.";
  return { id: uuid(b.id), slug, name, description: t(b.description, 600), discountPct, sort: int(b.sort, -1000, 1000) ?? 0, image: url(b.image), active: b.active !== false, ...seo(b) };
}

export function parseCombo(b: R): (Omit<Combo, "id" | "updatedAt"> & { id?: string }) | string {
  const name = t(b.name, 120);
  if (name.length < 2) return "Enter the combo name.";
  const slug = slugOf(b.slug, name, 80);
  if (!slug) return "The URL name must have letters or numbers.";
  const seen = new Set<string>();
  const items = (Array.isArray(b.items) ? b.items : [])
    .map((x) => ({ productId: uuid((x as R)?.productId) ?? "", qty: int((x as R)?.qty, 1, 10) ?? 1 }))
    .filter((x) => x.productId && !seen.has(x.productId) && seen.add(x.productId));
  if (items.length < 2) return "A combo needs at least 2 different products.";
  const extraPct = int(b.extraPct, 0, 50);
  if (extraPct === null) return "Extra combo discount must be 0–50%.";
  return { id: uuid(b.id), slug, name, description: t(b.description, 2000), image: url(b.image), items: items.slice(0, 10), extraPct, featured: b.featured === true, active: b.active !== false };
}

export function parsePost(b: R): (Omit<Post, "id" | "createdAt" | "updatedAt"> & { id?: string }) | string {
  const title = t(b.title, 140);
  if (title.length < 5) return "Enter a title (at least 5 characters).";
  const slug = slugOf(b.slug, title, 100);
  if (!slug) return "The URL name must have letters or numbers.";
  const body = t(b.body, 60000);
  if (body.length < 20) return "Write the article body.";
  return { id: uuid(b.id), slug, title, excerpt: t(b.excerpt, 400), body, cover: url(b.cover), categorySlug: t(b.categorySlug, 60) || null, tags: list(b.tags, 10, 40), published: b.published !== false, ...seo(b) };
}

export function parseSettings(b: R): ShopSettings | string {
  const s: ShopSettings = { ...DEFAULT_SETTINGS };
  for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof ShopSettings)[]) {
    if (k === "shippingFee" || k === "freeShippingOver") continue;
    if (b[k] !== undefined) (s as Record<string, unknown>)[k] = t(b[k], k === "returnPolicy" ? 2000 : k === "heroText" ? 400 : 300);
  }
  const fee = int(b.shippingFee, 0, 5000);
  const free = int(b.freeShippingOver, 0, 1_000_000);
  if (fee === null || free === null) return "Delivery charge and free-delivery amount must be whole rupees.";
  s.shippingFee = fee;
  s.freeShippingOver = free;
  if (s.storeName.length < 2) return "Enter the store name.";
  if (s.orderEmail && !s.orderEmail.split(",").every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()))) return "Order email: enter valid email addresses separated by commas.";
  s.whatsapp = s.whatsapp.replace(/\D/g, "");
  if (s.fssaiLicence && !/^\d{14}$/.test(s.fssaiLicence.replace(/\s/g, ""))) return "An FSSAI licence number has 14 digits.";
  if (s.gstin && !/^[0-9]{2}[A-Z0-9]{13}$/.test(s.gstin.toUpperCase())) return "A GSTIN has 15 characters, e.g. 09ABCDE1234F1Z5.";
  s.gstin = s.gstin.toUpperCase();
  s.fssaiLicence = s.fssaiLicence.replace(/\s/g, "");
  if (s.heroImage && !url(s.heroImage)) return "Hero image must be an https:// link or an uploaded image.";
  return s;
}
