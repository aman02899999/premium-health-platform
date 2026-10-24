import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { guideFor, PROGRAM_GUIDES } from "@/lib/content/program-guides";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { PageHero, SectionHeading } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";
import { CtaCard } from "@/components/blog/CtaCard";
import { ProgramFlow } from "@/components/programs/ProgramFlow";
import { telHref, whatsappHref } from "@/lib/site";

export const revalidate = 3600;

export function generateStaticParams() {
  return DEFAULT_CONTENT.programs.filter((p) => PROGRAM_GUIDES[p.id]).map((p) => ({ id: p.id }));
}

async function load(id: string) {
  const c = await getContent();
  const program = c.programs.find((p) => p.id === id);
  const guide = guideFor(id);
  return { c, program, guide };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { c, program, guide } = await load(id);
  if (!program || !guide) return {};
  return pageMeta(c, {
    title: `${program.title} in Sector 93 Noida — Plan, Weekly Schedule & Results`,
    description: `${program.title} at ${c.business.name}, Noida: who it's for, how progress is measured, a typical session and sample beginner, intermediate and advanced weeks.`,
    path: `/programs/${id}`,
  });
}

export default async function ProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { c, program, guide } = await load(id);
  if (!program || !guide) notFound();

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Programs", path: "/programs" },
            { name: program.title, path: `/programs/${id}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: program.title,
            description: guide.headline,
            serviceType: program.title,
            areaServed: "Noida",
            provider: { "@type": "HealthClub", name: c.business.name },
          },
        ]}
      />
      <PageHero eyebrow="Program guide" title={program.title} intro={guide.headline} />

      <div className="mx-auto max-w-5xl px-4 pb-6 sm:px-6">
        <Link href="/programs" className="inline-flex items-center gap-1 py-2 text-sm text-white/60 hover:text-brand">
          <ArrowLeft className="h-4 w-4" /> All programs
        </Link>
      </div>

      <section className="mx-auto grid max-w-5xl gap-10 px-4 pb-12 sm:px-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5 text-lg leading-relaxed text-white/75">
          {guide.paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
        <aside className="space-y-5">
          {[
            ["Who it's for", guide.audience],
            ["How we measure progress", guide.metrics],
            ["Equipment you'll use", guide.equipment],
          ].map(([title, items]) => (
            <div key={title as string} className="glass rounded-2xl p-5 ring-1 ring-white/10">
              <h2 className="font-display text-lg text-white">{title as string}</h2>
              <ul className="mt-3 space-y-2 text-sm text-white/75">
                {(items as string[]).map((it) => (
                  <li key={it} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeading eyebrow="At a glance" title="How the program" highlight="flows" intro="From your first assessment to regular reviews, and what a session looks like." />
        <ProgramFlow steps={guide.flow} outcomes={guide.outcomes} session={guide.session} />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <SectionHeading eyebrow="Sample weeks" title="Pick your" highlight="level" intro="Illustrative schedules. Your trainer adjusts them to your body, timings and goal." />
        <div className="grid gap-6 lg:grid-cols-3">
          {guide.weeks.map((w) => (
            <article key={w.level} className="glass brand-border overflow-hidden rounded-3xl">
              <header className="border-b border-white/10 p-5">
                <h3 className="font-display text-2xl text-white">{w.level}</h3>
                <p className="text-sm text-white/55">{w.who}</p>
              </header>
              <table className="w-full text-left text-sm">
                <caption className="sr-only">{`${w.level} sample week for ${program.title}`}</caption>
                <tbody>
                  {w.days.map((d) => (
                    <tr key={d.day} className="border-b border-white/5 last:border-0">
                      <th scope="row" className="w-14 px-5 py-2.5 align-top font-semibold text-brand">
                        {d.day}
                      </th>
                      <td className="py-2.5 pr-5 text-white/75">{d.focus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <CtaCard whatsapp={whatsappHref(c.business)} phone={telHref(c.business.phone)} />
      </section>
    </>
  );
}
