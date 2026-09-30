import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { DIET_PLANS, planTotals } from "@/lib/fitness/diet-plans";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Indian Diet Plans for Fat Loss & Muscle Gain (Veg & Non-Veg)",
    description: "Free Indian diet charts for fat loss and muscle gain — vegetarian and non-vegetarian, with calories and protein for every meal.",
    path: "/diet-plans",
  });
}

export default function DietPlansPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Health Hub", path: "/health-hub" }, { name: "Diet Plans", path: "/diet-plans" }])} />
      <PageHero eyebrow="Diet plans" title="Ghar ka khana," highlight="done right" intro="Four realistic Indian meal plans, timed around morning and evening gym batches. Every number is calculated from our food database." />
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-2">
        {DIET_PLANS.map((p, i) => {
          const t = planTotals(p);
          return (
            <Reveal key={p.slug} delay={(i % 2) * 90}>
              <TiltCard className="group h-full rounded-3xl" max={7}>
                <Link href={`/diet-plans/${p.slug}`} className="glass gold-border flex h-full flex-col rounded-3xl p-7">
                  <span className="flex gap-2 text-xs font-bold uppercase tracking-widest">
                    <span className={p.goal === "fat-loss" ? "text-red-300" : "text-emerald-300"}>{p.goal === "fat-loss" ? "Fat loss" : "Muscle gain"}</span>
                    <span className="text-white/40">·</span>
                    <span className="text-gold">{p.diet === "veg" ? "Vegetarian" : "Non-veg"}</span>
                  </span>
                  <h2 className="font-display mt-3 text-3xl text-white">{p.title}</h2>
                  <p className="mt-2 flex-1 text-white/65">{p.summary}</p>
                  <div className="pop-3d mt-6 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-black/30 py-3">
                      <div className="font-display text-2xl text-gold-gradient">{t.kcal}</div>
                      <div className="text-[11px] text-white/50">kcal</div>
                    </div>
                    <div className="rounded-xl bg-black/30 py-3">
                      <div className="font-display text-2xl text-white">{t.protein}g</div>
                      <div className="text-[11px] text-white/50">protein</div>
                    </div>
                    <div className="rounded-xl bg-black/30 py-3">
                      <div className="font-display text-2xl text-white">{p.meals.length}</div>
                      <div className="text-[11px] text-white/50">meals</div>
                    </div>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-gold">
                    View full plan <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </TiltCard>
            </Reveal>
          );
        })}
      </section>
    </>
  );
}
