"use client";

import { useEffect } from "react";
import { trackMonetizationEvent, getAttributionFromUrl } from "@/lib/monetization/analytics";
import type { AdPlacement } from "@/lib/monetization/types";
import { ADVERTISEMENTS } from "@/lib/monetization/config";

function useAdImpression(placement: AdPlacement, page: string) {
  useEffect(() => {
    trackMonetizationEvent({
      type: "ad_impression",
      page,
      campaign: placement,
      utm: getAttributionFromUrl(),
    });
  }, [placement, page]);
}

export function AdBanner({ placement = "homepage_top", page = "/" }: { placement?: AdPlacement; page?: string }) {
  const ad = ADVERTISEMENTS.find((a) => a.placement === placement && a.active) || ADVERTISEMENTS[0];
  useAdImpression(placement, page);
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-center dark:border-stone-700 dark:bg-stone-900/60" role="complementary" aria-label={`Advertisement: ${placement}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Advertisement · {placement} · {ad.width}x{ad.height}</p>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{ad.description} Editorial content is never influenced by advertisers.</p>
      <p className="mt-2 text-[11px] text-stone-400">Ad-ready location — integrate Google AdSense via NEXT_PUBLIC_ADSENSE_CLIENT_ID.</p>
    </div>
  );
}

export function AdRectangle({ placement = "article_bottom", page = "/" }: { placement?: AdPlacement; page?: string }) {
  const ad = ADVERTISEMENTS.find((a) => a.placement === placement) || ADVERTISEMENTS[1];
  useAdImpression(placement, page);
  return (
    <div className="mx-auto max-w-[300px] rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center dark:border-stone-700 dark:bg-stone-900/60" role="complementary" aria-label={`Advertisement rectangle: ${placement}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Advertisement · Rectangle 300x250 · {placement}</p>
      <div className="mt-3 flex h-[200px] items-center justify-center rounded-xl bg-white text-xs text-stone-400 dark:bg-stone-800">{ad.title} — Placeholder</div>
      <p className="mt-2 text-[11px] text-stone-400">Clearly marked. No fake ads. No auto-click.</p>
    </div>
  );
}

export function AdInArticle({ placement = "article_middle", page = "/" }: { placement?: AdPlacement; page?: string }) {
  const ad = ADVERTISEMENTS.find((a) => a.placement === placement) || ADVERTISEMENTS[1];
  useAdImpression(placement, page);
  return (
    <div className="my-6 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/20" role="complementary" aria-label={`In-article advertisement: ${placement}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700/70">Advertisement · In-Article · {placement}</p>
      <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">{ad.title} — {ad.description}</p>
    </div>
  );
}

export function AdSidebar({ placement = "products_sidebar", page = "/" }: { placement?: AdPlacement; page?: string }) {
  const ad = ADVERTISEMENTS.find((a) => a.placement === placement) || ADVERTISEMENTS[3];
  useAdImpression(placement, page);
  return (
    <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-5 dark:border-stone-700 dark:bg-stone-900/60" role="complementary" aria-label={`Sidebar advertisement: ${placement}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Advertisement · Sidebar 300x600 · {placement}</p>
      <div className="mt-3 h-[400px] rounded-xl bg-white p-4 text-center text-xs text-stone-400 dark:bg-stone-800">
        <p className="font-bold">{ad.title}</p>
        <p className="mt-2">{ad.description}</p>
        <p className="mt-4 text-[11px]">AdSense ready — set NEXT_PUBLIC_ADSENSE_CLIENT_ID</p>
      </div>
    </div>
  );
}
