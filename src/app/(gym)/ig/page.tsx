import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Clock, CreditCard, Dumbbell, HeartPulse, MapPin, Phone, Salad, ShoppingBag, Star } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { fullAddress, formatTime, hoursDays, instagramHref, telHref, whatsappHref } from "@/lib/site";
import { igLanding } from "@/lib/ig-landing";
import { formatDate, todayIST } from "@/lib/growth/dates";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/BrandIcons";

// The link in the Instagram bio. Instagram opens it in its in-app browser as a sheet over the
// profile, showing only the top of the page at first, so the offer and the WhatsApp button sit
// in that first screen; everything below is for people who pull the sheet up.
export const revalidate = 3600;

// Instagram's in-app browser tints its address bar with the page's theme colour, so the sheet
// opens in the offer's gold rather than the site's navy.
export const viewport: Viewport = { themeColor: "#f5c542" };

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return {
    title: { absolute: `${c.business.name} · Offers & links` },
    description: `${c.business.name}, ${c.business.address.locality}: today's offer, free trial, plans and WhatsApp in one place.`,
    alternates: { canonical: "/ig" },
    // A bio page repeats the home page; keep it out of search results but let crawlers follow it.
    robots: { index: false, follow: true },
  };
}

export default async function InstagramLinksPage() {
  const c = await getContent();
  const b = c.business;
  const today = todayIST();
  const l = igLanding(c, today);
  const claim = whatsappHref(b, l.endsOn ? `Hi ${b.name}, I saw the ${l.badge.toLowerCase()} on Instagram and want to claim it.` : `Hi ${b.name}, I saw you on Instagram and want to book a free trial.`);
  const best = l.plans.find((p) => p.id === "yearly") ?? l.plans[l.plans.length - 1];

  const links = [
    { href: "/membership", label: "All membership plans", icon: CreditCard },
    { href: "/programs", label: "Programs: fat loss, muscle, women's", icon: Dumbbell },
    { href: "/diet-plans", label: "Indian diet plans", icon: Salad },
    { href: "/health", label: "Free health guides & tools", icon: HeartPulse },
    { href: "/store", label: "Royal Supplements Store", icon: ShoppingBag },
  ];

  return (
    <main className="min-h-[100svh] bg-ink">
      {/* ---------- First screen: what shows in Instagram's sheet ---------- */}
      <section className="bg-[#f5c542] px-4 pb-5 pt-4 text-center text-ink">
        <p className="mx-auto inline-flex max-w-full items-center gap-2 rounded-full bg-ink px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.12em] text-[#f5c542]">
          <span aria-hidden>🎁</span> {l.badge}
          {l.countdown && (
            <>
              <span aria-hidden className="text-white/40">|</span>
              <span aria-hidden>⏰</span> {l.countdown}
            </>
          )}
        </p>
        <p className="mx-auto mt-3 max-w-md font-display text-xl leading-tight sm:text-2xl">{l.deal}</p>
      </section>

      <section className="relative overflow-hidden px-4 pb-8 pt-5">
        <div aria-hidden className="absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(232,57,75,.28),transparent_55%),radial-gradient(ellipse_at_0%_100%,rgba(4,70,109,.5),transparent_60%)]" />
        <div className="relative mx-auto max-w-md">
          <h1 className="font-display text-[2.3rem] leading-[0.95] text-white sm:text-5xl">
            Your dream physique
            <br />
            <span className="text-brand-gradient">starts this week</span>
          </h1>
          <p className="mt-2.5 text-[15px] leading-snug text-white/75">
            {best?.offer ? (
              <>
                Wow offer: <strong className="text-white">{best.name}</strong> = {best.offer.gets}. Grab it before {formatDate(best.offer.endsOn)}.
              </>
            ) : (
              <>Certified coaches, AC gym, morning & evening batches in {b.address.locality}, {b.address.city}.</>
            )}
          </p>

          <a href={claim} target="_blank" rel="noopener noreferrer" className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25d366] px-5 py-4 text-lg font-bold text-ink shadow-[0_12px_30px_-12px_rgba(37,211,102,.8)]">
            <WhatsAppIcon className="h-6 w-6" /> {l.endsOn ? "Claim offer on WhatsApp" : "Book free trial on WhatsApp"}
          </a>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Link href="/contact#trial" className="btn-brand flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold">
              <CalendarCheck className="h-4 w-4" /> Free trial
            </Link>
            <Link href="/join" className="glass flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold text-white">
              <CreditCard className="h-4 w-4" /> Join online
            </Link>
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-white/70">
            <Star className="h-4 w-4 fill-[#f5c542] text-[#f5c542]" /> {b.rating.value} · {b.rating.count}+ ratings on {b.rating.source}
          </p>
        </div>
      </section>

      {/* ---------- Pulled up: plans, a meme, links ---------- */}
      {l.plans.length > 0 && (
        <section className="px-4 pb-8">
          <div className="mx-auto max-w-md">
            <h2 className="font-display text-2xl text-white">{l.endsOn ? "Offer prices" : "Plans"}</h2>
            <ul className="mt-3 space-y-2.5">
              {l.plans.map((p) => (
                <li key={p.id}>
                  <Link href="/join" className={`glass flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${p.id === best?.id ? "brand-border" : ""}`}>
                    <span className="min-w-0">
                      <span className="block font-bold text-white">
                        {p.name}
                        {p.id === best?.id && <span className="ml-2 rounded-full bg-[#f5c542] px-2 py-0.5 align-middle text-[11px] font-bold uppercase text-ink">Best value</span>}
                      </span>
                      <span className="block text-sm text-white/65">{p.offer?.gets ?? p.duration}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      {p.originalPrice > 0 && <span className="block text-xs text-white/45 line-through">₹{p.originalPrice.toLocaleString("en-IN")}</span>}
                      <span className="block font-display text-xl text-white">₹{p.price.toLocaleString("en-IN")}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-white/45">Single-person prices. Couple plans at standard rates.</p>
          </div>
        </section>
      )}

      <section className="px-4 pb-8">
        <figure className="mx-auto max-w-md overflow-hidden rounded-2xl border-2 border-white bg-white text-center text-ink">
          <p className="px-4 pt-4 font-display text-xl leading-tight">Me: &ldquo;Monday se pakka gym.&rdquo;</p>
          <p className="px-4 pt-1 text-4xl" aria-hidden>
            😴📅😴📅😴
          </p>
          <p className="px-4 pb-4 pt-1 font-display text-xl leading-tight text-[#be1b2c]">Also me, 47 Mondays later.</p>
          <figcaption className="bg-ink px-4 py-2.5 text-sm font-semibold text-white">Break the loop today. The offer won&apos;t wait for Monday.</figcaption>
        </figure>
      </section>

      <section className="px-4 pb-8">
        <div className="mx-auto flex max-w-md items-center gap-4">
          <Image src="/gallery/aman-sharma-physique.webp" alt={`Aman Sharma, founder of ${b.name}`} width={112} height={140} className="h-[140px] w-[112px] shrink-0 rounded-2xl object-cover" />
          <p className="text-sm text-white/75">
            <strong className="block font-display text-lg text-white">Coached on the floor</strong>
            Founder Aman Sharma and certified trainers correct your form, plan your diet around home food and keep you showing up.
          </p>
        </div>
      </section>

      <nav aria-label="More links" className="px-4 pb-8">
        <ul className="mx-auto max-w-md space-y-2.5">
          {links.map(({ href, label, icon: I }) => (
            <li key={href}>
              <Link href={href} className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5 font-semibold text-white">
                <I className="h-5 w-5 text-brand" /> <span className="flex-1">{label}</span> <ArrowRight className="h-4 w-4 text-white/40" />
              </Link>
            </li>
          ))}
          <li>
            <a href={telHref(b.phone)} className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5 font-semibold text-white">
              <Phone className="h-5 w-5 text-brand" /> <span className="flex-1">Call a coach · {b.phone}</span> <ArrowRight className="h-4 w-4 text-white/40" />
            </a>
          </li>
          <li>
            <a href={b.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5 font-semibold text-white">
              <MapPin className="h-5 w-5 text-brand" /> <span className="flex-1">Directions on Google Maps</span> <ArrowRight className="h-4 w-4 text-white/40" />
            </a>
          </li>
        </ul>
      </nav>

      <footer className="px-4 pb-10 text-center text-xs text-white/50">
        <p className="flex items-center justify-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> {hoursDays(b.hours)} · {b.hours.map((h) => `${formatTime(h.open)}–${formatTime(h.close)}`).join(", ")}
        </p>
        <p className="mt-1">{fullAddress(b)}</p>
        <p className="mt-3 flex items-center justify-center gap-4">
          <Link href="/" className="underline underline-offset-2">
            Full website
          </Link>
          <a href={instagramHref(b.instagram)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2">
            <InstagramIcon className="h-3.5 w-3.5" /> @{b.instagram}
          </a>
        </p>
      </footer>
    </main>
  );
}
