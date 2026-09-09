import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pill, ShieldAlert, AlertTriangle, CheckCircle2, BookOpen } from "lucide-react";
import { MEDICINES, getMedicine } from "@/data/medicines";
import { getDisease } from "@/data/diseases-index";
import { getLab } from "@/data/clinical";
import { Breadcrumbs, FaqAccordion, ShareButtons, AdSlot, DisclaimerBar, LikeButton } from "@/components/ui";
import { articleJsonLd, faqJsonLd } from "@/lib/seo";
import { formatDate } from "@/lib/format";

export function generateStaticParams() { return MEDICINES.map((m) => ({ slug: m.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = getMedicine(slug);
  if (!m) return { title: "Medicine not found" };
  return { title: `${m.genericName} — Uses, Side Effects, Warnings & Monitoring`, description: m.short, alternates: { canonical: `/medicines/${slug}` } };
}

export default async function MedicinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = getMedicine(slug);
  if (!m) notFound();
  const related = m.relatedDiseases.map(getDisease).filter(Boolean);
  const labs = m.relatedLabs.map(getLab).filter(Boolean);

  const Sec = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="mt-2 text-[15px] leading-relaxed text-stone-700 dark:text-stone-200">{children}</div>
    </section>
  );
  const List = ({ items }: { items: string[] }) => (
    <ul className="space-y-1.5">{items.map((i, x) => <li key={x} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-sky-600" /><span>{i}</span></li>)}</ul>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Medicines", href: "/medicines" }, { label: m.genericName }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ title: m.genericName, description: m.short, slug: `/medicines/${slug}`, category: "Medicine" })) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(m.faqs)) }} />

      <div className="mt-3 rounded-3xl bg-gradient-to-br from-slate-900 to-sky-900 p-6 text-white md:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Pill className="h-6 w-6 text-amber-300" /></span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">{m.drugClass}</span>
        </div>
        <h1 className="font-display mt-3 text-3xl font-black md:text-4xl">{m.genericName}</h1>
        <p className="mt-1 text-sm text-sky-200/80">Brand examples (illustrative): {m.brandExamples.join(" · ")}</p>
        <p className="mt-3 max-w-3xl leading-relaxed text-sky-50/90">{m.short}</p>
        <p className="mt-2 text-xs text-sky-200/70">Updated: {formatDate(m.updatedAt)} · Review: pending — placeholder <LikeButton id={slug} /></p>
        <div className="mt-2"><ShareButtons title={m.genericName} path={`/medicines/${slug}`} /></div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="flex gap-2.5 rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-sm leading-relaxed text-red-950 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p><strong>Educational information only.</strong> Medication decisions should be made with a qualified healthcare professional. This page provides no personalised doses and never advises starting, stopping or changing prescriptions. In case of side effects or overdose, seek care promptly.</p>
        </div>

        <Sec title="Common indications & general mechanism">
          <List items={m.indications} />
          <p className="mt-3 rounded-2xl bg-stone-50 p-3 text-sm dark:bg-stone-800/60"><strong>How it generally works:</strong> {m.mechanism}</p>
        </Sec>

        <Sec title="Side effects & serious effects">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="mb-1.5 text-sm font-bold">Common</p><List items={m.commonSideEffects} /></div>
            <div><p className="mb-1.5 flex items-center gap-1 text-sm font-bold"><AlertTriangle className="h-4 w-4 text-rose-500" /> Serious (seek care)</p><List items={m.seriousEffects} /></div>
          </div>
        </Sec>

        <AdSlot slot="In-content" />

        <Sec title="Contraindications, interactions & monitoring">
          <p className="mb-1.5 text-sm font-bold">Who should not use / needs caution</p><List items={m.contraindications} />
          <p className="mb-1.5 mt-3 text-sm font-bold">Drug interactions</p><List items={m.interactions} />
          <p className="mb-1.5 mt-3 text-sm font-bold">Food interactions</p><List items={m.foodInteractions} />
          <p className="mb-1.5 mt-3 text-sm font-bold">Monitoring</p><List items={m.monitoring} />
        </Sec>

        <Sec title="Pregnancy, kidney/liver & warnings">
          <ul className="space-y-2 text-sm">
            <li><strong>Pregnancy:</strong> {m.pregnancy}</li>
            <li><strong>Kidney/liver:</strong> {m.organCaution}</li>
          </ul>
          <p className="mb-1.5 mt-3 text-sm font-bold">Important warnings</p><List items={m.warnings} />
        </Sec>

        <Sec title="Common misconceptions">
          <div className="space-y-2">
            {m.misconceptions.map((x, i) => (
              <div key={i} className="rounded-2xl bg-stone-50 p-3 text-sm dark:bg-stone-800/60">
                <p><strong className="text-rose-700 dark:text-rose-300">Myth:</strong> {x.myth}</p>
                <p className="mt-1"><strong className="text-emerald-700 dark:text-emerald-300">Fact:</strong> {x.fact}</p>
              </div>
            ))}
          </div>
        </Sec>

        <Sec title="FAQs"><FaqAccordion faqs={m.faqs} /></Sec>
        <Sec title="References">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-stone-600 dark:text-stone-300">{m.references.map((r, i) => <li key={i}>{r.title} — <em>{r.source}</em></li>)}</ol>
        </Sec>

        <section className="rounded-3xl border border-stone-200 bg-sky-50/50 p-5 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-display flex items-center gap-2 text-xl font-bold"><BookOpen className="h-5 w-5" /> Related conditions & tests</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {related.map((d) => d && <Link key={d.slug} href={`/diseases/${d.slug}`} className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold shadow-sm hover:bg-sky-100 dark:bg-stone-800">{d.name}</Link>)}
            {labs.map((l) => l && <Link key={l.slug} href={`/lab-tests/${l.slug}`} className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold shadow-sm hover:bg-sky-100 dark:bg-stone-800">{l.shortName || l.name}</Link>)}
          </div>
        </section>
        <DisclaimerBar />
      </div>
    </div>
  );
}
