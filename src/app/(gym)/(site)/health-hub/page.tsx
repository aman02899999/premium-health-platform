import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { HUB } from "@/lib/hub";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { absoluteUrl, telHref, whatsappHref } from "@/lib/site";
import { Icon } from "@/components/Icon";
import { PageHero } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";
import { CtaCard } from "@/components/blog/CtaCard";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Free Health & Fitness Hub — Workouts, Diet & Tools",
    description: `Free workout planner, exercise library, Indian food tracker, diet plans, calculators and gym timers from ${c.business.name}, Noida.`,
    path: "/health-hub",
  });
}

export default async function HubPage() {
  const c = await getContent();
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Health Hub", path: "/health-hub" }]),
          { "@context": "https://schema.org", "@type": "ItemList", itemListElement: HUB.map((h, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(h.href), name: h.title })) },
        ]}
      />
      <PageHero eyebrow="Free for everyone" title="Health & Fitness" highlight="Hub" intro="Everything you need to train and eat right — planners, trackers and guides built for Indian bodies and Indian food." />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {HUB.map((h, i) => (
          <Reveal key={h.href} delay={(i % 4) * 70}>
            <TiltCard className="group h-full rounded-3xl" max={12}>
              <Link href={h.href} className="glass brand-border flex h-full flex-col rounded-3xl p-7">
                <span className="pop-3d flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/30 to-brand/5 ring-1 ring-brand/40">
                  <Icon name={h.icon} className="h-7 w-7 text-brand" />
                </span>
                <h2 className="mt-5 text-xl font-bold text-white">{h.title}</h2>
                <p className="mt-2 flex-1 text-sm text-white/60">{h.text}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                  Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </TiltCard>
          </Reveal>
        ))}
      </section>
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <CtaCard whatsapp={whatsappHref(c.business)} phone={telHref(c.business.phone)} />
      </div>
    </>
  );
}
