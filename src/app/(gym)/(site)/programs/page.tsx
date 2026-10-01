import type { Metadata } from "next";
import { getContent } from "@/lib/content/store";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { ProgramGrid } from "@/components/home/Blocks";
import { PageHero } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";
import { CtaCard } from "@/components/blog/CtaCard";
import { telHref, whatsappHref } from "@/lib/site";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Gym Programs — Strength, Fat Loss & Personal Training in Noida",
    description: `Strength training, fat loss, personal training, cardio, women's fitness and diet guidance at ${c.business.name}, Sector 93 Noida.`,
    path: "/programs",
  });
}

export default async function ProgramsPage() {
  const c = await getContent();
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Programs", path: "/programs" }]),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: c.programs.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: { "@type": "Service", name: p.title, description: p.summary, provider: { "@type": "HealthClub", name: c.business.name }, areaServed: "Noida" },
            })),
          },
        ]}
      />
      <PageHero eyebrow="Programs" title="Training for" highlight="every goal" intro="Pick a focus or combine them — your trainer will build the plan around your body, schedule and food habits." />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <ProgramGrid programs={c.programs} />
        <div className="mx-auto max-w-3xl">
          <CtaCard whatsapp={whatsappHref(c.business)} phone={telHref(c.business.phone)} />
        </div>
      </section>
    </>
  );
}
