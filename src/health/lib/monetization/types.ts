// Central monetization types — modular, extensible, privacy-conscious
// Do NOT store unnecessary personal health info with monetization events

export type Currency = "INR" | "USD";
export type MonetizationCategory =
  | "Diabetes"
  | "Blood Pressure"
  | "Heart Health"
  | "Weight Management"
  | "Fitness"
  | "Nutrition"
  | "Ayurveda"
  | "Yoga"
  | "Women's Health"
  | "Men's Health"
  | "Senior Health"
  | "Medical Devices"
  | "Books"
  | "Healthy Foods"
  | "Supplements"
  | "General Wellness"
  | "Health Guides"
  | "Diet Plans"
  | "Recipe Books"
  | "Lab Tests"
  | "Calculators";

export interface BaseMonetizationItem {
  id: string;
  title: string;
  description: string;
  category: MonetizationCategory;
  image: string; // /og-default or placeholder until real
  price: number;
  originalPrice?: number;
  currency: Currency;
  affiliateUrl?: string;
  purchaseUrl?: string;
  paymentUrl?: string;
  externalUrl?: string;
  sponsorName?: string;
  disclosure?: string;
  active: boolean;
  featured: boolean;
  priority: number; // higher = more prominent
  ctaText: string;
  trackingId?: string;
  destination?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  tags?: string[];
  slug: string;
}

// Affiliate Products
export interface AffiliateProduct extends BaseMonetizationItem {
  merchant: string;
  rating?: number; // 0-5, only if legitimately available, else undefined
  ratingCount?: number;
  discountPercent?: number; // computed or explicit, never fabricated
  affiliateNetwork?: string;
  isAffiliate: true;
}

// Digital Products (PDFs, eBooks, guides, diet plans)
export interface DigitalProduct extends BaseMonetizationItem {
  fileUrl?: string; // private, never exposed directly
  fileSize?: string; // e.g., "2.4 MB"
  pages?: number;
  previewUrl?: string;
  format: "PDF" | "EPUB" | "ZIP" | "VIDEO";
  author?: string;
  isDigital: true;
  downloadLimit?: number;
  expiresInHours?: number;
}

// Paid Guides / Plans are specializations of DigitalProduct
export type PaidGuide = DigitalProduct & { guideType: "health-guide" | "nutrition-guide" | "ayurveda-guide" | "fitness-guide" | "checklist" | "workbook" };
export type PaidPlan = DigitalProduct & { planType: "7-day" | "14-day" | "30-day" | "vegetarian" | "non-vegetarian" | "high-protein" | "weight-management" | "sports" | "custom"; durationDays: number };

// Advertisements
export type AdPlacement =
  | "homepage_top"
  | "homepage_middle"
  | "disease_top"
  | "disease_middle"
  | "disease_bottom"
  | "article_top"
  | "article_middle"
  | "article_bottom"
  | "products_sidebar"
  | "footer"
  | "store_top"
  | "newsletter_inline"
  | "calculator_results";

export interface Advertisement extends BaseMonetizationItem {
  placement: AdPlacement;
  adType: "banner" | "rectangle" | "in-article" | "sidebar" | "sponsored-card";
  imageUrl?: string;
  htmlContent?: string; // sanitized placeholder
  width?: number;
  height?: number;
}

// Sponsors
export interface Sponsor {
  id: string;
  sponsorName: string;
  campaign: string;
  description: string;
  logo?: string;
  placement: AdPlacement | "global" | "newsletter" | "category";
  ctaText: string;
  url: string;
  startDate: string; // ISO
  endDate: string; // ISO
  active: boolean;
  priority: number;
  disclosure: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// Lead Forms
export interface LeadFormConfig {
  id: string;
  title: string;
  description: string;
  service: "diet-consultation" | "fitness-consultation" | "wellness-consultation" | "health-package" | "clinic-inquiry" | "corporate-wellness" | "general";
  fields: ("name" | "email" | "phone" | "service" | "message" | "consent")[];
  active: boolean;
  ctaText: string;
  successMessage: string;
  destinationEmail?: string;
  createdAt: string;
}

// Business Listings / Providers
export type ProviderType = "Dietitian" | "Nutritionist" | "Fitness Coach" | "Yoga Instructor" | "Clinic" | "Diagnostic Center" | "Wellness Business";
export type ListingTier = "free" | "featured" | "premium";

export interface BusinessListing extends BaseMonetizationItem {
  providerType: ProviderType;
  tier: ListingTier;
  location?: string;
  phone?: string;
  email?: string;
  website?: string;
  verified: boolean;
  credentials?: string; // never fabricated
}

// Coupons / Deals
export interface Coupon extends BaseMonetizationItem {
  code: string;
  discount: string; // e.g., "20% OFF" or "₹200 OFF"
  discountPercent?: number;
  discountAmount?: number;
  merchant: string;
  affiliateUrl: string;
  expirationDate: string; // ISO
  isExpired?: boolean;
  terms?: string;
}

// Premium Reports (calculator upsell)
export interface PremiumReport extends BaseMonetizationItem {
  calculatorType: "bmi" | "calorie" | "body-fat" | "bmr" | "protein" | "heart-risk" | "diabetes-risk" | "custom";
  includes: string[]; // what report contains
}

// Orders & Purchases
export type OrderStatus = "pending" | "paid" | "failed" | "refunded" | "expired";
export interface Order {
  id: string;
  productId: string;
  productType: "digital" | "affiliate" | "report" | "plan";
  amount: number;
  currency: Currency;
  status: OrderStatus;
  paymentProvider: string;
  paymentId?: string;
  downloadToken?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  email?: string; // minimal PII
  attribution?: {
    page: string;
    source?: string;
    campaign?: string;
    cta?: string;
    utm?: Record<string, string>;
  };
}

// Analytics Events — privacy-conscious, no unnecessary health info
export type MonetizationEventType =
  | "affiliate_product_view"
  | "affiliate_product_click"
  | "digital_product_view"
  | "checkout_started"
  | "purchase_completed"
  | "download_started"
  | "lead_submitted"
  | "coupon_clicked"
  | "sponsor_clicked"
  | "newsletter_signup"
  | "calculator_completed"
  | "premium_report_purchase"
  | "ad_impression"
  | "ad_click"
  | "cta_click";

export interface MonetizationEvent {
  id: string;
  type: MonetizationEventType;
  productId?: string;
  page: string;
  campaign?: string;
  source?: string;
  cta?: string;
  timestamp: string;
  // minimal attribution, no sensitive health data
  utm?: { source?: string; medium?: string; campaign?: string; content?: string; term?: string };
}
