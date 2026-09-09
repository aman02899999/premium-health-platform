import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { AYURVEDA_TOPICS, AYURVEDA_MAP } from "@/data/editorial";
import { Breadcrumbs, FaqAccordion, ShareButtons, AdSlot, DisclaimerBar, InfoNote } from "@/components/ui";
import { articleJsonLd } from "@/lib/seo";

export function generateStaticParams() { return AYURVEDA_TOPICS.map((t) => ({ slug: t.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = AYURVEDA_MAP.get(slug);
  if (!t) return { title: "Ayurveda topic not found" };
  return { title: `${t.title} — Ayurveda Portal`, description: t.excerpt, alternates: { canonical: `/ayurveda/${slug}` } };
}

export default async function AyurvedaTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = AYURVEDA_MAP.get(slug);
  if (!t) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Ayurveda", href: "/ayurveda" }, { label: t.title }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ title: t.title, description: t.excerpt, slug: `/ayurveda/${slug}`, category: t.category })) }} />

      <div className="hero-pattern mt-3 rounded-3xl border border-emerald-100 p-6 md:p-8 dark:border-stone-700">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600"><Sparkles className="h-4 w-4" /> {t.category}</p>
        <h1 className="font-display mt-2 text-3xl font-black md:text-4xl">{t.title}</h1>
        <p className="mt-2 text-stone-600 dark:text-stone-300">{t.subtitle}</p>
        <div className="mt-3"><ShareButtons title={t.title} path={`/ayurveda/${slug}`} /></div>
      </div>

      <div className="mt-4"><InfoNote text="Ayurvedic concepts below are traditional frameworks. They enrich lifestyle and prevention but do not replace modern diagnosis, emergency care or prescribed medicines." /></div>

      <div className="mt-4 space-y-4 text-[15px] leading-relaxed">
        <section className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
          <p className="text-stone-700 dark:text-stone-200">{t.body}</p>
          <h2 className="font-display mt-5 text-lg font-bold">Key points</h2>
          <ul className="mt-2 space-y-1.5">{t.keyPoints.map((k, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />{k}</li>)}</ul>
        </section>
        <section className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-display mb-3 text-lg font-bold">FAQs</h2>
          <FaqAccordion faqs={t.faqs} />
        </section>
        <section className="rounded-3xl border border-stone-200 bg-emerald-50/50 p-5 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-display text-lg font-bold">Continue exploring</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {AYURVEDA_TOPICS.filter((x) => x.slug !== slug).slice(0, 5).map((x) => (
              <Link key={x.slug} href={`/ayurveda/${x.slug}`} className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold shadow-sm hover:bg-emerald-100 dark:bg-stone-800">{x.title}</Link>
            ))}
            <Link href="/herbs" className="rounded-full bg-emerald-700 px-3.5 py-1.5 text-[13px] font-semibold text-white">All herbs →</Link>
          </div>
        </section>
        <AdSlot slot="In-content" />
        <DisclaimerBar />
      </div>
    </div>
  );
}
