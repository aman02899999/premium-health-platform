import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, CheckCircle2 } from "lucide-react";
import { SYMPTOMS, getSymptom } from "@/data/clinical";
import { getDisease } from "@/data/diseases-index";
import { Breadcrumbs, FaqAccordion, ShareButtons, AdSlot, DisclaimerBar, EmergencyBox, DoctorBox } from "@/components/ui";
import { articleJsonLd, faqJsonLd } from "@/lib/seo";

export function generateStaticParams() { return SYMPTOMS.map((s) => ({ slug: s.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = getSymptom(slug);
  if (!s) return { title: "Symptom not found" };
  return { title: `${s.name} — Possible Causes, Questions & When to Seek Care`, description: s.short, alternates: { canonical: `/symptoms/${slug}` } };
}

export default async function SymptomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = getSymptom(slug);
  if (!s) notFound();
  const related = s.relatedDiseases.map(getDisease).filter(Boolean);
  const Sec = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="mt-2 text-[15px] leading-relaxed text-stone-700 dark:text-stone-200">{children}</div>
    </section>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Symptoms", href: "/symptoms" }, { label: s.name }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ title: s.name, description: s.short, slug: `/symptoms/${slug}`, category: "Symptom" })) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(s.faqs)) }} />

      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 to-red-900 p-6 text-white md:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Activity className="h-6 w-6 text-amber-300" /></span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">Urgency: {s.urgency}</span>
        </div>
        <h1 className="font-display mt-3 text-3xl font-black md:text-4xl">{s.name}</h1>
        <p className="mt-2 max-w-3xl text-white/90">{s.short}</p>
        <p className="mt-2 text-xs text-white/70">Educational triage only — never a diagnosis.</p>
        <div className="mt-2"><ShareButtons title={s.name} path={`/symptoms/${slug}`} /></div>
      </div>

      <div className="mt-5 space-y-4">
        {s.emergencySigns.length > 0 && <EmergencyBox signs={s.emergencySigns} />}
        <Sec title="Possible categories (to discuss with a doctor)">
          <div className="flex flex-wrap gap-1.5">{s.possibleCategories.map((c) => <span key={c} className="rounded-full bg-stone-100 px-3 py-1.5 text-[13px] font-medium dark:bg-stone-800">{c}</span>)}</div>
        </Sec>
        <div className="grid gap-4 sm:grid-cols-2">
          <Sec title="Questions to consider"><ul className="space-y-1.5">{s.questions.map((q, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-sky-600" />{q}</li>)}</ul></Sec>
          <Sec title="Care guidance"><ul className="space-y-1.5">{s.careGuidance.map((q, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />{q}</li>)}</ul></Sec>
        </div>
        <AdSlot slot="In-content" />
        <DoctorBox title="When to seek medical care" points={["Symptoms persist beyond expected duration or keep recurring", "You need repeated self-medication to stay comfortable", "You have diabetes, heart, kidney disease or are pregnant", "Any emergency sign above appears"]} />
        <Sec title="FAQs"><FaqAccordion faqs={s.faqs} /></Sec>
        {related.length > 0 && (
          <Sec title="Related diseases">
            <div className="flex flex-wrap gap-2">{related.map((d) => d && <Link key={d.slug} href={`/diseases/${d.slug}`} className="rounded-full bg-stone-100 px-3.5 py-1.5 text-[13px] font-semibold hover:bg-emerald-100 dark:bg-stone-800">{d.name}</Link>)}</div>
          </Sec>
        )}
        <DisclaimerBar />
      </div>
    </div>
  );
}
