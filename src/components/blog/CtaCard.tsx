import Link from "next/link";
import { Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { BrandMark } from "@/components/ui/Logo";

export function CtaCard({ whatsapp, phone }: { whatsapp: string; phone: string }) {
  return (
    <aside className="not-prose relative my-10 overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-coal to-ink p-7 ring-1 ring-brand/40">
      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand/20 blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <BrandMark className="float-slow h-14" />
        <div className="flex-1">
          <p className="font-display text-2xl text-white">Train with us in Sector 93, Noida</p>
          <p className="mt-1 text-white/65">Your first session is free. Certified trainers, full AC floor, real results.</p>
        </div>
      </div>
      <div className="relative mt-5 flex flex-wrap gap-3">
        <Link href="/contact#trial" className="btn-brand rounded-full px-6 py-3 font-bold no-underline">
          Book Free Trial
        </Link>
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-3 font-bold text-white no-underline">
          <WhatsAppIcon className="h-5 w-5" /> WhatsApp
        </a>
        <a href={phone} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 font-semibold text-white no-underline">
          <Phone className="h-4 w-4" /> Call
        </a>
      </div>
    </aside>
  );
}
