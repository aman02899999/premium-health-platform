import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";
import { BmiCalc, CalorieCalc, ProteinCalc, WaterCalc, WaistHeightCalc, DiabetesRiskQuiz, HeartRiskEdu, IdealWeight } from "@/components/tools";

const seoTitle = "Health Calculators — BMI, Calories, Protein, Diabetes Risk | Premium Health";
const seoDescription = "8 interactive Indian health calculators with Asian cut-offs: BMI, calories, protein, water, waist-height, diabetes & heart risk. Estimates only.";
const url = "/health-calculators";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Health Calculators — BMI India")}&category=${encodeURIComponent("Calculators")}&type=tool`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Calculators" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Calculators", item: "/health-calculators" }]}
        faqs={[{"q":"Are BMI cut-offs different for Indians?","a":"Yes — Asian Indian BMI: 18.5-22.9 normal, 23-24.9 overweight, ≥25 obese (WHO Asia-Pacific). Higher body fat at lower BMI vs Europeans. Calculator uses Asian cut-offs."},{"q":"How to calculate diabetes risk?","a":"IDRS + waist + family history + activity — DiabetesRiskQuiz gives educational risk, not diagnosis. Confirm with HbA1c, fasting. See /india-risk for IDRS."}]}
        howTo={{ name: "How to use health calculators", steps: ["Pick calculator: BMI, calories, protein, water, waist-height, diabetes risk, heart risk, ideal weight","Enter Indian inputs: age, height, weight, waist, activity, roti portions","View result with Asian cut-offs + honest limits + next steps","Save history in premium, track trends, get weekly PDF"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-teal-800 to-emerald-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-200">Calculators</p>
        <h1 className="font-display mt-1 text-3xl font-black">Health Calculators — BMI, Calories, Protein, Diabetes Risk — Asian Cut-offs</h1>
        <p className="mt-2 max-w-2xl text-sm text-teal-100/90">Asian cut-offs, Indian portions, honest limits. Every result is an estimate for education — confirm with lab tests and doctor.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
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
