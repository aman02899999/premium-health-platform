import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { DIET_PLANS, dietPlanBySlug, planTotals } from "@/lib/fitness/diet-plans";
import { foodById, totals } from "@/lib/fitness/foods";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { telHref, whatsappHref } from "@/lib/site";
import { JsonLd } from "@/components/ui/JsonLd";
import { CtaCard } from "@/components/blog/CtaCard";
import { PrintButton } from "@/components/hub/PrintButton";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return DIET_PLANS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const plan = dietPlanBySlug((await params).slug);
  if (!plan) return {};
  const c = await getContent();
  const t = planTotals(plan);
  return pageMeta(c, {
    title: `${plan.title} — ${t.kcal} kcal, ${t.protein} g Protein`,
    description: `${plan.summary} Full Indian meal plan with timings, calories and protein per meal.`,
    path: `/diet-plans/${plan.slug}`,
  });
}

export default async function DietPlanPage({ params }: Props) {
  const plan = dietPlanBySlug((await params).slug);
  if (!plan) notFound();
  const c = await getContent();
  const t = planTotals(plan);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Diet Plans", path: "/diet-plans" }, { name: plan.title, path: `/diet-plans/${plan.slug}` }])} />
      <article className="mx-auto max-w-4xl px-4 pb-10 pt-36 sm:px-6 sm:pt-44">
        <Link href="/diet-plans" className="text-sm text-white/50 hover:text-brand print:hidden">
          ← All diet plans
        </Link>
        <h1 className="font-display mt-4 text-4xl text-white sm:text-6xl">{plan.title}</h1>
        <p className="mt-4 text-lg text-white/70">{plan.summary}</p>
        <p className="mt-2 text-sm text-white/50">Best for: {plan.forWho}</p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Calories", `${t.kcal}`],
            ["Protein", `${t.protein} g`],
            ["Carbs", `${t.carbs} g`],
            ["Fat", `${t.fat} g`],
            ["Fibre", `${t.fibre} g`],
          ].map(([k, v]) => (
            <div key={k} className="glass rounded-2xl p-4 text-center">
              <div className="font-display text-2xl text-brand-gradient">{v}</div>
              <div className="text-[11px] uppercase tracking-widest text-white/45">{k}</div>
            </div>
          ))}
        </div>

        <ol className="relative mt-12 space-y-6 border-l border-brand/30 pl-8">
          {plan.meals.map((meal) => {
            const mt = totals(meal.items);
            return (
              <li key={meal.name} className="relative">
                <span className="absolute -left-[41px] top-1 h-4 w-4 rounded-full bg-brand ring-4 ring-ink" />
                <div className="glass rounded-3xl p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-display text-2xl text-white">{meal.name}</h2>
                    <span className="flex items-center gap-1 text-sm text-white/55">
                      <Clock className="h-4 w-4 text-brand" /> {meal.time}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-white/80">
                    {meal.items.map((it) => {
                      const food = foodById(it.id)!;
                      return (
                        <li key={it.id} className="flex justify-between gap-4 text-sm">
                          <span>
                            {it.qty !== 1 && `${it.qty} × `}
                            {food.name} <span className="text-white/45">({food.serving})</span>
                          </span>
                          <span className="shrink-0 text-white/55">{Math.round(food.kcal * it.qty)} kcal</span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-3 border-t border-white/10 pt-2 text-xs text-brand">
                    {Math.round(mt.kcal)} kcal · {Math.round(mt.protein)} g protein
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <section className="mt-10 rounded-3xl bg-brand/10 p-6 ring-1 ring-brand/30">
          <h2 className="font-bold text-brand">Make it work</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            {plan.tips.map((tip) => (
              <li key={tip} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {tip}
              </li>
            ))}
          </ul>
        </section>
        <div className="mt-6 flex flex-wrap gap-3 print:hidden">
          <PrintButton />
          <Link href="/nutrition" className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white">
            Customise in the food tracker
          </Link>
        </div>
        <p className="mt-6 text-xs text-white/45">
          General guidance for healthy adults. If you have diabetes, kidney, thyroid or other conditions, check with your doctor or a registered dietitian first.
        </p>
        <div className="print:hidden">
          <CtaCard whatsapp={whatsappHref(c.business, `Hi ${c.business.name}, I'd like a personalised diet plan.`)} phone={telHref(c.business.phone)} />
        </div>
      </article>
    </>
  );
}
