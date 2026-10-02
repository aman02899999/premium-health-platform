import { DEFAULT_OG_IMAGE } from "@/health/lib/images";

import type {
  AffiliateProduct,
  DigitalProduct,
  PaidGuide,
  PaidPlan,
  Advertisement,
  Sponsor,
  LeadFormConfig,
  BusinessListing,
  Coupon,
  PremiumReport,
} from "./types";

// Amazon Associates store ID (public — it appears in every affiliate link). Override with
// NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG if it ever changes.
const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG || "rfc93-21";
function withAmazonTag(url: string): string {
  return AMAZON_TAG ? `${url}&tag=${encodeURIComponent(AMAZON_TAG)}` : url;
}

const now = new Date().toISOString();
const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const monthFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

// Central monetization config — single source of truth, modular, no hardcoded values in components
// IMPORTANT: Never fabricate prices, ratings, reviews, brands. Use placeholders until genuine data supplied.

// Real affiliate products only — add entries with your own EarnKaro (ekaro.in) or Amazon
// Associates links. Never fabricate prices, ratings or discounts.
//
// To add a product, generate a "profit link" for it in your EarnKaro account (or an Amazon
// Associates link) and add one line to the list below, e.g.:
//
//   affiliate({ title: "Omron HEM-7120 BP Monitor", link: "https://ekaro.in/enkr2024…",
//     merchant: "Amazon", category: "Blood Pressure", tags: ["bp", "monitoring"],
//     why: "Upper-arm monitor that's on the clinically validated lists." }),
//
// Only add links you created yourself — links copied from EarnKaro's public deal pages
// don't carry your account ID, so they earn nothing.
type AffiliateInput = {
  title: string;
  link: string;
  merchant: string;
  category: AffiliateProduct["category"];
  why: string;
  tags?: string[];
  image?: string;
  featured?: boolean;
  priority?: number;
};

function affiliate(p: AffiliateInput): AffiliateProduct {
  const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
  return {
    id: `aff-${slug}`,
    slug,
    title: p.title,
    description: p.why,
    category: p.category,
    image: p.image || DEFAULT_OG_IMAGE,
    price: 0, // live price is on the merchant's page
    currency: "INR",
    affiliateUrl: p.link,
    active: true,
    featured: p.featured ?? false,
    priority: p.priority ?? 50,
    ctaText: `Check price on ${p.merchant}`,
    trackingId: `aff-${slug}`,
    destination: "merchant",
    createdAt: now,
    updatedAt: now,
    tags: p.tags,
    merchant: p.merchant,
    affiliateNetwork: p.link.includes("ekaro.in") || p.link.includes("earnkaro") ? "EarnKaro" : undefined,
    isAffiliate: true,
    disclosure: "Affiliate link — we may earn a commission at no extra cost to you.",
  };
}

/** Amazon search link for an exact product, tagged with our store ID. Swap for a /dp/ link once the ASIN is known. */
const amazon = (query: string) => withAmazonTag(`https://www.amazon.in/s?k=${encodeURIComponent(query).replace(/%20/g, "+")}`);

type AmazonInput = Omit<AffiliateInput, "link" | "merchant"> & { search: string };
const az = (p: AmazonInput) => affiliate({ ...p, link: amazon(p.search), merchant: "Amazon" });

