"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Meta Pixel (free, from Events Manager): page views on every route, plus the Lead and Purchase
 * events the forms send. Renders nothing until NEXT_PUBLIC_META_PIXEL_ID is set. Listed on /privacy.
 */
export function MetaPixel() {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const path = usePathname();
  const first = useRef(true);
  useEffect(() => {
    // The init snippet records the first page view; client-side navigations record the rest.
    if (first.current) {
      first.current = false;
      return;
    }
    (globalThis as { fbq?: (...a: unknown[]) => void }).fbq?.("track", "PageView");
  }, [path]);
  if (!id || !/^\d{5,20}$/.test(id)) return null;
  return (
    <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`}</Script>
  );
}
