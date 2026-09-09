import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Activity, ArrowRight, Baby, Brain, Calculator, Droplets, FlaskConical,
  Heart, Leaf, PersonStanding, Pill, Salad, ShieldCheck, Sparkles,
  Stethoscope, Sun, Users, Apple, BadgeCheck, BookOpen,
} from "lucide-react";
import { SITE, EXAMPLE_SEARCHES } from "@/lib/site";
import { IMG } from "@/lib/images";
import { SearchBar } from "@/components/layout";
import { SectionHeading, TopicCard, Newsletter, AdSlot, EvidenceBadge, DisclaimerBar } from "@/components/ui";
import { AnimatedCounter, HealthTipOfDay } from "@/components/engagement";
import { RiskBarChart, NutrientDonut, PlateVisual } from "@/components/charts";
import { NewsStrip } from "@/components/news-strip";
import { IndiaPulseDashboard, DrugLookup, FoodLookup, LiveBadge } from "@/components/live";
import { PILLARS } from "@/data/solutions";
import { DISEASES } from "@/data/diseases-index";
import { HERBS } from "@/data/herbs";
import { MEDICINES } from "@/data/medicines";
import { FOODS } from "@/data/nutrition";
import { LAB_TESTS } from "@/data/clinical";
import { PRODUCTS } from "@/data/editorial";
import { getAllEnrichedArticles } from "@/data/blog-enrichment";

