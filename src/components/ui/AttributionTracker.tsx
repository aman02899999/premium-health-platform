"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ATTRIBUTION_COOKIE, ATTRIBUTION_DAYS, mergeTouch, parseAttribution, serializeAttribution, touchFrom } from "@/lib/attribution";

/**
 * Remembers where a visitor came from (UTM tags, referring site, landing page) in a first-party
 * cookie, so a lead or an order placed days later can be credited to the campaign that brought
 * them. Keeps the first touch and the latest one; stores no personal data. Listed on /privacy.
 */
export function AttributionTracker() {
  const path = usePathname();
  useEffect(() => {
    try {
      const current = document.cookie.match(new RegExp(`(?:^|;\\s*)${ATTRIBUTION_COOKIE}=([^;]*)`))?.[1];
      const next = mergeTouch(parseAttribution(current), touchFrom(new URL(window.location.href), document.referrer, window.location.hostname));
      if (!next) return;
      const value = serializeAttribution(next);
      if (value === current) return;
      document.cookie = `${ATTRIBUTION_COOKIE}=${value}; Max-Age=${ATTRIBUTION_DAYS * 86400}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    } catch {
      /* attribution is best-effort and must never break the page */
    }
  }, [path]);
  return null;
}
