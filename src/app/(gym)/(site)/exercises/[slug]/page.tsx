import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Check, ChevronRight, Lightbulb } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { EXERCISES, equipmentLabel, exerciseBySlug, muscleLabel } from "@/lib/fitness/exercises";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { absoluteUrl, telHref, whatsappHref } from "@/lib/site";
import { JsonLd } from "@/components/ui/JsonLd";
import { CtaCard } from "@/components/blog/CtaCard";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return EXERCISES.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ex = exerciseBySlug((await params).slug);
  if (!ex) return {};
  const c = await getContent();
  return pageMeta(c, {
    title: `${ex.name} — How to Do It, Muscles Worked & Tips`,
    description: `${ex.summary} Step-by-step ${ex.name.toLowerCase()} form guide, muscles worked, tips and common mistakes.`,
    path: `/exercises/${ex.slug}`,
  });
}

export default async function ExercisePage({ params }: Props) {
  const ex = exerciseBySlug((await params).slug);
  if (!ex) notFound();
  const c = await getContent();
  const related = EXERCISES.filter((e) => e.slug !== ex.slug && e.primary === ex.primary).slice(0, 4);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Exercises", path: "/exercises" },
            { name: ex.name, path: `/exercises/${ex.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: `How to do the ${ex.name}`,
            description: ex.summary,
            tool: equipmentLabel(ex.equipment),
            step: ex.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })),
            url: absoluteUrl(`/exercises/${ex.slug}`),
          },
        ]}
      />
      <article className="mx-auto max-w-4xl px-4 pb-10 pt-36 sm:px-6 sm:pt-44">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-sm text-white/50">
          <Link href="/exercises" className="hover:text-brand">Exercises</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-brand">{muscleLabel(ex.primary)}</span>
        </nav>
        <h1 className="font-display text-4xl text-white sm:text-6xl">{ex.name}</h1>
        <p className="mt-4 text-lg text-white/70">{ex.summary}</p>
        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Main muscle", muscleLabel(ex.primary)],
            ["Also works", ex.secondary.map(muscleLabel).join(", ") || "—"],
            ["Equipment", equipmentLabel(ex.equipment)],
            ["Level", ex.level],
          ].map(([k, v]) => (
            <div key={k} className="glass rounded-2xl p-4">
              <dt className="text-[11px] uppercase tracking-widest text-white/45">{k}</dt>
              <dd className="mt-1 font-semibold capitalize text-white">{v}</dd>
            </div>
          ))}
        </dl>

        <h2 className="font-display mt-12 text-3xl text-white">How to do it</h2>
        <ol className="mt-5 space-y-4">
          {ex.steps.map((s, i) => (
            <li key={s} className="flex gap-4">
              <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-lg text-white">{i + 1}</span>
              <span className="pt-2 text-white/80">{s}</span>
            </li>
          ))}
        </ol>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <section className="rounded-3xl bg-emerald-400/10 p-6 ring-1 ring-emerald-400/30">
            <h2 className="flex items-center gap-2 font-bold text-emerald-300">
              <Lightbulb className="h-5 w-5" /> Coach&apos;s tips
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              {ex.tips.map((t) => (
                <li key={t} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> {t}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-3xl bg-ember/10 p-6 ring-1 ring-ember/30">
            <h2 className="flex items-center gap-2 font-bold text-red-300">
              <AlertTriangle className="h-5 w-5" /> Common mistakes
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              {ex.mistakes.map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
          </section>
        </div>

        <CtaCard whatsapp={whatsappHref(c.business, `Hi ${c.business.name}, I'd like a trainer to check my ${ex.name.toLowerCase()} form.`)} phone={telHref(c.business.phone)} />

        {related.length > 0 && (
          <section>
            <h2 className="font-display mb-4 text-2xl text-white">More {muscleLabel(ex.primary).toLowerCase()} exercises</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <Link key={r.slug} href={`/exercises/${r.slug}`} className="glass rounded-2xl p-4 hover:ring-1 hover:ring-brand/50">
                  <span className="font-semibold text-white">{r.name}</span>
                  <span className="block text-sm text-white/55">{equipmentLabel(r.equipment)} · {r.level}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
