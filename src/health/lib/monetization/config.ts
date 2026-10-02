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

// Amazon Associates tag: set NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG (e.g. "yourtag-21")
// to earn commission. Without it the links are plain Amazon searches.
const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG || "";
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

export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  // affiliate({ ... }),
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
