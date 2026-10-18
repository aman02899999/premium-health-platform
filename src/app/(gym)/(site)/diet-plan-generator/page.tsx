import type { Metadata } from "next";
import { getContent } from "@/lib/content/store";
import { DIET_PLANS } from "@/lib/growth/config";
import { breadcrumbJsonLd, faqJsonLd, pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";
import { DietPreviewTool } from "@/components/diet-chart/DietPreviewTool";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Free Indian Diet Plan Generator — Calories, Protein & a Day's Menu",
    description: "Free Indian diet plan generator: your calories, protein and a full day's veg, Jain, egg or non-veg menu in roti and katori, made by the same engine as our coach-made plans.",
    path: "/diet-plan-generator",
  });
}

const FAQS = [
  { q: "How are my calories worked out?", a: "Mifflin-St Jeor BMR times your activity level, then a safe deficit or surplus for your goal: at most about 0.5% of body weight a week, never below 1,200 kcal (women) or 1,500 kcal (men), and never a deficit if your BMI is under 18.5." },
  { q: "Is this plan suitable if I have diabetes, thyroid or PCOS?", a: "No. The free day plan is for healthy adults. With a health condition, medicines, pregnancy or breastfeeding, take the coach-made plan, which adjusts carbs, protein and food choices for your condition." },
  { q: "Why only one day?", a: "One day shows you the portions and calories. The paid plan gives a full week of varied meals, a workout schedule, and a coach who reviews it." },
];

export default function DietPlanGeneratorPage() {
  const trial = DIET_PLANS.find((p) => p.trial) ?? DIET_PLANS[0];
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Tools", path: "/tools" }, { name: "Diet plan generator", path: "/diet-plan-generator" }]), faqJsonLd(FAQS)]} />
      <PageHero eyebrow="Free tool" title="Indian diet plan" highlight="generator" intro="Your daily calories and protein, and a full day's Indian menu in roti and katori. Made by the same engine as our coach-made plans; nothing you enter is stored." />
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <DietPreviewTool trialPrice={trial.priceRupees} />
      </section>
      <section className="mx-auto max-w-3xl space-y-4 px-4 pb-20 sm:px-6">
        {FAQS.map((f) => (
          <details key={f.q} className="glass rounded-2xl p-5">
            <summary className="cursor-pointer font-semibold text-white">{f.q}</summary>
            <p className="mt-2 text-white/70">{f.a}</p>
          </details>
        ))}
      </section>
    </>
  );
}