// Premium Health Platform only — affiliate products are never shown on the Royal Fitness Club site.
export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  // ---- Monitoring devices ----
  az({ title: "Omron HEM-7120 Upper-Arm BP Monitor", search: "Omron HEM-7120 blood pressure monitor", category: "Blood Pressure", tags: ["bp", "hypertension", "heart", "monitoring"], featured: true, priority: 100, why: "Upper-arm monitors give more reliable home readings than wrist models. Check the cuff fits your arm." }),
  az({ title: "Omron HEM-7156T Bluetooth BP Monitor (Wide Cuff)", search: "Omron HEM-7156T blood pressure monitor", category: "Blood Pressure", tags: ["bp", "hypertension", "senior", "monitoring"], priority: 90, why: "Wide-range cuff for larger arms, with app sync to share readings with your doctor." }),
  az({ title: "Accu-Chek Instant Glucometer", search: "Accu-Chek Instant glucometer", category: "Diabetes", tags: ["diabetes", "glucometer", "monitoring", "prediabetes"], featured: true, priority: 100, why: "Simple home sugar checks for fasting and post-meal readings. Strip cost is the real running cost — compare it." }),
  az({ title: "OneTouch Select Plus Simple Glucometer", search: "OneTouch Select Plus Simple glucometer", category: "Diabetes", tags: ["diabetes", "glucometer", "monitoring"], priority: 85, why: "Basic, no-frills meter with colour range indicators — easy for elderly parents." }),
  az({ title: "Accu-Chek Instant Test Strips (50)", search: "Accu-Chek Instant test strips 50", category: "Diabetes", tags: ["diabetes", "glucometer"], priority: 80, why: "Refill strips for the Accu-Chek Instant meter. Check the expiry date on delivery." }),
  az({ title: "Digital Thermometer", search: "Omron digital thermometer", category: "Medical Devices", tags: ["fever", "child", "monitoring"], priority: 70, why: "Quick, reliable temperature checks for the whole family." }),
  az({ title: "Fingertip Pulse Oximeter", search: "fingertip pulse oximeter", category: "Medical Devices", tags: ["oxygen", "breathing", "senior", "monitoring"], priority: 65, why: "Spot-checks oxygen saturation and pulse. Low readings or breathlessness need a doctor, not just a device." }),
  az({ title: "Body Composition Smart Scale", search: "body composition smart weighing scale", category: "Weight Management", tags: ["weight", "obesity", "bmi", "fitness"], priority: 75, why: "Tracks weight trends; body-fat numbers are estimates — watch the trend, not one reading." }),
  az({ title: "Digital Kitchen Food Scale", search: "digital kitchen weighing scale 10kg", category: "Nutrition", tags: ["nutrition", "weight", "diet", "protein"], priority: 70, why: "Weighing food for two weeks teaches portion sizes better than any app." }),
  // ---- Fitness & yoga ----
  az({ title: "Yoga Mat 6 mm, Anti-Skid", search: "yoga mat 6mm anti skid", category: "Yoga", tags: ["yoga", "fitness", "back pain"], featured: true, priority: 80, why: "6 mm cushions knees and wrists; anti-skid texture keeps you stable in standing poses." }),
  az({ title: "Yoga Blocks & Strap Set", search: "yoga blocks and strap set", category: "Yoga", tags: ["yoga", "back pain", "flexibility", "senior"], priority: 60, why: "Bring the floor closer — makes poses safe for beginners, stiff backs and seniors." }),
  az({ title: "Resistance Bands Set (Loop + Tube)", search: "resistance bands set loop and tube", category: "Fitness", tags: ["fitness", "home workout", "women", "senior"], priority: 70, why: "A full strength workout at home or while travelling, for every level." }),
  az({ title: "Dumbbell Set for Home", search: "dumbbell set for home gym", category: "Fitness", tags: ["fitness", "strength", "home workout"], priority: 65, why: "Strength training twice a week is one of the best habits for blood sugar, bones and weight." }),
  az({ title: "Skipping Rope with Ball Bearings", search: "skipping rope ball bearing", category: "Fitness", tags: ["fitness", "cardio", "weight"], priority: 50, why: "Cheap, portable cardio. Start with 30-second rounds if you're new." }),
  az({ title: "Foam Roller", search: "foam roller for muscle recovery", category: "Fitness", tags: ["fitness", "recovery", "back pain"], priority: 50, why: "Eases muscle tightness after workouts and long hours at a desk." }),
  az({ title: "Kettlebell 8 kg", search: "kettlebell 8 kg", category: "Fitness", tags: ["fitness", "strength", "home workout"], priority: 45, why: "One bell trains legs, back, grip and cardio — learn the hinge first." }),
  az({ title: "Fitness Band with Heart-Rate Tracking", search: "fitness band heart rate tracker", category: "Fitness", tags: ["fitness", "steps", "heart", "sleep"], priority: 55, why: "Counting steps is the simplest way to move more — aim to beat yesterday." }),
  // ---- Nutrition (well-known, lab-tested brands) ----
  az({ title: "Optimum Nutrition Gold Standard Whey", search: "Optimum Nutrition Gold Standard 100% Whey", category: "Supplements", tags: ["protein", "fitness", "muscle", "nutrition"], featured: true, priority: 75, why: "Convenient protein when food alone falls short. Buy from the brand's official store to avoid fakes." }),
  az({ title: "MuscleBlaze Raw Whey (Unflavoured)", search: "MuscleBlaze Raw Whey Protein unflavoured", category: "Supplements", tags: ["protein", "fitness", "nutrition"], priority: 60, why: "Budget unflavoured whey — mix into lassi, oats or besan chilla." }),
  az({ title: "Creatine Monohydrate (Unflavoured)", search: "creatine monohydrate unflavoured", category: "Supplements", tags: ["fitness", "muscle", "strength"], priority: 55, why: "The most-researched gym supplement: 3–5 g a day. Kidney disease? Ask your doctor first." }),
  az({ title: "Plant Protein Powder", search: "plant protein powder pea protein", category: "Supplements", tags: ["protein", "vegan", "nutrition", "women"], priority: 50, why: "Dairy-free protein option for vegans or people who don't tolerate whey." }),
  az({ title: "Unpolished Millet Combo Pack", search: "unpolished millets combo foxtail kodo little millet", category: "Healthy Foods", tags: ["millets", "diabetes", "weight", "nutrition"], featured: true, priority: 85, why: "Start by swapping half your rice with millets a few times a week." }),
  az({ title: "Ragi (Finger Millet) Flour", search: "ragi flour", category: "Healthy Foods", tags: ["millets", "child", "nutrition", "women"], priority: 55, why: "Calcium-rich flour for rotis, dosa and porridge." }),
  az({ title: "Rolled Oats 1 kg", search: "rolled oats 1kg", category: "Healthy Foods", tags: ["heart", "cholesterol", "fibre", "nutrition"], priority: 60, why: "Soluble fibre (beta-glucan) supports healthy cholesterol as part of a balanced diet." }),
  az({ title: "Roasted Makhana (Plain)", search: "roasted makhana plain", category: "Healthy Foods", tags: ["snacks", "weight", "nutrition"], priority: 45, why: "A light, crunchy swap for namkeen and chips." }),
  az({ title: "Flax Seeds (Alsi)", search: "flax seeds alsi", category: "Healthy Foods", tags: ["heart", "fibre", "women", "nutrition"], priority: 45, why: "Grind before eating — a spoon a day adds fibre and plant omega-3." }),
  // ---- Kitchen & home ----
  az({ title: "Stainless Steel 3-Tier Steamer", search: "stainless steel 3 tier steamer", category: "Healthy Foods", tags: ["cooking", "weight", "fatty liver", "nutrition"], priority: 40, why: "Oil-free idli, dhokla, vegetables and fish." }),
  az({ title: "Air Fryer 4 L", search: "air fryer 4 litre", category: "Weight Management", tags: ["cooking", "weight", "heart"], priority: 45, why: "Crisp snacks with a fraction of the oil — still count the portions." }),
  az({ title: "1-Litre Steel Water Bottle", search: "steel water bottle 1 litre", category: "General Wellness", tags: ["water", "fitness", "wellness"], priority: 35, why: "Keep a bottle in sight and you'll drink more water through the day." }),
  az({ title: "Weekly Pill Organiser", search: "weekly pill organizer box", category: "Senior Health", tags: ["medicines", "senior", "diabetes", "bp"], priority: 55, why: "Stops missed and double doses for anyone on daily medicines." }),
];

