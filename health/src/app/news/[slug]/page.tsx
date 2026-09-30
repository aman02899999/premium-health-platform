import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, Globe2, ShieldCheck } from "lucide-react";
import { getNewsFeed, getNewsItem, listNewsSlugs } from "@/lib/news";
import { getDisease } from "@/data/diseases-index";
import { getLab } from "@/data/clinical";
import { getHerb } from "@/data/herbs";
import {
  Breadcrumbs, KeyTakeaway, DoctorBox, EmergencyBox, ShareButtons, AdSlot, DisclaimerBar, LikeButton,
} from "@/components/ui";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { formatDate } from "@/lib/format";

// Statically rendered + revalidated so the daily edition stays fresh while
// unknown slugs return a real 404 status.
export const revalidate = 600;

export function generateStaticParams() {
  // Pre-render the current rolling window of editions at build time.
  return listNewsSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getNewsItem(slug);
  // Unknown editions render the 404 boundary; keep them out of the index.
  if (!item) return { title: "News item not found", robots: { index: false, follow: true } };
  return {
    title: `${item.title} — Health News`,
    description: item.summary,
    alternates: { canonical: `/news/${slug}` },
    openGraph: { title: item.title, description: item.summary, type: "article" },
  };
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getNewsItem(slug);
  if (!item) notFound();

  const feed = await getNewsFeed();
  const others = feed.filter((n) => n.category === item.category && n.slug !== item.slug).slice(0, 3);
  const fallback = others.length ? others : feed.filter((n) => n.slug !== item.slug).slice(0, 3);
  const diseases = item.relatedDiseases.map(getDisease).filter(Boolean);
  const labs = item.relatedLabs.map(getLab).filter(Boolean);
  const herbs = item.relatedHerbs.map(getHerb).filter(Boolean);
  const isEmergency = item.category === "Outbreak Advisory" || /dengue|heat|breath|emergency/i.test(item.title + item.summary);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Health News", href: "/news" }, { label: item.category }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ title: item.title, description: item.summary, slug: `/news/${slug}`, category: item.category, datePublished: item.publishedAt, dateModified: item.updatedAt })) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Health News", path: "/news" }, { name: item.title, path: `/news/${slug}` }])) }} />

      <div className="hero-pattern mt-3 rounded-3xl border border-emerald-100 p-6 md:p-8 dark:border-stone-700">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
          <span className="rounded-full bg-emerald-700 px-2.5 py-1 text-white">Health News</span>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800 dark:bg-amber-900 dark:text-amber-200">{item.category}</span>
          <span className="flex items-center gap-1 text-stone-500"><Clock className="h-3 w-3" />Published {formatDate(item.publishedAt)}</span>
        </div>
        <h1 className="font-display mt-3 text-3xl font-black leading-tight md:text-[2.5rem]">{item.title}</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-stone-600 dark:text-stone-300">{item.summary}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
          <span>By <strong>{item.author}</strong></span>
          <span>Medically reviewed by: <strong>{item.reviewer}</strong></span>
          <LikeButton id={item.slug} />
          <Link href="/news" className="flex items-center gap-1 font-bold text-emerald-700 underline"><ArrowLeft className="h-3 w-3" />All news</Link>
        </div>
        <div className="mt-3"><ShareButtons title={item.title} path={`/news/${item.slug}`} /></div>
      </div>

      {/* Image slot with generation prompt (documented for the asset pipeline) */}
      <div className="article-grid-bg mt-5 flex h-40 items-center justify-center rounded-3xl border border-stone-200 bg-white p-6 text-center dark:border-stone-700 dark:bg-stone-900">
        <p className="max-w-xl text-xs italic text-stone-500">Hero illustration prompt: {item.imagePrompt}</p>
      </div>

      {isEmergency && (
        <div className="mt-5"><EmergencyBox signs={["Severe breathlessness or blue lips", "Chest pain or pressure", "Confusion, fainting or a seizure", "Bleeding, black stools or a rigid, very painful belly", "No urine for many hours with vomiting"]} /></div>
      )}

      <div className="mt-5 space-y-5">
        {item.body.map((sec, i) => (
          <section key={i} className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-display text-xl font-bold md:text-2xl">{sec.heading}</h2>
            {sec.paragraphs?.map((p, j) => <p key={j} className="mt-2.5 text-[15px] leading-[1.8] text-stone-700 dark:text-stone-200">{p}</p>)}
            {sec.bullets && (
              <ul className={sec.paragraphs?.length ? "mt-3 space-y-1.5" : ""}>
                {sec.bullets.map((b, k) => <li key={k} className="flex gap-2 text-[15px] leading-relaxed text-stone-700 dark:text-stone-200"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />{b}</li>)}
              </ul>
            )}
          </section>
        ))}

        <KeyTakeaway points={item.keyTakeaways} />

        <section className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-display flex items-center gap-2 text-xl font-bold"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Source & fact-check note</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{item.factCheckNote}</p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <Globe2 className="h-4 w-4 text-sky-600" /> <span className="font-semibold">{item.sourceName}</span>
            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 font-bold text-emerald-700 underline">Official source <ExternalLink className="h-3 w-3" /></a>
          </p>
          <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            This item is general educational guidance. It does not diagnose, prescribe or change doses. {item.kind === "briefing" ? "It is our own rotating daily briefing, not a report of a specific event." : ""}
          </p>
        </section>

        {(diseases.length > 0 || labs.length > 0 || herbs.length > 0) && (
          <section className="rounded-3xl border border-stone-200 bg-emerald-50/50 p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-display text-xl font-bold">Understand this better</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {diseases.map((d) => d && <Link key={d.slug} href={`/diseases/${d.slug}`} className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold shadow-sm hover:bg-emerald-100 dark:bg-stone-800">{d.name}</Link>)}
              {labs.map((l) => l && <Link key={l.slug} href={`/lab-tests/${l.slug}`} className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold shadow-sm hover:bg-emerald-100 dark:bg-stone-800">{l.shortName || l.name}</Link>)}
              {herbs.map((h) => h && <Link key={h.slug} href={`/herbs/${h.slug}`} className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold shadow-sm hover:bg-emerald-100 dark:bg-stone-800">{h.name}</Link>)}
            </div>
          </section>
        )}

        <DoctorBox points={["Start a conversation with your doctor before changing treatment based on any news item", "Ask about tests that confirm or exclude what this advisory discusses", "Bring this article to your appointment — screenshots beat memory"]} />

        <AdSlot slot="News article in-content" />

        <section className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-display text-xl font-bold">More from the newsroom</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {fallback.map((n) => (
              <Link key={n.slug} href={`/news/${n.slug}`} className="rounded-2xl border border-stone-100 p-4 hover:border-emerald-300 dark:border-stone-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">{n.category}</p>
                <p className="mt-1 text-sm font-bold leading-snug">{n.title}</p>
                <p className="mt-1 text-[11px] text-stone-500">{formatDate(n.publishedAt)}</p>
              </Link>
            ))}
          </div>
        </section>

        <DisclaimerBar />
      </div>
    </div>
  );
}
