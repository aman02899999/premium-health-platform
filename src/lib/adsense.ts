import { isThinContentPath } from "@/health/lib/content-quality";

// Google AdSense for the health and blog sections only. The publisher ID is public by design;
// it also has to match public/ads.txt. Auto ads are OFF in AdSense: ads appear only where a
// <HealthAd /> unit is placed, and the script loads only in the sections listed in AD_SECTIONS.
export const ADSENSE_CLIENT = "ca-pub-3250882336328071";
export const ADSENSE_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
/** The in-article unit (fluid, layout "in-article"). */
export const ADSENSE_IN_ARTICLE_SLOT = "9498747260";

/** Sections where the ad script may load. */
export const AD_SECTIONS = /^\/(health|blog|hi\/health|hi\/blog)(\/|$)/;

/** Pages inside those sections that never load it: sign-in, account, checkout, admin and payment pages. */
export const NO_AD_PAGES = /^\/(hi\/)?health\/(login|register|auth|profile|admin|orders|my-purchases|download|earn|premium|store|products|checkout|pay|lead|referral)(\/|$)/;

/**
 * Gym blog posts people read while choosing a gym. An ad there could be a rival gym's, shown to
 * someone about to pick ours, so these stay ad-free like the membership pages.
 */
export const GYM_CHOICE_POSTS = new Set([
  "gym-fees-in-noida-membership-cost-guide",
  "best-gym-in-sector-93-noida-checklist",
  "sector-93-noida-mein-gym-kaise-chune",
  "couple-gym-membership-noida-train-together",
  "gym-for-women-noida-beginners-guide",
]);
const isGymChoicePost = (path: string) => {
  const m = /^\/(?:hi\/)?blog\/([^/]+)\/?$/.exec(path);
  return !!m && GYM_CHOICE_POSTS.has(m[1]);
};

/** Thin pages (template diseases, short reference pages) are noindex until rewritten. No ad script
 * there either, so the AdSense review never counts them as pages we monetise. */
export const adsAllowedOn = (path: string) =>
  AD_SECTIONS.test(path) && !NO_AD_PAGES.test(path) && !isThinContentPath(path) && !isGymChoicePost(path);