// Digital Products — PDFs, eBooks, guides, diet plans
// Paid PDFs are sold through the Premium Library (/library). The demo guides that were
// here had no files behind them, so they were removed.
export const DIGITAL_PRODUCTS: DigitalProduct[] = [];

export const PAID_GUIDES: PaidGuide[] = DIGITAL_PRODUCTS.filter((p) => p.category === "Health Guides") as PaidGuide[];
export const PAID_PLANS: PaidPlan[] = DIGITAL_PRODUCTS.filter((p) => p.category === "Diet Plans").map((p) => ({
  ...(p as DigitalProduct),
  guideType: "health-guide",
  planType: p.slug.includes("30-day") ? "30-day" : p.slug.includes("high-protein") ? "high-protein" : "custom",
  durationDays: p.slug.includes("30-day") ? 30 : p.slug.includes("7-day") ? 7 : 14,
})) as unknown as PaidPlan[];

// Advertisements — placeholders, clearly marked
export const ADVERTISEMENTS: Advertisement[] = [
  {
    id: "ad-home-top",
    slug: "ad-home-top",
    title: "Homepage Top Banner — Placeholder",
    description: "Advertisement placeholder — editorial content never influenced by advertisers.",
    category: "General Wellness",
    image: "/health/og-default.jpg",
    price: 0,
    currency: "INR",
    active: true,
    featured: false,
    priority: 100,
    ctaText: "Advertisement",
    trackingId: "ad-home-top",
    destination: "ad",
    createdAt: now,
    updatedAt: now,
    placement: "homepage_top",
    adType: "banner",
    width: 728,
    height: 90,
  },
  {
    id: "ad-disease-middle",
    slug: "ad-disease-middle",
    title: "Disease Middle In-Article — Placeholder",
    description: "Advertisement placeholder — clearly labeled.",
    category: "General Wellness",
    image: "/health/og-default.jpg",
    price: 0,
    currency: "INR",
    active: true,
    featured: false,
    priority: 90,
    ctaText: "Advertisement",
    trackingId: "ad-disease-middle",
    destination: "ad",
    createdAt: now,
    updatedAt: now,
    placement: "disease_middle",
    adType: "in-article",
    width: 300,
    height: 250,
  },
  {
    id: "ad-article-bottom",
    slug: "ad-article-bottom",
    title: "Article Bottom Rectangle — Placeholder",
    description: "Advertisement placeholder.",
    category: "General Wellness",
    image: "/health/og-default.jpg",
    price: 0,
    currency: "INR",
    active: true,
    featured: false,
    priority: 80,
    ctaText: "Advertisement",
    trackingId: "ad-article-bottom",
    destination: "ad",
    createdAt: now,
    updatedAt: now,
    placement: "article_bottom",
    adType: "rectangle",
    width: 300,
    height: 250,
  },
  {
    id: "ad-products-sidebar",
    slug: "ad-products-sidebar",
    title: "Products Sidebar — Placeholder",
    description: "Advertisement placeholder for products sidebar.",
    category: "General Wellness",
    image: "/health/og-default.jpg",
    price: 0,
    currency: "INR",
    active: true,
    featured: false,
    priority: 70,
    ctaText: "Advertisement",
    trackingId: "ad-products-sidebar",
    destination: "ad",
    createdAt: now,
    updatedAt: now,
    placement: "products_sidebar",
    adType: "sidebar",
    width: 300,
    height: 600,
  },
];

