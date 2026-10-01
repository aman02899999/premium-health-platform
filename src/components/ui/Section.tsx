import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  highlight,
  intro,
  center = true,
  as: H = "h2",
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  intro?: ReactNode;
  center?: boolean;
  as?: "h1" | "h2";
}) {
  return (
    <Reveal className={`mb-12 max-w-3xl ${center ? "mx-auto text-center" : ""}`}>
      <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand">
        <span className="h-px w-8 bg-brand/60" />
        {eyebrow}
        <span className="h-px w-8 bg-brand/60" />
      </p>
      <H className="font-display text-4xl leading-[1.05] text-white sm:text-5xl">
        {title} {highlight && <span className="text-brand-gradient">{highlight}</span>}
      </H>
      {intro && <p className="mt-5 text-lg text-white/65">{intro}</p>}
    </Reveal>
  );
}

export function PageHero({ eyebrow, title, highlight, intro }: { eyebrow: string; title: string; highlight?: string; intro?: ReactNode }) {
  return (
    <section className="relative overflow-hidden pb-6 pt-36 sm:pt-44">
      <div className="grid-floor pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-brand/10 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading as="h1" eyebrow={eyebrow} title={title} highlight={highlight} intro={intro} />
      </div>
    </section>
  );
}
