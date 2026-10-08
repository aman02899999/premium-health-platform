// What a brand-new store starts with. Everything here is editable in Admin → Supplements store.
import type { ShopSettings } from "./types";

export const SHOP_PATH = "/shop";

export const DEFAULT_SETTINGS: ShopSettings = {
  storeName: "Royal Supplements",
  tagline: "Genuine supplements, honest prices — from the team at Royal Fitness Club",
  announcement: "MEGA SALE · Protein 50% OFF · Pre-workout, EAA, BCAA & Glutamine 50% OFF · Tablets 30% OFF",
  heroTitle: "Fuel that",
  heroHighlight: "actually works",
  heroText: "Authentic protein, pre-workouts, aminos and daily essentials — picked by coaches, sold at sale prices, delivered to your door.",
  heroImage: "",
  orderEmail: "",
  phone: "+91 88518 30081",
  whatsapp: "918851830081",
  address: "Main Road, near Gali No. 3, Gejha Village, Sector 93, Noida, Uttar Pradesh 201304",
  fssaiLicence: "",
  gstin: "",
  shippingFee: 0,
  freeShippingOver: 0,
  dispatchText: "Orders are packed within 24 hours and delivered in 2–6 working days.",
  returnPolicy:
    "Sealed, unopened products can be returned within 7 days of delivery. Opened food supplements can't be returned for hygiene reasons. If anything arrives damaged or wrong, WhatsApp us a photo within 48 hours and we'll replace it.",
  seoTitle: "Royal Supplements — Genuine Protein & Supplements Online, Noida",
  seoDescription: "Buy genuine whey protein, pre-workout, EAA, BCAA, creatine and multivitamins online. Sale prices up to 50% off, secure Razorpay checkout, delivery across India.",
};

/** Created with the store. Discounts: protein 50%, pre-workout & aminos 50%, tablets 30%. */
export const DEFAULT_CATEGORIES: { slug: string; name: string; description: string; discountPct: number; sort: number }[] = [
  { slug: "protein", name: "Protein", description: "Whey, isolate and plant protein to hit your daily protein target.", discountPct: 50, sort: 1 },
  { slug: "pre-workout", name: "Pre-Workout", description: "Energy and focus before training.", discountPct: 50, sort: 2 },
  { slug: "amino-acids", name: "EAA, BCAA & Glutamine", description: "Amino acids for training days.", discountPct: 50, sort: 3 },
  { slug: "multivitamins-tablets", name: "Multivitamins & Tablets", description: "Multivitamins, fish oil, and other daily tablets and capsules.", discountPct: 30, sort: 4 },
  { slug: "creatine", name: "Creatine", description: "Creatine monohydrate for strength and power.", discountPct: 0, sort: 5 },
  { slug: "mass-gainer", name: "Mass Gainers", description: "Calorie-dense shakes for people who struggle to eat enough.", discountPct: 0, sort: 6 },
  { slug: "accessories", name: "Accessories", description: "Shakers, gloves, belts and gym gear.", discountPct: 0, sort: 7 },
];

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
