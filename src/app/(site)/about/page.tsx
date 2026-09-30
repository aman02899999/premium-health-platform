import type { Metadata } from "next";
import { getContent } from "@/lib/content/store";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { TrainerGrid } from "@/components/home/Blocks";
import { PageHero, SectionHeading } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: `About ${c.business.name} — Gym in Gejha, Sector 93 Noida`,
    description: `${c.business.name} has served Gejha and Sector 93, Noida since ${c.business.foundedYear}. Meet the team and see what makes our gym different.`,
    path: "/about",
  });
}

export default async function AboutPage() {
  const c = await getContent();
  const b = c.business;
  const years = new Date().getFullYear() - b.foundedYear;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
      <PageHero eyebrow={`Since ${b.foundedYear}`} title="Our" highlight="story" />
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[1.3fr_1fr]">
        <Reveal className="space-y-5 text-lg leading-relaxed text-white/75">
          <p>{b.description}</p>
          <p>
            We started with a simple idea: people in Gejha, Sector 93, 93A, 93B and nearby societies deserve a gym that is serious about results
            without the attitude or the price tag of a chain. That means good equipment, trainers who actually coach, a clean air-conditioned floor
            and honest advice on food and supplements.
          </p>
          <p>
            Whether you want to lose your first 5 kg, build muscle, get stronger for sport or simply feel better every day — we will help you get
            there step by step.
          </p>
        </Reveal>
        <Reveal delay={150} className="grid grid-cols-2 gap-4">
          {[
            { v: years, s: "+", l: "Years serving Noida" },
            { v: b.rating.value, s: "★", l: "Average rating" },
            { v: b.rating.count, s: "+", l: "Reviews" },
            { v: c.programs.length, s: "", l: "Programs" },
          ].map((x) => (
            <div key={x.l} className="glass gold-border rounded-3xl p-6 text-center">
              <div className="font-display text-4xl text-gold-gradient">
                <CountUp value={x.v} suffix={x.s} />
              </div>
              <div className="mt-1 text-xs uppercase tracking-widest text-white/55">{x.l}</div>
            </div>
          ))}
        </Reveal>
      </section>
      {c.trainers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionHeading eyebrow="The team" title="Meet the" highlight="coaches" />
          <TrainerGrid trainers={c.trainers} />
        </section>
      )}
    </>
  );
}
