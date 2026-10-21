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

export const adsAllowedOn = (path: string) => AD_SECTIONS.test(path) && !NO_AD_PAGES.test(path);
