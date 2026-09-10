import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Siren } from "lucide-react";
import { SYMPTOMS } from "@/data/clinical";
import { Breadcrumbs, TopicCard, AdSlot, DisclaimerBar } from "@/components/ui";
import { SymptomChecker } from "@/components/tools";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Symptoms Checker — Chest Pain, Fatigue, Headache | BHG";
const seoDescription = "Symptoms guide: chest pain, fatigue, headache — when to worry, red flags, what to track. Educational, not diagnosis. SEO pro + lead gen earning.";
const url = "/symptoms";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Symptoms — Checker India")}&category=${encodeURIComponent("Symptoms")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

const URGENCY_COLOR: Record<string, string> = {
  "self-care": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  routine: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  prompt: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  emergency: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function SymptomsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Symptoms" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Symptoms", item: "/symptoms" }]}
        faqs={[
          { q: "When is chest pain emergency?", a: "Crushing chest pain + sweating + breathlessness + radiation to arm/jaw — call emergency 102/108. Don't drive self. Educational, not triage." },
          { q: "Can symptoms checker diagnose?", a: "No — educational only. Checker lists red flags + what to track + when to see doctor. For emergency, call 102/108." },
        ]}
        howTo={{ name: "How to check symptom", steps: ["Pick symptom: e.g., chest pain, fatigue, headache", "Check red flags + common causes + what to track", "Use interactive checker to log duration, severity, triggers", "Book consult via lead form if red flags — earning platform"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-rose-900 via-red-900 to-emerald-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-200">SEO Pro — Earning Platform — Symptoms — Lead Gen</p>
        <h1 className="font-display mt-1 text-3xl font-black md:text-4xl">Symptoms Checker — Chest Pain, Fatigue, Headache — India Guide</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90">Educational triage only — <strong>never a diagnosis</strong>. Select a symptom to see possible categories, questions to consider and urgency. Emergency patterns show prominent warnings. SEO HowTo+FAQ+OG+LeadGen.</p>
        <p className="mt-3 flex max-w-2xl items-start gap-2 rounded-2xl bg-red-500/20 p-3 text-xs"><Siren className="mt-0.5 h-4 w-4 shrink-0" /> Chest pain, severe breathlessness, stroke signs, severe bleeding or loss of consciousness need emergency care immediately — do not use this tool instead.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-display mt-2 text-2xl font-bold">Interactive checker</h2>
          <div className="mt-4"><SymptomChecker /></div>
          <h2 className="font-display mt-10 text-2xl font-bold">Browse symptoms — {SYMPTOMS.length} symptoms</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SYMPTOMS.map((s) => (
              <TopicCard key={s.slug} href={`/symptoms/${s.slug}`} title={s.name} desc={s.short} icon={<Activity className="h-5 w-5" />} badge={<span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${URGENCY_COLOR[s.urgency]}`}>{s.urgency}</span>} />
            ))}
          </div>
          <p className="mt-6 text-sm text-stone-600">Related: <Link href="/diseases" className="font-bold text-emerald-700 underline">diseases</Link> · <Link href="/lab-tests" className="font-bold text-emerald-700 underline">lab tests</Link> · <Link href="/health-qa" className="font-bold text-emerald-700 underline">health Q&A</Link></p>
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={4} title="Health Monitoring — Affiliate" />
            <LatestArticles limit={4} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Symptoms is SEO Pro + Earning</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>{SYMPTOMS.length} symptoms with urgency color + red flags</li>
              <li>Earning: lab bookings + dietitian consults via /api/lead Rs150-500/lead</li>
              <li>SEO: FAQ + HowTo + Breadcrumb + OG /api/og + internal linking to diseases/lab-tests/health-qa</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Symptoms footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
