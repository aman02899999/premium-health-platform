/**
 * Static fallbacks and helpers for product imagery.
 *
 * The key rule: never emit a query string for local static assets. Static files
 * served from /public are already fingerprinted by path, and a `?v=` suffix would
 * defeat the long-lived immutable Cache-Control headers set in next.config.ts.
 */

/** Single source of truth for the placeholder image. */
export const DEFAULT_OG_IMAGE = "/og-default.jpg";

/**
 * Real, generic, non-branded product photography shipped in /public/products.
 * Keys match the slugs used by AFFILIATE_PRODUCTS / DIGITAL_PRODUCTS in
 * src/lib/monetization/config.ts.
 */
export const PRODUCT_IMAGES = {
  milletCombo: "/products/millet-combo.jpg",
  glucometer: "/products/glucometer.jpg",
  bpMonitor: "/products/bp-monitor.jpg",
  yogaMat: "/products/yoga-mat.jpg",
  wheyProtein: "/products/whey-protein.jpg",
  mustardOil: "/products/mustard-oil.jpg",
  ayurvedicHerbs: "/products/ayurvedic-herbs.jpg",
  diabetesGuide: "/products/diabetes-guide.jpg",
  weightManagement: "/products/weight-management.jpg",
} as const;

/**
 * Normalises a product image reference for rendering.
 *
 * - Falls back to the static OG image when the value is missing or malformed.
 * - Strips any query string so local static assets stay CDN/immutable-cacheable.
 * - Accepts absolute https URLs (remote, allow-listed in next.config.ts) or
 *   root-relative local paths.
 */
export function getProductImageUrl(image?: string | null): string {
  if (!image) return DEFAULT_OG_IMAGE;

  const trimmed = image.trim();
  if (!trimmed) return DEFAULT_OG_IMAGE;

  // Drop query strings — local statics must not carry cache-busting params.
  const withoutQuery = trimmed.split("?")[0];
  if (!withoutQuery) return DEFAULT_OG_IMAGE;

  const isAbsoluteHttps = /^https:\/\//i.test(withoutQuery);
  const isLocal = withoutQuery.startsWith("/");

  if (!isAbsoluteHttps && !isLocal) return DEFAULT_OG_IMAGE;

  return withoutQuery;
}

/** Curated real-photography library (Pexels, free licence). */
export const IMG = {
  heroDoctor:
    "https://images.pexels.com/photos/7579831/pexels-photo-7579831.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  heroDoctorAlt: "Indian doctor in a warm consultation with a patient in a bright modern clinic",
  clinicSenior:
    "https://images.pexels.com/photos/18870282/pexels-photo-18870282.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  ayurvedaSpices:
    "https://images.pexels.com/photos/31280796/pexels-photo-31280796.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  ayurvedaSpicesAlt: "Colourful Ayurvedic spices and herbs in bowls on a dark premium background",
  yogaWater:
    "https://images.pexels.com/photos/32629853/pexels-photo-32629853.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  yogaWaterAlt: "Woman practising yoga outdoors by serene water at sunrise",
  elderlyYoga:
    "https://images.pexels.com/photos/8940484/pexels-photo-8940484.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  thali:
    "https://images.pexels.com/photos/29148133/pexels-photo-29148133.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  thaliAlt: "Traditional Indian thali with dal, sabzi, paneer and whole grains",
  thaliFestive:
    "https://images.pexels.com/photos/8818657/pexels-photo-8818657.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  doctorConsult:
    "https://images.pexels.com/photos/7579823/pexels-photo-7579823.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  meditationPark:
    "https://images.pexels.com/photos/8940618/pexels-photo-8940618.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
} as const;
