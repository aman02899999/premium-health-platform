import Link from "next/link";
import { Clock, MapPin, Phone, Star } from "lucide-react";
import type { SiteContent } from "@/lib/content/types";
import { CALCULATORS } from "@/lib/calculators";
import { NAV, formatTime, fullAddress, instagramHref, telHref, whatsappHref } from "@/lib/site";
import { InstagramIcon, WhatsAppIcon } from "./BrandIcons";
import { Logo } from "./Logo";

export function Footer({ content }: { content: SiteContent }) {
  const b = content.business;
  return (
    <footer className="relative mt-24 border-t border-white/10 bg-coal">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo name={b.name} />
          <p className="mt-5 text-sm leading-relaxed text-white/60">{b.description}</p>
          <div className="mt-5 flex items-center gap-2 text-sm text-white/80">
            <Star className="h-4 w-4 fill-gold text-gold" />
            <strong>{b.rating.value}</strong> / 5 · {b.rating.count}+ reviews
          </div>
          <div className="mt-5 flex gap-3">
            <a href={instagramHref(b.instagram)} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 hover:border-gold hover:text-gold">
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a href={whatsappHref(b)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 hover:border-gold hover:text-gold">
              <WhatsAppIcon className="h-5 w-5" />
            </a>
            <a href={b.googleMapsUrl} target="_blank" rel="noopener noreferrer" aria-label="Google Maps" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 hover:border-gold hover:text-gold">
              <MapPin className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div>
          <h2 className="font-display mb-4 text-lg text-white">Explore</h2>
          <ul className="grid grid-cols-2 gap-2 text-sm text-white/65 lg:grid-cols-1">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="hover:text-gold">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display mb-4 text-lg text-white">Free Fitness Tools</h2>
          <ul className="space-y-2 text-sm text-white/65">
            {CALCULATORS.map((c) => (
              <li key={c.slug}>
                <Link href={`/tools/${c.slug}`} className="hover:text-gold">
                  {c.title.replace(/ \(.*\)$/, "")}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display mb-4 text-lg text-white">Visit Us</h2>
          <address className="space-y-4 text-sm not-italic text-white/65">
            <a href={b.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex gap-3 hover:text-gold">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {fullAddress(b)}
            </a>
            <a href={telHref(b.phone)} className="flex gap-3 hover:text-gold">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {b.phone}
            </a>
            <div className="flex gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <ul>
                {b.hours.map((h) => (
                  <li key={h.days}>
                    <span className="text-white/85">{h.days}:</span> {formatTime(h.open)} – {formatTime(h.close)}
                  </li>
                ))}
              </ul>
            </div>
          </address>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-white/45 sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} {b.name}, {b.address.locality}, {b.address.city}. All rights reserved.
          </p>
          <p className="flex gap-4">
            <Link href="/privacy" className="hover:text-gold">Privacy</Link>
            <Link href="/terms" className="hover:text-gold">Terms</Link>
            <Link href="/sitemap.xml" className="hover:text-gold">Sitemap</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
