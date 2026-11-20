"use client";

import { useEffect } from "react";
import { contactMethod } from "@/lib/contact-click";
import { isPrivatePath } from "@/lib/ga";
import { trackPixel } from "@/lib/meta-pixel";

/**
 * Counts taps on call and WhatsApp buttons anywhere on the gym site, as a GA4 "contact_click"
 * event and a Meta Pixel "Contact" event. These are the main thing paid ads are meant to produce,
 * and without this the site could only report form leads. One listener covers every button,
 * including ones added from the admin, so no button needs its own code.
 * Only the method (call / whatsapp) and the page are sent, never the number. Both tools are
 * no-ops until their IDs are set. Admin and account pages are skipped. Listed on /privacy.
 */
export function ContactClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      try {
        const a = (e.target as Element | null)?.closest?.("a[href]");
        if (!a) return;
        const method = contactMethod(a.getAttribute("href"));
        if (!method || isPrivatePath(location.pathname)) return;
        const gtag = (window as { gtag?: (...a: unknown[]) => void }).gtag;
        gtag?.("event", "contact_click", { method, page_path: location.pathname });
        trackPixel("Contact", { content_category: method });
      } catch {
        /* tracking must never stop the call or chat from opening */
      }
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
