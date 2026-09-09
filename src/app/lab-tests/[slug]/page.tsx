import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlaskConical, CheckCircle2 } from "lucide-react";
import { LAB_TESTS, getLab } from "@/data/clinical";
import { getDisease } from "@/data/diseases-index";
import { Breadcrumbs, FaqAccordion, ShareButtons, AdSlot, DisclaimerBar, InfoNote, LikeButton } from "@/components/ui";
import { articleJsonLd, faqJsonLd } from "@/lib/seo";
import { formatDate } from "@/lib/format";

export function generateStaticParams() { return LAB_TESTS.map((l) => ({ slug: l.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const l = getLab(slug);
  if (!l) return { title: "Lab test not found" };
  return { title: `${l.name} — Normal Range, Preparation & Meaning`, description: l.short, alternates: { canonical: `/lab-tests/${slug}` } };
}

export default async function LabPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = getLab(slug);
  if (!l) notFound();
  const related = l.relatedDiseases.map(getDisease).filter(Boolean);
  const Sec = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="mt-2 text-[15px] leading-relaxed text-stone-700 dark:text-stone-200">{children}</div>
    </section>
  );
  const List = ({ items }: { items: string[] }) => (
    <ul className="space-y-1.5">{items.map((i, x) => <li key={x} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-cyan-600" /><span>{i}</span></li>)}</ul>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Lab Tests", href: "/lab-tests" }, { label: l.shortName || l.name }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ title: l.name, description: l.short, slug: `/lab-tests/${slug}`, category: "Lab Test" })) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(l.faqs)) }} />

      <div className="mt-3 rounded-3xl bg-gradient-to-br from-cyan-900 to-emerald-900 p-6 text-white md:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><FlaskConical className="h-6 w-6 text-amber-300" /></span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">{l.shortName || "Lab test"}</span>
        </div>
        <h1 className="font-display mt-3 text-3xl font-black md:text-4xl">{l.name}</h1>
        <p className="mt-2 max-w-3xl text-cyan-50/90">{l.short}</p>
        <p className="mt-2 text-xs text-cyan-200/70">Updated: {formatDate(l.updatedAt)} <LikeButton id={slug} /></p>
        <div className="mt-2"><ShareButtons title={l.name} path={`/lab-tests/${slug}`} /></div>
      </div>

      <div className="mt-4"><InfoNote text="Do not diagnose based on one lab value. Ranges vary by lab, method, age, pregnancy and medicines — always interpret trends with your doctor." /></div>

      <div className="mt-4 space-y-4">
        <Sec title="What the test measures"><p>{l.measures}</p></Sec>
        <div className="grid gap-4 sm:grid-cols-2">
          <Sec title="Why doctors order it"><List items={l.whyOrdered} /></Sec>
          <Sec title="Preparation"><List items={l.preparation} /></Sec>
        </div>
        <Sec title="Normal range & abnormal meaning">
          <p className="rounded-2xl bg-cyan-50 p-3 text-sm font-medium dark:bg-cyan-950/40">{l.normalRange}</p>
          <div className="mt-3"><List items={l.abnormalMeaning} /></div>
        </Sec>
        <AdSlot slot="In-content" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Sec title="Limitations"><List items={l.limitations} /></Sec>
          <Sec title="Questions to ask your doctor"><List items={l.questionsToAsk} /></Sec>
        </div>
        <Sec title="FAQs"><FaqAccordion faqs={l.faqs} /></Sec>
        <Sec title="References">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-stone-600 dark:text-stone-300">{l.references.map((r, i) => <li key={i}>{r.title} — <em>{r.source}</em></li>)}</ol>
        </Sec>
        {related.length > 0 && (
          <section className="rounded-3xl border border-stone-200 bg-cyan-50/50 p-5 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-display text-xl font-bold">Related diseases</h2>
            <div className="mt-2 flex flex-wrap gap-2">{related.map((d) => d && <Link key={d.slug} href={`/diseases/${d.slug}`} className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold shadow-sm hover:bg-cyan-100 dark:bg-stone-800">{d.name}</Link>)}</div>
          </section>
        )}
        <DisclaimerBar />
      </div>
    </div>
  );
}
