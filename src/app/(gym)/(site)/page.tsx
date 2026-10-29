import Link from "next/link";
import { ArrowRight, BadgeCheck, Cctv, Clock, DoorOpen, Dumbbell, MapPin, Phone, Salad, Snowflake, Star, Users } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { HUB } from "@/lib/hub";
import { faqJsonLd } from "@/lib/seo";
import { formatTime, hoursDays, fullAddress, publishedPosts, telHref, whatsappHref } from "@/lib/site";
import { HeroOfferCard } from "@/components/home/HeroOfferCard";
import { SmartImage } from "@/components/ui/SmartImage";
import { heroOffer } from "@/lib/hero-offer";
import { PlanGrid } from "@/components/home/PlanGrid";
import { razorpayConfigured } from "@/lib/payments/razorpay";
import { Gallery3D } from "@/components/home/Gallery3D";
import { LeadForm } from "@/components/home/LeadForm";
import { FaqList, RatingBadge } from "@/components/home/Blocks";
import { PROGRAM_GUIDES } from "@/lib/content/program-guides";
import { Icon } from "@/components/Icon";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/Section";
import { TiltCard } from "@/components/ui/TiltCard";
import { JsonLd } from "@/components/ui/JsonLd";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { PortalOverlay } from "@/components/portal/PortalOverlay";
import { applyOffer } from "@/lib/offers";
import { faqsWithOffer } from "@/lib/content/ai-facts";
import { todayIST } from "@/lib/growth/dates";

import { PORTAL_BOOT } from "@/lib/portal";
import { isDbConfigured } from "@/health/db";
import { approvedReviews } from "@/lib/reviews/store";
import { ReviewCard } from "@/components/reviews/ReviewCard";

export const revalidate = 3600;

const DEFAULT_HERO_IMAGE = "/gallery/aman-sharma-royal-fitness-gym.webp";

const FACILITIES = [
  { icon: Snowflake, title: "Fully Air-Conditioned", text: "Train hard even in peak Noida summer." },
  { icon: BadgeCheck, title: "Certified Trainers", text: "Qualified coaches correcting form on the floor." },
  { icon: Cctv, title: "CCTV Secured", text: "Safe for everyone, morning to late evening." },
  { icon: Dumbbell, title: "Strength + Cardio", text: "Free weights, machines and cardio in one place." },
  { icon: Salad, title: "Diet Guidance", text: "Indian veg & non-veg meal plans that fit home food." },
  { icon: DoorOpen, title: "Emergency Exit", text: "Clearly marked exits and a safety-first setup." },
];

