"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { ADSENSE_SRC, adsAllowedOn } from "@/lib/adsense";

/**
 * Loads adsbygoogle.js, only on health and blog pages (never sign-in, checkout or admin pages).
 * Only placed in the /health, /blog and /hi layouts; `npm run check:ads` fails the build if it
 * shows up anywhere else.
 */
export function AdsenseScript() {
  const path = usePathname() ?? "";
  if (!adsAllowedOn(path)) return null;
  return <Script id="adsbygoogle-js" strategy="afterInteractive" crossOrigin="anonymous" src={ADSENSE_SRC} />;
}
