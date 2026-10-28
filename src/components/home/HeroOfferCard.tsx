import Link from "next/link";
import type { HeroOffer } from "@/lib/hero-offer";

// The running offer as a tilted "membership pass". Pure CSS 3D (see .offer-pass in globals.css):
// no script, so it costs nothing on phones. Links to the membership page, where the plans are sold.
export function HeroOfferCard({ offer }: { offer: HeroOffer }) {
  return (
    <div className="offer-stage mt-8 lg:absolute lg:bottom-28 lg:right-6 lg:mt-0">
      <Link href="/membership" className="offer-pass flex w-full max-w-sm flex-col gap-1.5 rounded-2xl p-5 sm:p-6 lg:w-80">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-sky">
          {offer.title} · till {offer.until}
        </span>
        <span className="font-display text-4xl leading-none text-white sm:text-5xl">
          {offer.price}
          <span className="font-sans text-base font-medium normal-case tracking-normal text-white/70"> / {offer.per}</span>
        </span>
        <span className="text-sm text-white/80">{offer.gets}</span>
        {offer.extra && <span className="text-sm text-white/80">{offer.extra}</span>}
      </Link>
    </div>
  );
}