export const metadata: Metadata = {
  title: `${SITE.name} — Understand Your Health. Make Better Decisions.`,
  description: `${SITE.heroSubtitle} Live AQI, outbreak tracking, 120+ disease guides, solution finder and evidence-graded herbs.`,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE.name} — Understand Your Health. Make Better Decisions.`,
    description: SITE.heroSubtitle,
    type: "website",
    url: SITE.url,
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: `${SITE.name} — Indian health knowledge` }],
  },
};

const PILLAR_ICONS: Record<string, React.ReactNode> = {
  stethoscope: <Stethoscope className="h-5 w-5" />,
  sparkles: <Sparkles className="h-5 w-5" />,
  leaf: <Leaf className="h-5 w-5" />,
  salad: <Salad className="h-5 w-5" />,
  activity: <Activity className="h-5 w-5" />,
  brain: <Brain className="h-5 w-5" />,
  flask: <FlaskConical className="h-5 w-5" />,
  droplets: <Droplets className="h-5 w-5" />,
};

const STATS = [
  { value: 120, suffix: "+", label: "Disease guides" },
  { value: 24, suffix: "", label: "Solution maps" },
  { value: 20, suffix: "", label: "Herb profiles" },
  { value: 12, suffix: "", label: "Blog guides" },
];

const FAQS = [
  { q: "Is this medical advice?", a: "No — education that prepares you for better doctor visits. We never prescribe, dose, or tell you to stop medicines. Emergencies always need a hospital, not a website." },
  { q: "How is Ayurveda handled here?", a: "As a respected traditional system with its own portal — clearly separated from modern evidence grades, with safety, interaction and quality notes on every herb." },
  { q: "Where does live data come from?", a: "Keyless public APIs: Open-Meteo (weather + AQI), disease.sh (COVID), openFDA (drug labels) and Open Food Facts — fetched server-side, cached, with graceful fallbacks." },
  { q: "Is it free?", a: "Yes — every guide, calculator, checker and briefing is free and open. Affiliate products are clearly labelled and never influence evidence ratings." },
];

export default function HomePage() {
  const popularDiseases = DISEASES.filter((d) => d.pillar).slice(0, 6);
  const herbs = HERBS.slice(0, 4);
  const meds = MEDICINES.slice(0, 4);
  const foods = FOODS.slice(0, 4);
  const labs = LAB_TESTS.slice(0, 6);
  const enriched = getAllEnrichedArticles();
  const featured = enriched.filter((a) => a.featured).slice(0, 3);
  const trending = enriched.filter((a) => a.trending).slice(0, 3);

  return (
    <div>
      {/* ============ CINEMATIC HERO ============ */}
      <section className="hero-pattern hero-vignette relative overflow-hidden">
        <div className="mandala-ring animate-spin-slow pointer-events-none absolute -left-32 top-10 h-96 w-96 opacity-60" aria-hidden />
        <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl" aria-hidden />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pt-14">
          <div className="reveal">
            <div className="flex flex-wrap items-center gap-2">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800 dark:border-emerald-800 dark:bg-stone-900/70 dark:text-emerald-200">
                <Sun className="h-3.5 w-3.5 text-amber-500" /> {SITE.tagline}
              </p>
              <LiveBadge />
            </div>
            <h1 className="font-display mt-4 text-[2.6rem] font-black leading-[1.02] text-stone-900 md:text-6xl dark:text-white">
              Understand Your Health. <span className="bg-gradient-to-r from-emerald-700 via-teal-600 to-amber-600 bg-clip-text text-transparent">Make Better Decisions.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-stone-600 dark:text-stone-300">
              {SITE.heroSubtitle} Now with <strong>live Indian health data</strong> — air quality, outbreak tracking and label lookups.
            </p>
            <div className="mt-6"><SearchBar large /></div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-semibold text-stone-500">Try:</span>
              {EXAMPLE_SEARCHES.slice(0, 7).map((e) => (
                <Link key={e} href={`/search?q=${encodeURIComponent(e)}`} className="rounded-full border border-stone-200 bg-white/70 px-2.5 py-1 font-medium text-stone-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-stone-700 dark:bg-stone-900/70 dark:text-stone-300">{e}</Link>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href="/solutions" className="btn-shine group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-900/20 transition hover:shadow-2xl">Find Every Solution <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>
              <Link href="/diseases" className="flex items-center gap-2 rounded-2xl border-2 border-emerald-700/20 bg-white/70 px-6 py-3.5 text-sm font-bold text-emerald-800 backdrop-blur hover:border-emerald-400 dark:border-stone-700 dark:bg-stone-900/70 dark:text-emerald-200">Explore 120+ Diseases</Link>
            </div>
            <dl className="mt-8 grid max-w-lg grid-cols-4 gap-3">
              {STATS.map((s) => (
                <div key={s.label} className="glass-strong premium-shadow-sm rounded-2xl border border-white/60 p-3 text-center dark:border-stone-700">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-display text-xl font-black text-emerald-800 md:text-2xl dark:text-emerald-300"><AnimatedCounter value={s.value} suffix={s.suffix} /></dd>
                  <dd className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero visual — real photography + floating glass cards */}
          <div className="reveal reveal-2 relative">
            <div className="premium-shadow relative overflow-hidden rounded-[2rem] border border-white/50 dark:border-stone-700">
              <Image src={IMG.heroDoctor} alt={IMG.heroDoctorAlt} width={1200} height={627} priority sizes="(max-width: 1024px) 100vw, 45vw" className="h-[420px] w-full object-cover md:h-[500px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-950/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300"><BadgeCheck className="h-4 w-4" /> Evidence-first · India-specific</p>
                <p className="font-display mt-1 text-xl font-bold text-white md:text-2xl">Modern medicine + Ayurveda + nutrition — honestly compared.</p>
              </div>
            </div>
            <Link href="/diseases/type-2-diabetes" className="glass-strong animate-floaty absolute -left-3 top-6 flex items-center gap-2 rounded-2xl border border-white/60 p-2.5 pr-4 shadow-xl md:-left-8">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><Activity className="h-4 w-4" /></span>
              <span><span className="block text-xs font-bold">HbA1c guide</span><span className="block text-[11px] text-stone-500">Targets, diet, medicines</span></span>
            </Link>
            <Link href="/health-calculators" className="glass-strong animate-floaty2 absolute -right-2 top-1/3 flex items-center gap-2 rounded-2xl border border-white/60 p-2.5 pr-4 shadow-xl md:-right-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><Calculator className="h-4 w-4" /></span>
              <span><span className="block text-xs font-bold">8 calculators</span><span className="block text-[11px] text-stone-500">BMI, IDRS, calories…</span></span>
            </Link>
            <Link href="/news" className="glass-strong animate-floaty absolute bottom-20 left-4 flex items-center gap-2 rounded-2xl border border-white/60 p-2.5 pr-4 shadow-xl" style={{ animationDelay: "0.8s" }}>
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600"><Heart className="h-4 w-4" /><span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" /></span>
              <span><span className="block text-xs font-bold">Live health pulse</span><span className="block text-[11px] text-stone-500">AQI · outbreaks · season</span></span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============ TRUST STRIP ============ */}
      <div className="border-y border-stone-200/70 bg-white/80 backdrop-blur dark:border-stone-800 dark:bg-stone-950/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-3 text-[12px] font-semibold text-stone-600 dark:text-stone-300">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> No cure claims, ever</span>
          <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-emerald-600" /> Guideline-referenced</span>
          <span className="flex items-center gap-1.5"><FlaskConical className="h-4 w-4 text-emerald-600" /> Evidence grades on everything</span>
          <span className="flex items-center gap-1.5"><Stethoscope className="h-4 w-4 text-emerald-600" /> Doctor-visit ready</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12">
        {/* ============ LIVE PULSE ============ */}
        <section aria-labelledby="live-pulse">
          <SectionHeading eyebrow="Real-time · updates every 10 minutes" title="🇮🇳 Live India Health Pulse" desc="Real air quality, weather and outbreak data streaming now — not screenshots. Plan walks, travel and clinic visits around it." id="live-pulse" />
          <IndiaPulseDashboard />
        </section>

        {/* ============ SOLUTIONS ============ */}
        <section aria-labelledby="solutions">
          <div className="mb-5 flex items-end justify-between gap-4">
            <SectionHeading eyebrow="New · every medical solution" title="One condition, every solution path" desc="Modern, Ayurveda, herbs, nutrition, yoga, mind, tests — compared side by side for 24 conditions." id="solutions" />
            <Link href="/solutions" className="hidden shrink-0 items-center gap-1 rounded-xl bg-stone-900 px-4 py-2 text-sm font-bold text-white hover:bg-stone-700 sm:flex">Open finder <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <Link key={p.slug} href="/solutions" className="premium-card rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-teal-600 text-white">{PILLAR_ICONS[p.icon]}</span>
                <h3 className="mt-2.5 text-sm font-bold">{p.name}</h3>
                <p className="mt-0.5 line-clamp-2 text-[12px] text-stone-500">{p.tagline}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2"><NewsStrip /></div>
          <HealthTipOfDay />
        </div>

        {/* ============ DISEASES ============ */}
        <section aria-labelledby="popular-diseases">
          <div className="mb-5 flex items-end justify-between gap-4">
            <SectionHeading eyebrow="Disease directory" title="Popular disease guides" desc="Each guide: symptoms, tests, medicines, Ayurveda, herbs, diet, yoga and red flags." id="popular-diseases" />
            <Link href="/diseases" className="hidden shrink-0 items-center gap-1 rounded-xl border px-4 py-2 text-sm font-bold hover:border-emerald-300 sm:flex">All 120+ <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularDiseases.map((d) => (
              <TopicCard key={d.slug} href={`/diseases/${d.slug}`} title={d.name} hindi={d.hindiName} desc={d.short} icon={<Stethoscope className="h-5 w-5" />} badge={<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">{d.system}</span>} />
            ))}
          </div>
        </section>

        {/* ============ EVIDENCE + IMAGE BAND ============ */}
        <section className="grid gap-4 lg:grid-cols-2" aria-labelledby="evidence">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900 md:p-8">
            <SectionHeading eyebrow="How we rate" title="Evidence, explained honestly" desc="Traditional wisdom and clinical proof shown separately — never mixed." id="evidence" />
            <div className="flex flex-wrap gap-2">
              {(["strong", "moderate", "limited", "mixed", "insufficient"] as const).map((l) => <EvidenceBadge key={l} level={l} />)}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">We never present herbs or homeopathy as proven cures where evidence is absent, and never advise stopping prescribed medicines. <Link href="/about" className="font-semibold text-emerald-700 underline">Editorial policy →</Link></p>
          </div>
          <div className="premium-shadow relative overflow-hidden rounded-3xl">
            <Image src={IMG.ayurvedaSpices} alt={IMG.ayurvedaSpicesAlt} width={1200} height={627} loading="lazy" sizes="(max-width: 1024px) 100vw, 50vw" className="h-full min-h-[260px] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/20 to-transparent" />
            <div className="absolute bottom-0 p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">Ayurveda portal</p>
              <h3 className="font-display mt-1 text-2xl font-bold text-white">Ancient wisdom, modern honesty.</h3>
              <div className="mt-3 flex gap-2">
                <Link href="/ayurveda" className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-stone-900 hover:bg-amber-100">Explore Ayurveda</Link>
                <Link href="/herbs" className="rounded-xl border border-white/40 px-4 py-2 text-xs font-bold text-white hover:bg-white/10">20 herbs graded</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Herbs */}
        <section aria-labelledby="herbs">
          <div className="mb-5 flex items-end justify-between gap-4">
            <SectionHeading eyebrow="Traditional wellness" title="Herbs with honest grades" desc="Safety, interactions, pregnancy notes and quality checks on every profile." id="herbs" />
            <Link href="/herbs" className="hidden shrink-0 items-center gap-1 rounded-xl border px-4 py-2 text-sm font-bold hover:border-emerald-300 sm:flex">All herbs <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {herbs.map((h) => (
              <TopicCard key={h.slug} href={`/herbs/${h.slug}`} title={h.name} hindi={h.hindiName} desc={h.short} icon={<Leaf className="h-5 w-5" />} badge={<EvidenceBadge level={h.evidenceLevel} />} />
            ))}
          </div>
        </section>

        {/* Medicines dark band */}
        <section className="premium-shadow rounded-3xl bg-gradient-to-br from-stone-950 via-emerald-950 to-stone-950 p-6 text-white md:p-8" aria-labelledby="medicines">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">Allopathy medicines</p>
          <h2 className="font-display mt-1 text-2xl font-bold md:text-3xl" id="medicines">Modern medicines, explained safely</h2>
          <p className="mt-1.5 max-w-3xl text-sm text-emerald-100/80">Educational only. No doses, no prescriptions, no stop-change advice — plus a live FDA label lookup below.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {meds.map((m) => (
              <Link key={m.slug} href={`/medicines/${m.slug}`} className="premium-card rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur hover:bg-white/10">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300"><Pill className="h-4 w-4" /></span>
                <h3 className="mt-2 font-bold">{m.genericName}</h3>
                <p className="text-xs text-emerald-100/70">{m.drugClass}</p>
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-emerald-50/80">{m.short}</p>
              </Link>
            ))}
          </div>
          <Link href="/medicines" className="mt-5 inline-flex items-center gap-1 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20">All medicines <ArrowRight className="h-4 w-4" /></Link>
        </section>

        {/* ============ LIVE LOOKUPS ============ */}
        <section aria-labelledby="lookups">
          <SectionHeading eyebrow="Interactive · live label data" title="Check a medicine. Scan a food." desc="Real FDA labels and real packaged-food nutrition — type anything and see." id="lookups" />
          <div className="grid gap-4 lg:grid-cols-2">
            <DrugLookup />
            <FoodLookup />
          </div>
        </section>

        {/* Nutrition + charts + thali image */}
        <section aria-labelledby="nutrition">
          <div className="mb-5 flex items-end justify-between gap-4">
            <SectionHeading eyebrow="Nutrition portal" title="Indian foods that heal habits" desc="Millets, pulses, curd and smart plates — nutrients, servings and cautions." id="nutrition" />
            <Link href="/nutrition" className="hidden shrink-0 items-center gap-1 rounded-xl border px-4 py-2 text-sm font-bold hover:border-emerald-300 sm:flex">Nutrition portal <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="premium-shadow relative overflow-hidden rounded-2xl">
              <Image src={IMG.thali} alt={IMG.thaliAlt} width={1200} height={627} loading="lazy" sizes="(max-width: 1024px) 100vw, 33vw" className="h-full min-h-[220px] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 to-transparent" />
              <div className="absolute bottom-0 p-5">
                <p className="font-display text-lg font-bold text-white">The balanced Indian thali</p>
                <Link href="/diet" className="mt-1 inline-block text-xs font-bold text-amber-300 underline">7 diet plans →</Link>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-2">
              {foods.map((f) => (
                <TopicCard key={f.slug} href={`/nutrition/${f.slug}`} title={f.name} hindi={f.hindiName} desc={f.short} icon={<Salad className="h-5 w-5" />} badge={<span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800 dark:bg-amber-900 dark:text-amber-200">{f.category}</span>} />
              ))}
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <RiskBarChart title="Which habits move diabetes risk most?" source="BHG editorial synthesis of lifestyle-trial literature (illustrative ranking)" data={[{ name: "Weight 7–10% ↓", value: 58 }, { name: "150 min activity", value: 44 }, { name: "Fibre + millets", value: 32 }, { name: "Sleep 7–8 h", value: 24 }, { name: "Single herb", value: 8 }]} />
            <NutrientDonut title="Ragi vs white rice (fibre + calcium pattern)" source="Indian Food Composition Tables (approximate, per 100 g)" data={[{ name: "Ragi fibre+Ca", value: 68 }, { name: "Rice fibre+Ca", value: 32 }]} />
            <PlateVisual />
          </div>
        </section>

        {/* Yoga banner */}
        <section className="premium-shadow relative overflow-hidden rounded-3xl" aria-labelledby="yoga">
          <Image src={IMG.yogaWater} alt={IMG.yogaWaterAlt} width={1200} height={627} loading="lazy" sizes="100vw" className="h-64 w-full object-cover md:h-80" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-950/50 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center p-6 md:p-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300" id="yoga">Yoga & fitness</p>
            <h2 className="font-display mt-1 max-w-md text-2xl font-bold text-white md:text-4xl">Ten minutes a day changes your sugar, BP and sleep.</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/yoga" className="btn-shine rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-stone-950 hover:bg-amber-400">Start moving</Link>
              <Link href="/health-calculators" className="rounded-xl border border-white/40 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10">Check BMI + IDRS</Link>
            </div>
          </div>
        </section>

        {/* Calculators + Labs */}
        <section className="grid gap-6 lg:grid-cols-2" aria-labelledby="tools">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600">Interactive tools</p>
            <h2 className="font-display mt-1 text-2xl font-bold" id="tools">Health calculators</h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">BMI, IDRS diabetes score, calories, protein, water, heart-risk — estimates only, never diagnoses.</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {["BMI", "IDRS Score", "Calories", "Protein", "Water", "Heart risk"].map((l) => (
                <Link key={l} href="/health-calculators" className="flex items-center gap-2 rounded-xl border border-stone-200 p-3 font-semibold hover:border-emerald-300 hover:bg-emerald-50 dark:border-stone-700 dark:hover:bg-stone-800"><Calculator className="h-4 w-4 text-emerald-600" />{l}</Link>
              ))}
            </div>
            <Link href="/health-calculators" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-700 underline">Open all calculators →</Link>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600">Lab-test education</p>
            <h2 className="font-display mt-1 text-2xl font-bold">Understand your reports</h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">What HbA1c, TSH, lipids and creatinine actually mean — and what to ask your doctor.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {labs.map((l) => (
                <Link key={l.slug} href={`/lab-tests/${l.slug}`} className="flex items-center gap-1.5 rounded-full border border-stone-200 px-3.5 py-2 text-[13px] font-semibold hover:border-emerald-300 hover:bg-emerald-50 dark:border-stone-700 dark:hover:bg-stone-800"><FlaskConical className="h-3.5 w-3.5 text-emerald-600" />{l.shortName || l.name}</Link>
              ))}
            </div>
            <Link href="/lab-tests" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-700 underline">All lab guides →</Link>
          </div>
        </section>

        {/* Health areas */}
        <section aria-labelledby="areas">
          <SectionHeading eyebrow="For everyone" title="Health areas" desc="Lifespan care from periods to prostate, exams to aging." id="areas" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            {[
              { label: "Women's Health", href: "/womens-health", icon: <Users className="h-5 w-5" /> },
              { label: "Men's Health", href: "/mens-health", icon: <PersonStanding className="h-5 w-5" /> },
              { label: "Child Health", href: "/child-health", icon: <Baby className="h-5 w-5" /> },
              { label: "Mental Wellness", href: "/mental-wellness", icon: <Brain className="h-5 w-5" /> },
              { label: "Yoga & Fitness", href: "/yoga", icon: <Activity className="h-5 w-5" /> },
              { label: "Diet Plans", href: "/diet", icon: <Apple className="h-5 w-5" /> },
            ].map((a) => (
              <Link key={a.label} href={a.href} className="premium-card flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white p-5 text-center hover:border-emerald-300 dark:border-stone-700 dark:bg-stone-900">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-amber-100 text-emerald-800 dark:from-emerald-900 dark:to-amber-900 dark:text-amber-200">{a.icon}</span>
                <span className="text-sm font-bold">{a.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured guides */}
        <section aria-labelledby="featured">
          <div className="mb-5 flex items-end justify-between gap-4">
            <SectionHeading eyebrow="Cornerstone guides" title="Featured long-form guides" desc="Deep, structured reads that anchor our topic clusters." id="featured" />
            <Link href="/blog" className="hidden shrink-0 items-center gap-1 rounded-xl border px-4 py-2 text-sm font-bold hover:border-emerald-300 sm:flex">All articles <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {featured.map((a) => (
              <Link key={a.slug} href={`/blog/${a.slug}`} className="premium-card overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
                <div className="relative h-44 w-full">
                  <Image src={a.heroImage} alt={a.heroImageAlt} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" loading="lazy" />
                </div>
                <div className="p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">{a.category} · {a.readMinutes} min</p>
                  <h3 className="font-display mt-1 text-lg font-bold leading-snug">{a.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-stone-600 dark:text-stone-300">{a.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
          {trending.length > 0 && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Trending this week</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {trending.map((t) => <Link key={t.slug} href={`/blog/${t.slug}`} className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold shadow-sm hover:bg-amber-100 dark:bg-stone-900 dark:hover:bg-stone-800">{t.title}</Link>)}
              </div>
            </div>
          )}
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq">
          <SectionHeading eyebrow="Good to know" title="Questions, answered honestly" desc="How this site works and what it will never do." id="faq" />
          <div className="grid gap-3 md:grid-cols-2">
            {FAQS.map((f) => (
              <div key={f.q} className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
                <h3 className="font-bold">{f.q}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Products */}
        <section aria-labelledby="products">
          <div className="mb-5 flex items-end justify-between gap-4">
            <SectionHeading eyebrow="Affiliate disclosure applies" title="Popular products" desc="Monitors, foods and yoga gear — never with false medical claims." id="products" />
            <Link href="/products" className="hidden shrink-0 items-center gap-1 rounded-xl border px-4 py-2 text-sm font-bold hover:border-emerald-300 sm:flex">All products <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.slice(0, 4).map((p) => (
              <Link key={p.slug} href={`/products/${p.slug}`} className="premium-card rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{p.category}</p>
                <h3 className="mt-1 font-bold leading-snug">{p.name}</h3>
                <p className="mt-1 line-clamp-2 text-[13px] text-stone-600 dark:text-stone-300">{p.short}</p>
                <p className="mt-2 text-xs font-semibold text-emerald-700">{p.pricePlaceholder} · {p.cta} →</p>
              </Link>
            ))}
          </div>
        </section>

        <AdSlot slot="Article footer" />
        <div id="newsletter" className="scroll-mt-28"><Newsletter /></div>
        <DisclaimerBar />
      </div>
    </div>
  );
}
