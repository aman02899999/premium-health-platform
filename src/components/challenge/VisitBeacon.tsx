"use client";

import { useEffect } from "react";

/** Counts this visit for the sharer once the page has been visible for 6 seconds (previews and crawlers never get there). */
export function VisitBeacon({ code }: { code: string }) {
  useEffect(() => {
    let sent = false;
    let shown = document.visibilityState === "visible" ? Date.now() : 0;
    let total = 0;
    const tick = setInterval(() => {
      if (sent) return;
      const t = total + (shown ? Date.now() - shown : 0);
      if (t >= 6000) {
        sent = true;
        fetch("/api/challenge/visit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }), keepalive: true }).catch(() => {});
      }
    }, 1000);
    const vis = () => {
      if (document.visibilityState === "visible") shown = Date.now();
      else if (shown) (total += Date.now() - shown), (shown = 0);
    };
    document.addEventListener("visibilitychange", vis);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [code]);
  return null;
}
