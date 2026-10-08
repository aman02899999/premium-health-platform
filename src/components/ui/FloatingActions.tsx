"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUp, CalendarCheck, Phone } from "lucide-react";
import { WhatsAppIcon } from "./BrandIcons";

/**
 * Phones: a docked action bar (Call · WhatsApp · Free trial) with a spacer so it never covers
 * page content. Larger screens: the floating WhatsApp button and back-to-top.
 */
export function FloatingActions({ whatsapp, phone }: { whatsapp: string; phone: string }) {
  const pathname = usePathname();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 900);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      {/* Keeps the end of every page (footer links) clear of the docked bar. */}
      <div aria-hidden className="h-[calc(4.5rem+env(safe-area-inset-bottom))] sm:hidden" />

      <nav aria-label="Quick contact" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden">
        <div className="grid h-[4.5rem] grid-cols-3 gap-2 px-3 py-2.5">
          <a href={phone} className="flex items-center justify-center gap-1.5 rounded-2xl bg-white/[.06] text-sm font-bold text-white ring-1 ring-white/10 active:scale-[.97]">
            <Phone className="h-4.5 w-4.5" /> Call
          </a>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#25d366] text-sm font-bold text-white active:scale-[.97]">
            <WhatsAppIcon className="h-5 w-5" /> WhatsApp
          </a>
          <Link href="/contact#trial" className="btn-brand flex items-center justify-center gap-1.5 rounded-2xl text-sm font-bold active:scale-[.97]">
            <CalendarCheck className="h-4.5 w-4.5" /> Free trial
          </Link>
        </div>
      </nav>

      <div className="fixed bottom-6 right-6 z-40 hidden flex-col items-end gap-3 sm:flex">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0 })}
          className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-coal/90 text-white transition-all ${
            showTop ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0"
          }`}
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="pulse-ring flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-xl transition-transform hover:scale-110"
          aria-label="Chat on WhatsApp"
        >
          <WhatsAppIcon className="h-7 w-7" />
        </a>
      </div>
    </>
  );
}
