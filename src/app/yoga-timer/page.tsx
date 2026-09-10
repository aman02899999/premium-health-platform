import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { YogaTimer } from "@/components/health/yoga-timer";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Yoga & Pranayama Timer — 4-2-4 Breathing, Surya Namaskar | BHG";
const seoDescription = "Traditional Indian yoga timer: pranayama 4-2-4, Surya Namaskar rounds, meditation — guided breathing, hold, exhale. Unique India, premium + affiliate earning.";
const url = "/yoga-timer";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Yoga Timer — Pranayama India")}&category=${encodeURIComponent("Yoga India")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: "Yoga & Pranayama Timer" }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function YogaTimerPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Yoga Timer" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Yoga Timer", item: "/yoga-timer" }]}
        faqs={[
          { q: "What is 4-2-4 pranayama?", a: "Inhale 4 counts, hold 2, exhale 4 — beginner-friendly anulom-vilom pattern. Traditional yogic breathing, not medical advice. Stop if dizzy, avoid if uncontrolled hypertension." },
          { q: "How many Surya Namaskar per day?", a: "Beginners 3-5 rounds, intermediate 6-12, advanced 12+. Use timer to count rounds + rest 30s between. Pair with warm-up, avoid on empty stomach if diabetic on meds." },
        ]}
        howTo={{ name: "How to use yoga timer", steps: ["Choose pranayama: 4-2-4, box breathing, or Surya Namaskar counter", "Set rounds + duration, start timer with guided cues", "Follow inhale-hold-exhale audio, sit straight", "Log session, unlock premium history + weekly plan"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-violet-800 to-indigo-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-200">Unique India — Earning Platform</p>
        <h1 className="font-display mt-1 text-3xl font-black">Yoga & Pranayama Timer — 4-2-4 Breathing, Surya Namaskar</h1>
        <p className="mt-2 max-w-2xl text-sm text-violet-100/90">4-2-4 breathing, Surya Namaskar counter, meditation timer — traditional + modern, guided cues. Stop if dizzy. SEO: HowTo + FAQ + OG /api/og + PremiumCTA.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <YogaTimer />
          <AffiliateProducts limit={4} title="Yoga Mat + Blocks — Affiliate" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Yoga Timer is Unique India</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>4-2-4 pranayama — beginner-friendly, traditional Indian breathing</li>
              <li>Surya Namaskar counter + rest timer — home workout, no equipment</li>
              <li>Earning: yoga mat affiliate ₹599 + premium weekly plans</li>
              <li>SEO: FAQ (4-2-4 meaning, Surya Namaskar count) + HowTo 4 steps</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Yoga footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
