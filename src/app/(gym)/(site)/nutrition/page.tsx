import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/lib/content/store";
import { FOODS } from "@/lib/fitness/foods";
import { breadcrumbJsonLd, faqJsonLd, pageMeta } from "@/lib/seo";
import { NutritionTracker } from "@/components/hub/NutritionTracker";
import { PageHero, SectionHeading } from "@/components/ui/Section";
import { FaqList } from "@/components/home/Blocks";
import { JsonLd } from "@/components/ui/JsonLd";
import { NextStep } from "@/components/app/NextStep";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Protein & Calories in Indian Foods — Free Food Tracker",
    description: `Protein, calories, carbs and fat for ${FOODS.length}+ Indian foods — roti, dal, paneer, chicken, eggs and more. Log your day free.`,
    path: "/nutrition",
  });
}

export default function NutritionPage() {
  const top = [...FOODS].filter((f) => f.diet === "veg").sort((a, b) => b.protein - a.protein).slice(0, 5);
  const faqs = [
    { id: "veg-protein", q: "Which Indian vegetarian foods are highest in protein?", a: `Per typical serving: ${top.map((f) => `${f.name} (${f.protein} g per ${f.serving})`).join(", ")}.` },
    { id: "roti-protein", q: "How much protein is in one roti?", a: "A medium whole-wheat roti has about 3.5 g of protein and 110 kcal." },
  ];
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Health Hub", path: "/health-hub" }, { name: "Nutrition", path: "/nutrition" }]), faqJsonLd(faqs)]} />
      <PageHero eyebrow="Indian food tracker" title="Know what's" highlight="on your plate" intro="Search common Indian foods, sort by protein, and log your meals to hit your daily targets." />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <NutritionTracker />
        <NextStep kind="food" />
        <p className="mt-8 text-center text-sm text-white/60">
          Not sure what your targets are? Use the{" "}
          <Link href="/tools/macro-calculator" className="text-brand underline">
            macro calculator
          </Link>{" "}
          or pick a ready-made{" "}
          <Link href="/diet-plans" className="text-brand underline">
            diet plan
          </Link>
          .
        </p>
      </section>
      {/* Shown on the page because the FAQ markup above may only describe visible questions. */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <SectionHeading eyebrow="FAQ" title="Protein," highlight="answered" />
        <FaqList faqs={faqs} />
      </section>
    </>
  );
}