export default async function HomePage() {
  const c = await getContent();
  const b = c.business;
  const posts = publishedPosts(c).slice(0, 3);
  const wa = whatsappHref(b);
  // Verified reviews from members and plan clients (see /reviews); the admin's own testimonials otherwise.
  const reviews = isDbConfigured ? (await approvedReviews(3).catch(() => [])) : [];
  const plans = applyOffer(c.plans, todayIST(), c.offers);
  const faqs = faqsWithOffer(c.faqs, plans);
  const offer = heroOffer(plans);
  // The admin's hero photo if one is set (Admin → Home → Hero), else the founder at the rack.
  const heroImage = c.hero.image || DEFAULT_HERO_IMAGE;
  const founder = c.trainers.find((t) => /founder/i.test(t.role))?.name ?? "Aman Sharma";

  return (
    <>
      {/* First-visit chooser: decided before paint so returning visitors never see a flash. */}
      <script dangerouslySetInnerHTML={{ __html: PORTAL_BOOT }} />
      <PortalOverlay gymName={b.name} />
      <JsonLd data={faqJsonLd(faqs)} />

      {/* ---------- HERO ---------- */}
      {/* Spotlight hero: the founder on the real gym floor, plus one CSS-3D offer card. No WebGL here,
          so phones paint the photo straight away (the old three.js dumbbell is no longer loaded on home). */}
      <section className="relative isolate min-h-[100svh] overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-20 h-[62svh] lg:inset-y-0 lg:left-auto lg:h-auto lg:w-[58%]">
          <SmartImage src={heroImage} alt={`${founder}, founder and head coach, training at ${b.name}`} priority sizes="(min-width: 1024px) 58vw, 100vw" className="object-[center_25%]" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(0deg,var(--color-ink)_38%,rgba(6,17,28,.55)_62%,rgba(6,17,28,.15)_100%)] lg:bg-[linear-gradient(90deg,var(--color-ink)_0%,var(--color-ink)_40%,rgba(6,17,28,.7)_56%,rgba(6,17,28,.1)_80%,rgba(6,17,28,.35)_100%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 hidden h-56 bg-gradient-to-t from-ink to-transparent lg:block" />
        <span aria-hidden className="hero-93 pointer-events-none absolute -z-10 hidden select-none lg:block">93</span>

        <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-4 pb-16 pt-[44svh] sm:px-6 lg:justify-center lg:pb-24 lg:pt-40">
          <div className="max-w-2xl">
            <Reveal>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand/40 bg-black/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-brand backdrop-blur">
                <MapPin className="h-3.5 w-3.5" /> {c.hero.eyebrow}
              </p>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="font-display text-5xl leading-[0.95] text-white sm:text-7xl lg:text-[5.5rem]">
                {c.hero.title}
                <br />
                <span className="text-brand-gradient">{c.hero.highlight}</span>
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-6 max-w-xl text-lg text-white/75 sm:text-xl">{c.hero.subtitle}</p>
            </Reveal>
            <Reveal delay={300} className="mt-9 flex flex-wrap gap-3">
              <Link href="/contact#trial" className="btn-brand inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-bold">
                {c.hero.primaryCta} <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/membership" className="glass inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-semibold text-white hover:ring-1 hover:ring-brand/60">
                {c.hero.secondaryCta}
              </Link>
            </Reveal>
            <Reveal delay={400} className="mt-10">
              <RatingBadge value={b.rating.value} count={b.rating.count} source={b.rating.source} href={/google/i.test(b.rating.source) ? b.googleMapsUrl : undefined} />
            </Reveal>
          </div>
          {offer && <HeroOfferCard offer={offer} />}
          <p className="pointer-events-none absolute right-6 top-36 hidden text-sm text-white/80 lg:block">{founder}, founder &amp; head coach</p>
        </div>
      </section>

      {/* ---------- STATS ---------- */}
      <section className="relative z-10 -mt-10 px-4 sm:px-6">
        <div className="glass brand-border mx-auto grid max-w-6xl grid-cols-2 divide-white/10 rounded-3xl md:grid-cols-4 md:divide-x">
          {c.stats.map((s) => (
            <div key={s.label} className="min-w-0 px-3 py-5 text-center sm:p-8">
              <div className="font-display text-[clamp(1.6rem,8.5vw,2.25rem)] leading-tight text-brand-gradient [overflow-wrap:anywhere] sm:text-5xl">
                <CountUp value={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-white/60 sm:text-xs sm:tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- MEMBERSHIP ---------- */}
      {/* Prices come straight after the stats: it's what most visitors came to check. */}
      <section className="cv-auto mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6">
        <SectionHeading eyebrow="Membership" title="Plans &" highlight="prices" intro="Every plan in one list. No hidden charges, and your first session is free." />
        <PlanGrid plans={plans} note={c.planNote} payOnline={razorpayConfigured()} />
        <p className="mt-6 text-center">
          <Link href="/membership" className="inline-flex items-center gap-2 py-2 font-semibold text-brand hover:underline">
            Compare plans side by side <ArrowRight className="h-4 w-4" />
          </Link>
        </p>
      </section>

      {/* ---------- PROGRAMS ---------- */}
      <section className="cv-auto mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="What we offer" title="Programs for" highlight="every goal" />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {c.programs.map((p) => (
            <li key={p.id}>
              <Link href={PROGRAM_GUIDES[p.id] ? `/programs/${p.id}` : `/programs#${p.id}`} className="glass flex h-full items-center gap-4 rounded-2xl p-4 hover:ring-1 hover:ring-brand/50">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15">
                  <Icon name={p.icon} className="h-5 w-5 text-brand" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-white">{p.title}</span>
                  <span className="line-clamp-1 text-sm text-white/60">{p.summary}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-brand" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- VISIT US ---------- */}
      <section className="cv-auto mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading center={false} eyebrow="Why Royal Fitness" title="A neighbourhood gym with" highlight="premium standards" />
            <ul className="grid grid-cols-2 gap-3">
              {FACILITIES.map((f) => (
                <li key={f.title} className="flex items-center gap-3 text-sm font-semibold text-white">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15">
                    <f.icon className="h-4 w-4 text-brand" />
                  </span>
                  {f.title}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass brand-border rounded-[2rem] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-brand">Opening hours</p>
            <ul className="mt-4 space-y-3">
              {b.hours.map((h) => (
                <li key={h.label + h.open} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                  <span className="flex items-center gap-2 text-white/80">
                    <Clock className="h-4 w-4 text-brand" /> {h.label || h.days}
                  </span>
                  <span className="font-semibold text-white">
                    {formatTime(h.open)} – {formatTime(h.close)}
                  </span>
                </li>
              ))}
              <li className="text-sm text-white/60">{hoursDays(b.hours)}</li>
            </ul>
            <p className="mt-5 flex gap-2 text-white/75">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-brand" /> {fullAddress(b)}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={telHref(b.phone)} className="btn-brand inline-flex items-center gap-2 rounded-full px-5 py-3 font-bold">
                <Phone className="h-4 w-4" /> {b.phone}
              </a>
              <a href={b.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 font-semibold text-white hover:border-brand">
                <MapPin className="h-4 w-4" /> Directions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- GALLERY ---------- */}
      <section className="cv-auto overflow-hidden py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow="Inside the club" title="Take a" highlight="3D tour" intro="Swipe, drag or tap to explore. Tap the centre photo to view it full screen." />
          <Gallery3D items={c.gallery} />
        </div>
      </section>

      {/* ---------- TESTIMONIALS ---------- */}
      <section className="cv-auto mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="Member love" title="Rated" highlight={`${b.rating.value}★ on ${b.rating.source || "Google"} (${b.rating.count}+ ratings)`} />
        {reviews.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r, i) => (
              <Reveal key={r.id} delay={i * 80}>
                <TiltCard className="h-full rounded-3xl" max={6}>
                  <ReviewCard r={r} />
                </TiltCard>
              </Reveal>
            ))}
          </div>
        ) : c.testimonials.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {c.testimonials.map((t, i) => (
              <Reveal key={t.id} delay={i * 80}>
                <TiltCard className="h-full rounded-3xl" max={6}>
                  <figure className="glass flex h-full flex-col rounded-3xl p-7">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, k) => (
                        <Star key={k} className={`h-4 w-4 ${k < t.rating ? "fill-brand text-brand" : "text-white/25"}`} />
                      ))}
                    </div>
                    <blockquote className="mt-4 flex-1 text-white/80">“{t.text}”</blockquote>
                    <figcaption className="mt-5">
                      <span className="block font-semibold text-white">{t.name}</span>
                      {t.result && <span className="text-sm text-brand">{t.result}</span>}
                    </figcaption>
                  </figure>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="text-center">
            <p className="mx-auto max-w-xl text-white/65">Read what our members say about us on Google and share your own experience.</p>
          </Reveal>
        )}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/reviews" className="inline-flex items-center gap-2 rounded-full bg-brand-strong px-6 py-3 font-semibold text-white hover:bg-brand">
            <BadgeCheck className="h-4 w-4" /> Reviews from members
          </Link>
          <a href={b.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-brand/50 px-6 py-3 font-semibold text-brand hover:bg-brand hover:text-white">
            <Star className="h-4 w-4" /> Read & write Google reviews
          </a>
          <a href={`https://www.instagram.com/${b.instagram}/`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 font-semibold text-white hover:border-brand">
            <Users className="h-4 w-4" /> See transformations on Instagram
          </a>
        </div>
      </section>

      {/* ---------- FREE TOOLS + BLOG ---------- */}
      <section className="cv-auto mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="Free for everyone" title="Tools &" highlight="guides" />
        <div className="grid gap-10 lg:grid-cols-2">
          <ul className="flex flex-wrap gap-2" aria-label="Free fitness tools">
            {HUB.map((t) => (
              <li key={t.href}>
                <Link href={t.href} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:border-brand">
                  <Icon name={t.icon} className="h-4 w-4 text-brand" /> {t.title}
                </Link>
              </li>
            ))}
          </ul>
          {posts.length > 0 && (
            <ul className="divide-y divide-white/10" aria-label="Latest articles">
              {posts.map((p) => (
                <li key={p.slug}>
                  <Link href={`/blog/${p.slug}`} className="flex items-center justify-between gap-4 py-3 font-semibold text-white hover:text-brand">
                    {p.title} <ArrowRight className="h-4 w-4 shrink-0 text-brand" />
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/blog" className="inline-flex items-center gap-2 py-3 text-sm font-semibold text-brand hover:underline">
                  All articles <ArrowRight className="h-4 w-4" />
                </Link>
              </li>
            </ul>
          )}
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="cv-auto mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="FAQ" title="Questions," highlight="answered" />
        <FaqList faqs={faqs} />
      </section>

      {/* ---------- TRIAL CTA ---------- */}
      <section id="trial" className="cv-auto mx-auto max-w-7xl scroll-mt-28 px-4 py-16 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading center={false} eyebrow="Free trial" title="Your first workout is" highlight="on the house" intro="Leave your number and we'll call to fix a time that suits you. Or skip the form and WhatsApp us directly." />
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-6 py-3.5 font-bold text-[#0b141a]">
              <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
            </a>
          </div>
          <Reveal delay={120}>
            <LeadForm whatsapp={b.whatsapp} gymName={b.name} source="home" hours={b.hours} address={fullAddress(b)} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
