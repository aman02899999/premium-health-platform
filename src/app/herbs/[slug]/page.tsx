import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Leaf, ShieldAlert, FlaskConical, AlertTriangle, BookOpen, CheckCircle2 } from "lucide-react";
import { HERBS, getHerb } from "@/data/herbs";
import { getDisease } from "@/data/diseases-index";
import { Breadcrumbs, EvidenceBadge, FaqAccordion, ShareButtons, AdSlot, DisclaimerBar, DoctorBox, LikeButton } from "@/components/ui";
import { articleJsonLd, faqJsonLd } from "@/lib/seo";
import { formatDate } from "@/lib/format";

export function generateStaticParams() { return HERBS.map((h) => ({ slug: h.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const h = getHerb(slug);
  if (!h) return { title: "Herb not found" };
  return { title: `${h.name} — Uses, Evidence, Safety & Interactions`, description: h.short, alternates: { canonical: `/herbs/${slug}` } };
}

export default async function HerbPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const h = getHerb(slug);
  if (!h) notFound();
  const related = h.relatedDiseases.map(getDisease).filter(Boolean);

  const Sec = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="mt-2 text-[15px] leading-relaxed text-stone-700 dark:text-stone-200">{children}</div>
    </section>
  );
  const List = ({ items }: { items: string[] }) => (
    <ul className="space-y-1.5">{items.map((i, x) => <li key={x} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /><span>{i}</span></li>)}</ul>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Herbs", href: "/herbs" }, { label: h.name }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ title: h.name, description: h.short, slug: `/herbs/${slug}`, category: "Herb" })) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(h.faqs)) }} />

      <div className="mt-3 overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-lime-50 via-emerald-50 to-teal-50 p-6 md:p-8 dark:border-stone-700 dark:from-stone-900 dark:to-emerald-950/30">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 to-lime-600 text-white"><Leaf className="h-6 w-6" /></span>
          <EvidenceBadge level={h.evidenceLevel} />
        </div>
        <h1 className="font-display mt-3 text-3xl font-black md:text-4xl">{h.name}</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-300"><em>{h.botanicalName}</em> · {h.hindiName}{h.sanskritName ? ` · Sanskrit: ${h.sanskritName}` : ""}</p>
        <p className="mt-1 text-sm text-stone-500">Also: {h.otherNames.join(", ")}</p>
        <p className="mt-3 max-w-3xl leading-relaxed text-stone-700 dark:text-stone-200">{h.short}</p>
        <p className="mt-2 text-xs text-stone-500">Updated: {formatDate(h.updatedAt)} · Medically reviewed by: Review pending — placeholder <LikeButton id={slug} /></p>
        <div className="mt-2"><ShareButtons title={h.name} path={`/herbs/${slug}`} /></div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="flex gap-2.5 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p><strong>Safety first:</strong> Herbs are not automatically safe. {h.pregnancy} {h.organCaution} Never stop prescribed medicines for an herb without supervision.</p>
        </div>

        <Sec title="Traditional uses & preparations">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="mb-1.5 text-sm font-bold">Traditional uses</p><List items={h.traditionalUses} /></div>
            <div><p className="mb-1.5 text-sm font-bold">Common preparations</p><List items={h.preparations} /></div>
          </div>
        </Sec>

        <Sec title="Evidence summary & proposed mechanisms">
          <p className="rounded-2xl bg-stone-50 p-3 text-sm dark:bg-stone-800/60">{h.evidenceSummary}</p>
          <p className="mb-1.5 mt-3 text-sm font-bold">Proposed mechanisms (theory, not proof)</p>
          <List items={h.mechanisms} />
          <p className="mb-1.5 mt-3 text-sm font-bold">Possible benefits discussed in literature</p>
          <List items={h.benefits} />
        </Sec>

        <AdSlot slot="In-content" />

        <Sec title="Safety, side effects & interactions">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="mb-1.5 flex items-center gap-1 text-sm font-bold"><ShieldAlert className="h-4 w-4 text-amber-600" /> Safety</p><List items={h.safety} /></div>
            <div><p className="mb-1.5 flex items-center gap-1 text-sm font-bold"><AlertTriangle className="h-4 w-4 text-rose-500" /> Side effects</p><List items={h.sideEffects} /></div>
          </div>
          <p className="mb-1.5 mt-3 text-sm font-bold">Drug interactions</p>
          <List items={h.interactions} />
          <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm dark:bg-rose-950/40"><strong>Who should avoid:</strong> {h.avoidBy.join("; ") || "See safety notes above."}</p>
        </Sec>

        <Sec title="Pregnancy, kidney/liver & quality">
          <ul className="space-y-2 text-sm">
            <li><strong>Pregnancy/breastfeeding:</strong> {h.pregnancy}</li>
            <li><strong>Kidney/liver:</strong> {h.organCaution}</li>
          </ul>
          <p className="mb-1.5 mt-3 text-sm font-bold"><FlaskConical className="mr-1 inline h-4 w-4" /> Quality checks</p>
          <List items={h.quality} />
        </Sec>

        <DoctorBox title="When to consult a doctor" points={h.whenToConsult} />

        <Sec title="FAQs"><FaqAccordion faqs={h.faqs} /></Sec>

        <Sec title="References">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-stone-600 dark:text-stone-300">{h.references.map((r, i) => <li key={i}>{r.title} — <em>{r.source}</em></li>)}</ol>
        </Sec>

        {related.length > 0 && (
          <section className="rounded-3xl border border-stone-200 bg-emerald-50/50 p-5 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-display flex items-center gap-2 text-xl font-bold"><BookOpen className="h-5 w-5" /> Related diseases</h2>
            <div className="mt-2 flex flex-wrap gap-2">{related.map((d) => d && <Link key={d.slug} href={`/diseases/${d.slug}`} className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold shadow-sm hover:bg-emerald-100 dark:bg-stone-800">{d.name}</Link>)}</div>
          </section>
        )}
        <DisclaimerBar />
      </div>
    </div>
  );
}
