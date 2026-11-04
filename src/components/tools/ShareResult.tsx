"use client";

import { useState, useSyncExternalStore } from "react";
import { Download, Share2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { calculatorByKey } from "@/lib/calculators";
import { cardFor, cardQuery, shareText, toolShareUrl, type CardInput } from "@/lib/share-card";

type Gtag = (cmd: "event", name: string, params: Record<string, string>) => void;
const track = (method: string, key: string) => (window as unknown as { gtag?: Gtag }).gtag?.("event", "share", { method, content_type: "calculator_result", item_id: key });

const noop = () => () => {};
function canShareImages(): boolean {
  try {
    return !!navigator.canShare?.({ files: [new File([""], "probe.png", { type: "image/png" })] });
  } catch {
    return false;
  }
}

/**
 * "Share my result" under a calculator: WhatsApp text with a link back to the tool, and the
 * result as a Story-sized image. Nothing is sent anywhere until the person taps a button.
 */
export function ShareResult({ input }: { input: CardInput }) {
  const [busy, setBusy] = useState(false);
  // Browser-only facts, read without an effect: empty on the server, real after hydration.
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => "");
  const canShareFiles = useSyncExternalStore(noop, canShareImages, () => false);
  const meta = calculatorByKey(input.key);
  if (!meta) return null;
  const card = cardFor(input);
  const image = `/api/share-card?${cardQuery(input)}`;
  const text = shareText(card, toolShareUrl(origin, meta.slug, input.key));

  // Phones that can share files send the image straight to WhatsApp or Instagram Stories.
  const shareImage = async () => {
    setBusy(true);
    try {
      const blob = await (await fetch(image)).blob();
      track("image", input.key);
      await navigator.share({ files: [new File([blob], `${input.key}-result.png`, { type: "image/png" })], text });
    } catch {
      /* cancelled */
    } finally {
      setBusy(false);
    }
  };

  const btn = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-bold transition-colors disabled:opacity-60";
  const secondary = `${btn} border border-white/20 text-white hover:border-brand hover:text-brand`;
  return (
    <div className="border-t border-white/10 pt-4">
      <p className="mb-2 text-center text-xs uppercase tracking-widest text-white/50">Share your result</p>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          data-no-capture
          onClick={() => track("whatsapp", input.key)}
          className={`${btn} bg-[#25d366] text-[#0b141a] hover:bg-[#2fe377]`}
        >
          <WhatsAppIcon className="h-4 w-4" /> WhatsApp
        </a>
        {canShareFiles ? (
          <button type="button" onClick={shareImage} disabled={busy} className={secondary}>
            <Share2 className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} /> Story image
          </button>
        ) : (
          // Everywhere else: open the image so it can be saved and posted.
          <a href={image} target="_blank" rel="noopener" download={`${input.key}-result.png`} onClick={() => track("image_open", input.key)} className={secondary}>
            <Download className="h-4 w-4" /> Story image
          </a>
        )}
      </div>
    </div>
  );
}
