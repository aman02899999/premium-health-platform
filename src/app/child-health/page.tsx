import type { Metadata } from "next";
import Link from "next/link";
import { Baby, ShieldAlert } from "lucide-react";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Child Health — Growth, Nutrition, Vaccines India | BHG";
const seoDescription = "Parent-friendly primers on growth, anemia, vitamin D, fever care and when children need urgent evaluation. Extra safety, weight-based dosing warning. SEO pro + lead gen.";
const url = "/child-health";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Child Health — Growth India")}&category=${encodeURIComponent("Child Health")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

const TOPICS = [
  { t: "Growth & Protein", d: "Milk + eggs/paneer/soya + pulses daily; track height-weight on growth charts, not neighbours' kids. Use /child-growth tracker WHO percentiles." },
  { t: "Anemia & Vitamin D", d: "Test Hb, ferritin and 25-OH D for fatigue or frequent illness; iron + vitamin C, away from chai. See /india-risk anemia + /blog/anemia-mukt-bharat-home-guide." },
  { t: "Fever Care", d: "Paracetamol by weight + fluids; avoid self-antibiotics and NSAIDs if dengue suspected. >3 days or breathless/dehydrated = doctor. See /diseases/fever." },
  { t: "Screen & Sleep", d: "No screens 1 hour before bed; 9–11 hours sleep for schoolkids powers immunity and learning. See /mental-wellness + /yoga." },
  { t: "Vaccines", d: "Follow national immunisation schedule via pediatrician — no delays without medical reason. See /diseases/vaccines." },
  { t: "Red Flags", d: "Breathing difficulty, persistent vomiting, dehydration, seizures, rash with fever, or unusually sleepy child = urgent care 102/108." },
];

export default function ChildPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Child Health" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Child Health", item: "/child-health" }]}
        faqs={[
          { q: "How to track child growth?", a: "WHO percentiles: height, weight, head circumference — <3rd or >97th or crossing 2 lines needs evaluation. Use /child-growth tracker + IAP India reference." },
          { q: "When to worry about fever in child?", a: "Fever >3 days, <3 months old any fever, lethargy, rash, breathing difficulty, dehydration, seizures = urgent care 102/108. Paracetamol by weight, no aspirin, no self-antibiotics." },
        ]}
        howTo={{ name: "How to use child health hub", steps: ["Pick topic: growth, anemia, vitamin D, fever, screen & sleep, vaccines, red flags", "Read parent-friendly primers + safety + weight-based dosing warning", "Use child-growth tracker + nutrition-tracker + calculators", "Book pediatric consult via lead form if red flags"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-sky-800 to-emerald-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-200">SEO Pro — Earning Platform — Child Health — Safety + FAQ+HowTo+OG</p>
        <h1 className="font-display mt-1 flex items-center gap-2 text-3xl font-black md:text-4xl"><Baby className="h-7 w-7" /> Child Health — Growth, Nutrition, Vaccines — India — Safety First</h1>
        <p className="mt-2 max-w-2xl text-sm text-sky-100/90">Parent-friendly primers with extra safety. Doses weight-based and individual — this site never provides personalised pediatric dosing. Always follow pediatrician. SEO HowTo+FAQ+OG+PremiumCTA+Affiliate.</p>
        <p className="mt-3 flex max-w-2xl items-start gap-2 rounded-2xl bg-white/10 p-3 text-xs"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /> Never give aspirin to children, never guess antibiotic doses, and keep iron/paracetamol syrups locked away — accidental overdose is dangerous.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((x) => (
              <div key={x.t} className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
                <h3 className="font-bold">{x.t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{x.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm">Related: <Link href="/diseases/anemia" className="font-bold text-emerald-700 underline">anemia</Link> · <Link href="/diseases/vitamin-d-deficiency" className="font-bold text-emerald-700 underline">vitamin D</Link> · <Link href="/diseases/fever" className="font-bold text-emerald-700 underline">fever guide</Link> · <Link href="/child-growth" className="font-bold text-emerald-700 underline">growth tracker →</Link> · <Link href="/nutrition-tracker" className="font-bold text-emerald-700 underline">nutrition tracker →</Link></p>
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={4} title="Child Health — Nutrition + Growth — Affiliate" />
            <LatestArticles limit={4} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Child Health is SEO Pro + Earning</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>6 topics: growth & protein, anemia & vitamin D, fever care, screen & sleep, vaccines, red flags — IAP + safety</li>
              <li>Earning: child nutrition + growth tracker affiliate + premium history + lead gen pediatric</li>
              <li>SEO: FAQ + HowTo + Breadcrumb + OG /api/og + internal linking child-growth/nutrition-tracker/diseases/blog</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Child health footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
