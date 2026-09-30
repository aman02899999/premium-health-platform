import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { CALCULATORS } from "@/lib/calculators";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { Icon } from "@/components/Icon";
import { PageHero } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Free Fitness Calculators — BMI, Calories, Body Fat, 1RM & More",
    description: "Free fitness calculators: BMI (Indian cut-offs), calorie/TDEE, body fat, one-rep max, macros, ideal weight, water intake and heart-rate zones.",
    path: "/tools",
  });
}

export default function ToolsPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Fitness Tools", path: "/tools" }]),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: CALCULATORS.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(`/tools/${c.slug}`), name: c.title })),
          },
        ]}
      />
      <PageHero eyebrow="Free tools" title="Fitness" highlight="calculators" intro="Instant, private (nothing leaves your browser) and tuned for Indian bodies." />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {CALCULATORS.map((t, i) => (
          <Reveal key={t.slug} delay={(i % 4) * 70}>
            <TiltCard className="group h-full rounded-3xl" max={12}>
              <Link href={`/tools/${t.slug}`} className="glass gold-border flex h-full flex-col rounded-3xl p-7">
                <span className="pop-3d flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/30 to-gold/5 ring-1 ring-gold/40">
                  <Icon name={t.icon} className="h-7 w-7 text-gold" />
                </span>
                <h2 className="mt-5 text-lg font-bold text-white">{t.title}</h2>
                <p className="mt-2 flex-1 text-sm text-white/60">{t.description}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-gold">
                  Open calculator <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </TiltCard>
          </Reveal>
        ))}
      </section>
    </>
  );
}
