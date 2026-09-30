"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { PORTAL_KEY } from "@/lib/portal";
import { PortalScene } from "./PortalScene";

/**
 * First-visit chooser over the homepage. Visibility is decided before paint by
 * PORTAL_BOOT (html[data-portal="show"]); the homepage stays rendered underneath
 * so crawlers and "skip" users get the full gym page.
 */
export function PortalOverlay({ gymName }: { gymName: string }) {
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => {
    try {
      localStorage.setItem(PORTAL_KEY, "gym");
    } catch {
      /* storage unavailable */
    }
    setClosing(true);
    window.setTimeout(() => document.documentElement.removeAttribute("data-portal"), 450);
  }, []);

  useEffect(() => {
    if (document.documentElement.getAttribute("data-portal") !== "show") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    document.querySelector<HTMLElement>(".portal-overlay .portal-card")?.focus({ preventScroll: true });
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div className={`portal-overlay ${closing ? "portal-closing" : ""}`} role="dialog" aria-modal="true" aria-label="Choose a website">
      <button type="button" onClick={close} className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-2 text-xs font-semibold text-white/80 backdrop-blur hover:text-white" aria-label="Skip and stay on the gym website">
        Skip <X className="h-4 w-4" />
      </button>
      <PortalScene gymName={gymName} onGym={close} />
    </div>
  );
}
