"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { GA_ID, gaEnabled, isPrivatePath, isValidGaId } from "@/lib/ga";

/**
 * GA4 page views for the gym site, without an npm package (same approach as VercelAnalytics).
 * Client-side navigations are counted by GA4's enhanced measurement (browser history events).
 * Admin and account pages are never counted: the script isn't loaded there, and if it was loaded
 * on an earlier public page, the ga-disable flag stops hits while the visitor is on them (the flag is
 * set right after the route change, so at most the first click into /admin can slip through).
 * No personal data is sent (see src/analytics-pii.test.ts). Listed on /privacy.
 */
export function GoogleAnalytics() {
  const path = usePathname();
  const priv = isPrivatePath(path);

  useEffect(() => {
    (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = priv;
  }, [priv]);

  if (!gaEnabled() || !isValidGaId(GA_ID) || priv) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');`}</Script>
    </>
  );
}
