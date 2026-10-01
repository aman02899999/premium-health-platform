import Link from "next/link";
import { ArrowRight, BadgeCheck, Cctv, Clock, DoorOpen, Dumbbell, MapPin, Phone, Salad, Snowflake, Star, Users } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { HUB } from "@/lib/hub";
import { faqJsonLd } from "@/lib/seo";
import { formatTime, hoursDays, fullAddress, publishedPosts, telHref, whatsappHref } from "@/lib/site";
import { Hero3DLoader } from "@/components/home/Hero3DLoader";
import { PlanGrid } from "@/components/home/PlanGrid";
import { razorpayConfigured } from "@/lib/payments/razorpay";
import { Gallery3D } from "@/components/home/Gallery3D";
import { LeadForm } from "@/components/home/LeadForm";
import { FaqList, PostCard, ProgramGrid, RatingBadge, TrainerGrid } from "@/components/home/Blocks";
import { Icon } from "@/components/Icon";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/Section";
import { TiltCard } from "@/components/ui/TiltCard";
import { JsonLd } from "@/components/ui/JsonLd";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { PortalOverlay } from "@/components/portal/PortalOverlay";
import { PORTAL_BOOT } from "@/lib/portal";

export const revalidate = 300;

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

  return (
    <>
      {/* First-visit chooser: decided before paint so returning visitors never see a flash. */}
      <script dangerouslySetInnerHTML={{ __html: PORTAL_BOOT }} />
      <PortalOverlay gymName={b.name} />
      <JsonLd data={faqJsonLd(c.faqs)} />

      {/* ---------- HERO ---------- */}
      <section className="relative isolate min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_70%_40%,rgba(4,70,109,.55),transparent_55%),radial-gradient(ellipse_at_10%_90%,rgba(232,57,75,.18),transparent_50%)]" />
        <div className="grid-floor absolute inset-x-0 bottom-0 -z-10 h-1/2 origin-bottom [transform:perspective(600px)_rotateX(62deg)]" />
        <div className="absolute inset-0 -z-10">
          <Hero3DLoader />
        </div>
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/80 to-transparent lg:bg-gradient-to-r lg:via-ink/40" />

        <div className="mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-4 pb-16 pt-40 sm:px-6 lg:justify-center lg:pb-24">
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
              <RatingBadge value={b.rating.value} count={b.rating.count} source={b.rating.source} href={b.googleMapsUrl} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- STATS ---------- */}
      <section className="relative z-10 -mt-10 px-4 sm:px-6">
        <div className="glass brand-border mx-auto grid max-w-6xl grid-cols-2 divide-white/10 rounded-3xl md:grid-cols-4 md:divide-x">
          {c.stats.map((s) => (
            <div key={s.label} className="p-6 text-center sm:p-8">
              <div className="font-display text-4xl text-brand-gradient sm:text-5xl">
                <CountUp value={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-xs uppercase tracking-widest text-white/60">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- MARQUEE ---------- */}
      <div className="mt-20 overflow-hidden border-y border-white/10 bg-coal py-5" aria-hidden>
        <div className="marquee flex w-max gap-10 whitespace-nowrap">
          {Array.from({ length: 2 }).flatMap((_, k) =>
            ["Strength", "Fat Loss", "Personal Training", "Cardio", "Bodybuilding", "Women's Fitness", "Diet Plans", "Transformation"].map((w) => (
              <span key={`${k}-${w}`} className="font-display flex items-center gap-10 text-3xl text-white/15">
                {w} <span className="text-brand">✦</span>
              </span>
            )),
          )}
        </div>
      </div>

      {/* ---------- PROGRAMS ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <SectionHeading eyebrow="What we offer" title="Programs built for" highlight="real results" intro="Whether it's your first day in a gym or your next competition prep, there's a plan for you." />
        <ProgramGrid programs={c.programs} />
      </section>

      {/* ---------- WHY US ---------- */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-[140px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionHeading center={false} eyebrow="Why Royal Fitness" title="A neighbourhood gym with" highlight="premium standards" intro={b.description} />
            <div className="grid gap-4 sm:grid-cols-2">
              {FACILITIES.map((f, i) => (
                <Reveal key={f.title} delay={i * 60}>
                  <div className="flex gap-4 rounded-2xl p-3 transition-colors hover:bg-white/5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/15 ring-1 ring-brand/30">
                      <f.icon className="h-6 w-6 text-brand" />
                    </span>
                    <span>
                      <span className="block font-semibold text-white">{f.title}</span>
                      <span className="text-sm text-white/60">{f.text}</span>
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal delay={150}>
            <TiltCard className="rounded-[2rem]" max={8}>
              <div className="glass brand-border relative overflow-hidden rounded-[2rem] p-8">
                <div className="pop-3d">
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
                    <li className="text-sm text-white/50">{hoursDays(b.hours)}</li>
                  </ul>
                  <p className="mt-6 flex gap-2 text-white/75">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-brand" /> {fullAddress(b)}
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <a href={telHref(b.phone)} className="btn-brand inline-flex items-center gap-2 rounded-full px-5 py-3 font-bold">
                      <Phone className="h-4 w-4" /> {b.phone}
                    </a>
                    <a href={b.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 font-semibold text-white hover:border-brand">
                      <MapPin className="h-4 w-4" /> Directions
                    </a>
                  </div>
                </div>
              </div>
            </TiltCard>
          </Reveal>
        </div>
      </section>

      {/* ---------- MEMBERSHIP ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <SectionHeading eyebrow="Membership" title="Pick your" highlight="royal plan" intro="Simple pricing, no hidden charges. Longer plans save you more." />
        <PlanGrid plans={c.plans} note={c.planNote} payOnline={razorpayConfigured()} />
      </section>

      {/* ---------- GALLERY ---------- */}
      <section className="overflow-hidden py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow="Inside the club" title="Take a" highlight="3D tour" intro="Swipe, drag or tap to explore. Tap the centre photo to view it full screen." />
          <Gallery3D items={c.gallery} />
        </div>
      </section>

      {/* ---------- HEALTH HUB ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <SectionHeading
          eyebrow="Free health & fitness hub"
          title="Train smarter,"
          highlight="even at home"
          intro="Workout planner, exercise library, Indian food tracker, diet plans and 11 calculators — free for everyone."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HUB.map((t, i) => (
            <Reveal key={t.href} delay={i * 50}>
              <TiltCard className="group h-full rounded-2xl" max={12}>
                <Link href={t.href} className="glass flex h-full flex-col rounded-2xl p-6 hover:ring-1 hover:ring-brand/50">
                  <span className="pop-3d flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15">
                    <Icon name={t.icon} className="h-6 w-6 text-brand" />
                  </span>
                  <span className="mt-4 font-semibold text-white">{t.title}</span>
                  <span className="mt-1 flex-1 text-sm text-white/55">{t.text}</span>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                    Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- TRAINERS ---------- */}
      {c.trainers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <SectionHeading eyebrow="The team" title="Coached by" highlight="the best" />
          <TrainerGrid trainers={c.trainers} />
        </section>
      )}

      {/* ---------- TESTIMONIALS ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <SectionHeading eyebrow="Member love" title="Rated" highlight={`${b.rating.value}★ by ${b.rating.count}+ members`} />
        {c.testimonials.length > 0 ? (
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
          <a href={b.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-brand/50 px-6 py-3 font-semibold text-brand hover:bg-brand hover:text-white">
            <Star className="h-4 w-4" /> Read & write Google reviews
          </a>
          <a href={`https://www.instagram.com/${b.instagram}/`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 font-semibold text-white hover:border-brand">
            <Users className="h-4 w-4" /> See transformations on Instagram
          </a>
        </div>
      </section>

      {/* ---------- BLOG ---------- */}
      {posts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <SectionHeading eyebrow="From the blog" title="Train" highlight="smarter" intro="Workout plans, Indian diet guides and fitness science — written by our coaches." />
          <div className="grid gap-6 md:grid-cols-3">
            {posts.map((p, i) => (
              <PostCard key={p.slug} post={p} index={i} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/blog" className="inline-flex items-center gap-2 font-semibold text-brand hover:underline">
              View all articles <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ---------- FAQ ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <SectionHeading eyebrow="FAQ" title="Questions," highlight="answered" />
        <FaqList faqs={c.faqs} />
      </section>

      {/* ---------- TRIAL CTA ---------- */}
      <section id="trial" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-24 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading center={false} eyebrow="Free trial" title="Your first workout is" highlight="on the house" intro="Leave your number and we'll call to fix a time that suits you. Or skip the form and WhatsApp us directly." />
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-6 py-3.5 font-bold text-white">
              <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
            </a>
          </div>
          <Reveal delay={120}>
            <LeadForm whatsapp={b.whatsapp} gymName={b.name} source="home" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
