import type { Metadata } from "next";
import Link from "next/link";
import { Brain, Phone } from "lucide-react";
import { Breadcrumbs, TopicCard, AdSlot, DisclaimerBar } from "@/components/ui";
import { getDisease } from "@/data/diseases-index";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Mental Wellness — Anxiety, Depression, Sleep India | BHG";
const seoDescription = "Compassionate, stigma-free explainers on anxiety, depression, stress and insomnia with self-care and when to seek professional help. Helplines, SEO pro + earning.";
const url = "/mental-wellness";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Mental Wellness — India")}&category=${encodeURIComponent("Mental Wellness")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function MentalPage() {
  const slugs = ["anxiety", "depression", "stress", "sleep-problems", "brain-health", "headache"];
  const items = slugs.map(getDisease).filter(Boolean);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Mental Wellness" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Mental Wellness", item: "/mental-wellness" }]}
        faqs={[
          { q: "When to seek help for anxiety?", a: "Anxiety >2 weeks affecting work/sleep, panic attacks, avoidance — see mental health professional. Helplines: Kiran 1800-599-0019, iCall, Tele-MANAS 14416." },
          { q: "How does yoga help mental wellness?", a: "Yoga + pranayama 4-2-4 + meditation + sleep hygiene helps stress + sleep — complements therapy, not substitute. See /yoga-timer + /yoga + /workout-builder." },
        ]}
        howTo={{ name: "How to use mental wellness hub", steps: ["Pick topic: anxiety, depression, stress, sleep, brain health, headache", "Read compassionate explainers + self-care foundations + when to seek professional help + helplines", "Use yoga-timer + breathing + sleep-wind-down flow + daily foundations", "Book consult via lead form if needed + emergency Tele-MANAS 14416"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-violet-900 to-emerald-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-200">SEO Pro — Earning Platform — Mental Wellness — Helplines + FAQ+HowTo+OG</p>
        <h1 className="font-display mt-1 flex items-center gap-2 text-3xl font-black md:text-4xl"><Brain className="h-7 w-7" /> Mental Wellness — Anxiety, Depression, Stress & Sleep — India</h1>
        <p className="mt-2 max-w-2xl text-sm text-violet-100/90">Anxiety, low mood, stress and poor sleep are health conditions — not character flaws. Learn self-care foundations and when professional help (therapy, medicines) helps most. SEO HowTo+FAQ+OG+PremiumCTA+Affiliate.</p>
        <p className="mt-3 flex max-w-2xl items-start gap-2 rounded-2xl bg-white/10 p-3 text-xs"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /> If you have thoughts of harming yourself, reach out immediately — call India's Tele-MANAS helpline 14416 or 1-800-891-4416, or go to nearest emergency. You deserve support right now.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((d) => d && <TopicCard key={d.slug} href={`/diseases/${d.slug}`} title={d.name} hindi={d.hindiName} desc={d.short} />)}
          </div>
          <div className="mt-6 grid gap-4 rounded-3xl border border-stone-200 bg-white p-6 text-sm leading-relaxed md:grid-cols-3 dark:border-stone-700 dark:bg-stone-900">
            <div><h3 className="font-bold">Daily foundations — SEO + Earning</h3><p className="mt-1 text-stone-600 dark:text-stone-300">Fixed wake time, morning light, 30-min walk, limited alcohol/caffeine, screens off before bed. See /yoga + /yoga-timer + /workout-builder.</p></div>
            <div><h3 className="font-bold">Talk helps — stigma-free</h3><p className="mt-1 text-stone-600 dark:text-stone-300">Trusted friend, counsellor or psychiatrist — therapy and medicines effective, especially combined. Helplines Kiran 1800-599-0019, Tele-MANAS 14416.</p></div>
            <div><h3 className="font-bold">Check the body — lab tests</h3><p className="mt-1 text-stone-600 dark:text-stone-300">Thyroid, B12, D, anemia and sleep apnea mimic low mood — rule them out via <Link href="/lab-tests/tsh" className="text-emerald-700 underline">TSH</Link> + basics + /lab-tests.</p></div>
          </div>
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={4} title="Mental Wellness — Books + Yoga — Affiliate" />
            <LatestArticles limit={4} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Mental Wellness is SEO Pro + Earning</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>6 topics: anxiety, depression, stress, sleep-problems, brain-health, headache + daily foundations + talk helps + check body</li>
              <li>Earning: books + yoga mat + meditation app affiliate + premium + lead gen</li>
              <li>SEO: FAQ + HowTo + Breadcrumb + OG /api/og + ItemList JSON-LD + helplines + internal linking yoga-timer/lab-tests</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Mental wellness footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
