import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { WorkoutBuilder } from "@/components/health/workout-builder";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Workout Builder — India Home Gym No Equipment | BHG";
const seoDescription = "Build home workout: no equipment, India heat + space friendly — beginner to advanced. Unique India, premium + affiliate earning.";
const url = "/workout-builder";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Workout Builder — Home Gym India")}&category=${encodeURIComponent("Workout India")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Workout India" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Workout India", item: "/workout-builder" }]}
        faqs={[{"q":"Can I workout at home without equipment?","a":"Yes — bodyweight: squats, pushups, planks, surya namaskar. Builder gives 15-30 min plans, heat-friendly morning/evening timing."},{"q":"How to start workout after long gap?","a":"Start 3 days/week 15 min, warm-up 5 min, cool-down. Avoid if chest pain, dizziness. Increase 10% weekly. Premium gives progression."}]}
        howTo={{ name: "How to build workout", steps: ["Pick goal: weight loss, strength, diabetes, beginner","Select days, time, equipment: none / dumbbells / bands","Get plan: warm-up + main + cool-down + calories","Save plan in premium, track streaks, get WhatsApp nudge"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-red-800 to-orange-700 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-200">Unique India — Earning Platform — SEO Pro</p>
        <h1 className="font-display mt-1 text-3xl font-black">Workout Builder — Home Gym No Equipment — India Friendly</h1>
        <p className="mt-2 max-w-2xl text-sm text-red-100/90">Build home workout: no equipment, India heat + space friendly — beginner to advanced. Unique India. SEO HowTo+FAQ+OG+PremiumCTA+Affiliate.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <WorkoutBuilder />
          <AffiliateProducts limit={4} title="Dumbbells + Yoga Mat — Affiliate" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Why Workout India is Unique India</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>India-first: Workout India with Indian context, INR, FSSAI, ICMR</li>
              <li>Earning: affiliate + premium + lead gen + ad — pro platform</li>
              <li>SEO: FAQ (2) + HowTo 4 steps + Breadcrumb JSON-LD + OG /api/og + internal linking</li>
              <li>Digital marketing: UTM capture, gtag events, newsletter, exit-intent, sticky CTA</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Workout footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
