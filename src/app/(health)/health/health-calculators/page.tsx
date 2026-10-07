import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/health/components/ui";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/health/components/earning/AffiliateProducts";
import { LatestArticles } from "@/health/components/blog/LatestArticles";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import Link from "next/link";
import { SITE } from "@/health/lib/site";
import { CALCULATOR_PAGES } from "@/health/data/calculator-pages";
import { BmiCalc, CalorieCalc, ProteinCalc, WaterCalc, WaistHeightCalc, DiabetesRiskQuiz, HeartRiskEdu, IdealWeight } from "@/health/components/tools";

const seoTitle = "Health Calculators — BMI, Calories, Protein, Diabetes Risk | Premium Health";
const seoDescription = "Free Indian health calculators: pregnancy due date, ovulation, BMI (Asian cut-offs), calories & macros, body fat, protein, water and diabetes risk.";
const url = "/health/health-calculators";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Health Calculators — BMI India")}&category=${encodeURIComponent("Calculators")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Calculators" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Calculators", item: "/health/health-calculators" }]}
        faqs={[{"q":"Are BMI cut-offs different for Indians?","a":"Yes — Asian Indian BMI: 18.5-22.9 normal, 23-24.9 overweight, ≥25 obese (WHO Asia-Pacific). Higher body fat at lower BMI vs Europeans. Calculator uses Asian cut-offs."},{"q":"How to calculate diabetes risk?","a":"IDRS + waist + family history + activity — DiabetesRiskQuiz gives educational risk, not diagnosis. Confirm with HbA1c, fasting. See /india-risk for IDRS."}]}
        howTo={{ name: "How to use health calculators", steps: ["Pick calculator: BMI, calories, protein, water, waist-height, diabetes risk, heart risk, ideal weight","Enter Indian inputs: age, height, weight, waist, activity, roti portions","View result with Asian cut-offs + honest limits + next steps","Save history in premium, track trends, get weekly PDF"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-teal-800 to-emerald-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-200">Calculators</p>
        <h1 className="font-display mt-1 text-3xl font-black">Health Calculators — BMI, Calories, Protein, Diabetes Risk — Asian Cut-offs</h1>
        <p className="mt-2 max-w-2xl text-sm text-teal-100/90">Asian cut-offs, Indian portions, honest limits. Every result is an estimate for education — confirm with lab tests and doctor.</p>
      </div>

      <section className="mt-6" aria-labelledby="full-tools">
        <h2 id="full-tools" className="font-display text-xl font-bold">Full calculators</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {CALCULATOR_PAGES.map((c) => (
            <Link key={c.slug} href={`/health/health-calculators/${c.slug}`} className="group rounded-2xl border border-stone-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md dark:border-stone-700 dark:bg-stone-900">
              <p className="font-bold group-hover:text-emerald-700 dark:group-hover:text-emerald-300">{c.name}</p>
              <p className="mt-1 line-clamp-3 text-xs text-stone-500">{c.intro}</p>
              <p className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">Open →</p>
            </Link>
          ))}
        </div>
      </section>

      <h2 className="font-display mt-8 text-xl font-bold">Quick checks</h2>
      <div className="mt-3 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid gap-4 md:grid-cols-2"><BmiCalc /><IdealWeight /><CalorieCalc /><ProteinCalc /><WaterCalc /><WaistHeightCalc /><DiabetesRiskQuiz /><HeartRiskEdu /></div>
          <AffiliateProducts limit={4} title="Weighing Scale + Measuring Tape — Affiliate" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Calculators footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
