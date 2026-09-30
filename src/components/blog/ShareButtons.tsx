"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const native = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user cancelled */
      }
    } else copy();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };
  const btn = "flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-gold hover:text-gold";
  return (
    <div className="flex items-center gap-2">
      <span className="mr-1 text-xs uppercase tracking-widest text-white/45">Share</span>
      <a className={btn} href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp">
        <WhatsAppIcon className="h-4 w-4" />
      </a>
      <button type="button" className={btn} onClick={copy} aria-label="Copy link">
        {copied ? <Check className="h-4 w-4 text-gold" /> : <Link2 className="h-4 w-4" />}
      </button>
      <button type="button" className={btn} onClick={native} aria-label="More sharing options">
        <Share2 className="h-4 w-4" />
      </button>
    </div>
  );
}