// Sponsors
// Real sponsors only — the demo sponsors (made-up companies) were removed.
export const SPONSORS: Sponsor[] = [];

// Lead Forms
export const LEAD_FORMS: LeadFormConfig[] = [
  {
    id: "lead-diet",
    title: "Diet Consultation Inquiry",
    description: "Connect with a qualified dietitian/nutritionist for personalized guidance.",
    service: "diet-consultation",
    fields: ["name", "email", "phone", "service", "message", "consent"],
    active: true,
    ctaText: "Request Diet Consultation",
    successMessage: "Thanks! A qualified professional will contact you within 24 hours.",
    createdAt: now,
  },
  {
    id: "lead-fitness",
    title: "Fitness Consultation",
    description: "Fitness coach inquiry — strength, weight management, general wellness.",
    service: "fitness-consultation",
    fields: ["name", "email", "phone", "service", "message", "consent"],
    active: true,
    ctaText: "Request Fitness Consultation",
    successMessage: "Thanks! We'll connect you with a fitness professional.",
    createdAt: now,
  },
  {
    id: "lead-corporate",
    title: "Corporate Wellness Inquiry",
    description: "Corporate wellness programs, health talks, screenings.",
    service: "corporate-wellness",
    fields: ["name", "email", "phone", "service", "message", "consent"],
    active: true,
    ctaText: "Inquire for Corporate Wellness",
    successMessage: "Thanks! Our partnerships team will reach out.",
    createdAt: now,
  },
];

