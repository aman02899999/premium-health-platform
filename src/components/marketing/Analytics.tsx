"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Pro digital marketing optimized:
 * - Google Analytics (GA4) placeholder — env NEXT_PUBLIC_GA_ID
 * - Facebook Pixel placeholder — env NEXT_PUBLIC_FB_PIXEL_ID
 * - UTM tracking + session storage
 * - Affiliate click tracking
 * - Scroll depth + time on page
 * - Web Vitals placeholder
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // UTM capture
  useEffect(() => {
    if (!searchParams) return;
    const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "fbclid", "gclid"];
    const captured: Record<string, string> = {};
    let hasUtm = false;
    for (const k of utmKeys) {
      const v = searchParams.get(k);
      if (v) {
        captured[k] = v;
        hasUtm = true;
      }
    }
    if (hasUtm) {
      try {
        localStorage.setItem("bhg-utm", JSON.stringify({ ...captured, ts: Date.now(), landing: pathname }));
        sessionStorage.setItem("bhg-utm-session", JSON.stringify(captured));
      } catch {}
      // Push to dataLayer
      if (typeof window !== "undefined") {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: "utm_captured", ...captured });
      }
    }
  }, [searchParams, pathname]);

  // Pageview tracking
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    // GA4
    if (window.gtag) {
      window.gtag("event", "page_view", { page_path: url });
    }
    // FB Pixel
    if (window.fbq) {
      window.fbq("track", "PageView");
    }
    // Custom
    try {
      const logs = JSON.parse(localStorage.getItem("bhg-pageviews") || "[]");
      logs.push({ url, ts: Date.now() });
      localStorage.setItem("bhg-pageviews", JSON.stringify(logs.slice(-100)));
    } catch {}
  }, [pathname, searchParams]);

  // Scroll depth
  useEffect(() => {
    if (typeof window === "undefined") return;
    let maxScroll = 0;
    const onScroll = () => {
      const scrolled = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      if (scrolled > maxScroll && scrolled % 25 === 0) {
        maxScroll = scrolled;
        window.gtag?.("event", "scroll_depth", { percent: scrolled, page_path: pathname });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return (
    <>
      {/* GA4 */}
      {process.env.NEXT_PUBLIC_GA_ID ? (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { send_page_view: false });
              `,
            }}
          />
        </>
      ) : (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              console.log('[Analytics] GA_ID not set — using console mode');
            `,
          }}
        />
      )}
      {/* FB Pixel placeholder */}
      {process.env.NEXT_PUBLIC_FB_PIXEL_ID ? (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
          }}
        />
      ) : null}
    </>
  );
}

// Affiliate click tracking hook
export function trackAffiliateClick(productSlug: string, merchant?: string) {
  if (typeof window === "undefined") return;
  const utm = (() => {
    try {
      return JSON.parse(localStorage.getItem("bhg-utm") || "{}");
    } catch {
      return {};
    }
  })();
  window.gtag?.("event", "affiliate_click", {
    product: productSlug,
    merchant,
    ...utm,
  });
  window.fbq?.("track", "ViewContent", { content_name: productSlug });
  try {
    const clicks = JSON.parse(localStorage.getItem("bhg-aff-clicks") || "[]");
    clicks.push({ productSlug, merchant, ts: Date.now(), utm });
    localStorage.setItem("bhg-aff-clicks", JSON.stringify(clicks.slice(-200)));
  } catch {}
}
