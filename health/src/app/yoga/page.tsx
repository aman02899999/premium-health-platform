import type { Metadata } from "next";
import Link from "next/link";
import { Activity } from "lucide-react";
import { Breadcrumbs, AdSlot, InfoNote, DisclaimerBar } from "@/components/ui";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Yoga — Asanas, Pranayama, Meditation India | BHG";
const seoDescription = "Beginner yoga sequences, walking plans and strength basics with safety modifications for knees, heart, pregnancy and seniors. SEO pro + HowTo + earning.";
const url = "/yoga";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Yoga — Asanas India")}&category=${encodeURIComponent("Yoga India")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

const PLANS = [
  { title: "Morning 20 for Blood Sugar", desc: "Warm-up walk + standing flow (Tadasana, Trikonasana, Virabhadrasana) + Anulom-Vilom. Pair with 10-min post-meal walks.", tags: ["Diabetes", "Beginner"] },
  { title: "Desk-Worker Back Rescue", desc: "Cat-cow, Bhujangasana, Setu Bandha + core (dead-bug, bird-dog). 15 min/day + hourly stand breaks.", tags: ["Back pain", "Posture"] },
  { title: "BP-Friendly Movement", desc: "Brisk walking 30 min + slow yoga + Bhramari breathing. Avoid breath-holding inversions with uncontrolled BP.", tags: ["Hypertension", "Walking"] },
  { title: "Senior Strength & Balance", desc: "Chair squats, wall push-ups, heel raises + single-leg balance with support. 2x/week + daily walk.", tags: ["Seniors", "Falls"] },
  { title: "PCOS Power Trio", desc: "Strength 3x/week (squat, row, press) + 8k steps + sleep 8h. Insulin sensitivity responds in weeks.", tags: ["PCOS", "Strength"] },
  { title: "Sleep-Wind-Down Flow", desc: "Gentle forward folds, Supta Baddha Konasana, Yoga Nidra 15 min. Screens off 60 min before.", tags: ["Sleep", "Stress"] },
];

export default function YogaPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Yoga & Fitness" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Yoga India", item: "/yoga" }]}
        faqs={[
          { q: "Which yoga best for diabetes?", a: "Morning 20 for Blood Sugar: warm-up walk + standing flow + Anulom-Vilom + 10 min post-meal walks — lowers HbA1c ~0.5% with diet + medicines. Educational." },
          { q: "Can I do yoga daily?", a: "Yes — 15-30 min daily safe for most. Avoid inversions if uncontrolled BP. See /yoga-timer for 4-2-4 breathing + Surya counter + safety modifications." },
        ]}
        howTo={{ name: "How to start yoga", steps: ["Pick plan: blood sugar, back rescue, BP-friendly, senior, PCOS, sleep", "Follow 20 min sequence: warm-up + flow + breathing + cool-down", "Track streak, modify for knees/heart/pregnancy", "Save plan in premium, get weekly progression + timer"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-violet-800 to-indigo-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-200">SEO Pro — Earning Platform — Yoga India — HowTo+FAQ</p>
        <h1 className="font-display mt-1 flex items-center gap-2 text-3xl font-black md:text-4xl"><Activity className="h-7 w-7" /> Yoga & Fitness — Indian Plans for Sugar, BP, Back & Sleep</h1>
        <p className="mt-2 max-w-2xl text-sm text-violet-100/90">Practical Indian movement plans — yoga, walking and strength — with safety modifications. Movement supports sugar, BP, sleep and mood; it complements medicines, never replaces them without supervision. SEO HowTo+FAQ+OG+PremiumCTA+Affiliate.</p>
      </div>
      <div className="mt-4"><InfoNote text="Uncontrolled BP (>160/100), chest pain, severe breathlessness, acute disc prolapse, recent surgery or high-risk pregnancy: get medical clearance before starting. Stop and seek care for chest pain, fainting or severe joint pain." /></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLANS.map((p) => (
              <article key={p.title} className="card-3d rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
                <div className="flex flex-wrap gap-1.5">{p.tags.map((t) => <span key={t} className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">{t}</span>)}</div>
                <h3 className="font-display mt-2 text-lg font-bold">{p.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{p.desc}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm">Go deeper: <Link href="/diseases/type-2-diabetes" className="font-bold text-emerald-700 underline">diabetes + exercise</Link> · <Link href="/diseases/back-pain" className="font-bold text-emerald-700 underline">back pain</Link> · <Link href="/blog/yoga-blood-sugar-beginners" className="font-bold text-emerald-700 underline">yoga for sugar guide</Link> · <Link href="/yoga-timer" className="font-bold text-emerald-700 underline">yoga timer →</Link> · <Link href="/workout-builder" className="font-bold text-emerald-700 underline">workout builder →</Link></p>
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={4} title="Yoga Mat + Blocks — Affiliate" />
            <LatestArticles limit={4} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Yoga is SEO Pro + Earning</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>6 plans: blood sugar, back rescue, BP-friendly, senior, PCOS, sleep — India heat friendly</li>
              <li>Earning: yoga mat + blocks affiliate + premium timer + workout-builder</li>
              <li>SEO: FAQ + HowTo + Breadcrumb + OG /api/og + internal linking to yoga-timer/workout-builder/exercises</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Yoga footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