// Business Listings / Providers
// Real, verified providers only — the demo dietitian/yoga/clinic listings were removed.
export const BUSINESS_LISTINGS: BusinessListing[] = [];

// Coupons / Deals
// Real coupons only — the demo coupons pointed at products that never existed.
export const COUPONS: Coupon[] = [];

// Premium Reports — calculator upsell
// Real paid reports only — the demo reports had no delivery behind them.
export const PREMIUM_REPORTS: PremiumReport[] = [];

// Helper: get active sponsors (auto-hide expired)
export function getActiveSponsors(): Sponsor[] {
  const nowTs = Date.now();
  return SPONSORS.filter((s) => {
    if (!s.active) return false;
    const start = new Date(s.startDate).getTime();
    const end = new Date(s.endDate).getTime();
    return nowTs >= start && nowTs <= end;
  }).sort((a, b) => b.priority - a.priority);
}

// Helper: get active coupons (auto-mark expired)
export function getActiveCoupons(): Coupon[] {
  const nowTs = Date.now();
  return COUPONS.filter((c) => {
    if (!c.active) return false;
    const exp = new Date(c.expirationDate).getTime();
    return exp > nowTs;
  }).sort((a, b) => b.priority - a.priority);
}

// Helper: get expired coupons
export function getExpiredCoupons(): Coupon[] {
  const nowTs = Date.now();
  return COUPONS.filter((c) => new Date(c.expirationDate).getTime() <= nowTs);
}

// Helper: affiliate by category — accepts any string for flexibility (blog categories etc.)
export function getAffiliateByCategory(category: string, limit = 4): AffiliateProduct[] {
  const catLower = category.toLowerCase();
  return AFFILIATE_PRODUCTS.filter((p) => p.active && (p.category.toLowerCase() === catLower || p.category === category || p.tags?.some((t) => t.toLowerCase() === catLower) || p.tags?.includes(category.toLowerCase())))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

// Helper: digital products by category
export function getDigitalByCategory(category: string, limit = 4): DigitalProduct[] {
  return DIGITAL_PRODUCTS.filter((p) => p.active && (p.category === category || p.tags?.includes(category.toLowerCase())))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

/**
 * Resolves a real product photograph for a slug used by editorial or store pages.
 *
 * Returns null when the slug has no dedicated photograph (as opposed to the
 * generic OG placeholder), so callers can keep their own fallback UI rather than
 * showing the branded OG graphic in a product slot.
 */
export function getProductImageForSlug(slug: string): string | null {
  const affiliate = AFFILIATE_PRODUCTS.find((p) => p.slug === slug);
  if (affiliate?.image && affiliate.image !== DEFAULT_OG_IMAGE) return affiliate.image;

  const digital = DIGITAL_PRODUCTS.find((p) => p.slug === slug);
  if (digital?.image && digital.image !== DEFAULT_OG_IMAGE) return digital.image;

  return null;
}
