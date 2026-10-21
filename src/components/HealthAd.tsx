"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, ADSENSE_IN_ARTICLE_SLOT } from "@/lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * One in-article AdSense unit. Pass hidden for premium members (Premium is ad-free) and while the
 * sign-in check is still running, so a premium member never sees an ad flash in.
 * The box reserves its height so the page doesn't jump when the ad fills (CLS).
 * Only for /health, /blog and /hi pages: `npm run check:ads` enforces that.
 */
export function HealthAd({ hidden = false, className = "" }: { hidden?: boolean; className?: string }) {
  const pushed = useRef(false);
  useEffect(() => {
    if (hidden || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Blocked by an ad blocker or the script hasn't loaded: the reserved box stays empty.
    }
  }, [hidden]);
  if (hidden) return null;
  return (
    <aside aria-label="Advertisement" className={`my-8 ${className}`}>
      <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-stone-400">Advertisement</p>
      <div style={{ minHeight: 250 }}>
        <ins
          className="adsbygoogle"
          style={{ display: "block", textAlign: "center" }}
          data-ad-layout="in-article"
          data-ad-format="fluid"
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={ADSENSE_IN_ARTICLE_SLOT}
        />
      </div>
    </aside>
  );
}
