"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUp, Phone } from "lucide-react";
import { WhatsAppIcon } from "./BrandIcons";

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
      <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-3 sm:right-6">
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
      {/* Mobile call bar */}
      <a
        href={phone}
        className="fixed bottom-5 left-4 z-40 flex h-14 items-center gap-2 rounded-full bg-gold px-5 font-bold text-black shadow-xl sm:hidden"
      >
        <Phone className="h-5 w-5" /> Call now
      </a>
    </>
  );
}
