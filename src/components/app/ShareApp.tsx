"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

/** Invite a friend: the phone's share sheet where there is one, otherwise WhatsApp. */
export function ShareApp({ url, text, className = "" }: { url: string; text: string; className?: string }) {
  const [shared, setShared] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (navigator.share) {
          try {
            await navigator.share({ title: "Royal Fitness app", text, url });
            setShared(true);
          } catch {
            /* closed the share sheet */
          }
          return;
        }
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank", "noopener,noreferrer");
        setShared(true);
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white transition-colors hover:border-sky ${className}`}
    >
      {shared ? <Check className="h-4 w-4 text-emerald-300" /> : <Share2 className="h-4 w-4" />} {shared ? "Thanks for sharing" : "Share the app with a friend"}
    </button>
  );
}
