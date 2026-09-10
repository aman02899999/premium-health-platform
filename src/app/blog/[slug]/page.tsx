import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock, RefreshCw, ShieldCheck, User } from "lucide-react";
import { ARTICLES } from "@/data/editorial";
import { getAllEnrichedArticles, getEnrichedArticle } from "@/data/blog-enrichment";
import { Breadcrumbs, KeyTakeaway, FaqAccordion, ShareButtons, AdSlot, DisclaimerBar, Newsletter } from "@/components/ui";
import { BookmarkButton, HelpfulVote, PrintButton, ReadingProgress, TableOfContents } from "@/components/engagement";
import { blogPostingJsonLd, faqJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { SITE } from "@/lib/site";
import { RelatedArticles } from "@/components/blog/RelatedArticles";
import { LatestArticles, TrendingArticles } from "@/components/blog/LatestArticles";
import { BlogCategories } from "@/components/blog/BlogCategories";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { AdBanner, AdInArticle, AdRectangle } from "@/components/monetization/AdComponents";
import { HealthProductRecommendations } from "@/components/monetization/HealthProductRecommendations";
import { MonetizationCTA } from "@/components/monetization/MonetizationCTA";
import { DIGITAL_PRODUCTS } from "@/lib/monetization/config";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getEnrichedArticle(slug);
  if (!a) return { title: "Article not found", robots: { index: false, follow: true } };
  const url = `${SITE.url}/blog/${slug}`;
  return {
    title: a.seoTitle,
    description: a.seoDescription,
    keywords: a.keywords,
    authors: [{ name: a.author }],
    alternates: { canonical: `/blog/${slug}`, languages: { "en-IN": url, "en": url, "x-default": url } },
    openGraph: {
      title: a.seoTitle,
      description: a.seoDescription,
      type: "article",
      url,
      siteName: SITE.name,
      publishedTime: a.publishedAt,
      modifiedTime: a.updatedAt,
      authors: [a.author],
      tags: a.tags,
      images: [{ url: a.heroImage, width: 1200, height: 627, alt: a.heroImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: a.seoTitle,
      description: a.seoDescription,
      images: [a.heroImage],
    },
    robots: { index: true, follow: true },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getEnrichedArticle(slug);
  if (!a) notFound();
  const all = getAllEnrichedArticles();
  const idx = all.findIndex((x) => x.slug === slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;
  const related = all.filter((x) => x.slug !== slug && (x.category === a.category || x.tags.some((t) => a.tags.includes(t)))).slice(0, 3);
  const relatedFallback = related.length >= 3 ? related : [...related, ...all.filter((x) => x.slug !== slug && !related.includes(x))].slice(0, 3);
  const toc = [
    { id: "takeaways", label: "Key takeaways" },
    ...a.body.map((s, i) => ({ id: `section-${i}`, label: s.heading })),
    { id: "faqs", label: "FAQs" },
    { id: "references", label: "References" },
  ];
  const midPoint = Math.ceil(a.body.length / 2);
  const keywords = a.keywords ?? [];
  const blogLd = blogPostingJsonLd({
    title: a.title,
    description: a.seoDescription,
    slug: "/blog/" + slug,
    image: a.heroImage,
    imageAlt: a.heroImageAlt,
    datePublished: a.publishedAt,
    dateModified: a.updatedAt,
    category: a.category,
    author: a.author,
    tags: [...a.tags, ...keywords],
    readMinutes: a.readMinutes,
  });
  const faqLd = faqJsonLd(a.faqs);
  const crumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: a.title, path: "/blog/" + slug },
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <ReadingProgress />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: a.category, href: `/blog/category/${a.category.toLowerCase().replace(/\s+/g, "-")}` }, { label: a.title }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }} />

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Main column */}
        <article className="min-w-0 max-w-4xl">
          <p className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600">
            <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {a.category}</span>
            <span className="flex items-center gap-1 text-stone-500"><Clock className="h-3 w-3" />{a.readMinutes} min read</span>
            <span className="flex items-center gap-1 text-stone-500"><CalendarDays className="h-3 w-3" />{a.body.length} sections · {a.faqs.length} FAQs</span>
          </p>
          <h1 className="font-display mt-2 text-3xl font-black leading-tight md:text-[2.75rem]">{a.title}</h1>
          <p className="mt-3 text-lg leading-relaxed text-stone-600 dark:text-stone-300">{a.subtitle}</p>

          {/* Author / review bar */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-stone-200 bg-white p-3.5 text-xs text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
            <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-emerald-600" /> By <strong>{a.author}</strong></span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Medically reviewed by: <strong>{a.reviewer}</strong></span>
            <span className="flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Updated {formatDate(a.updatedAt)} · Published {formatDate(a.publishedAt)}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ShareButtons title={a.title} path={`/blog/${slug}`} />
            <BookmarkButton slug={slug} title={a.title} />
            <PrintButton />
          </div>

          {/* Hero image */}
          <figure className="mt-5 overflow-hidden rounded-3xl border border-stone-200 dark:border-stone-700">
            <div className="relative aspect-[16/9] w-full bg-stone-100 dark:bg-stone-800">
              <Image src={a.heroImage} alt={a.heroImageAlt} fill priority sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover" />
            </div>
            <figcaption className="bg-white px-4 py-2 text-[11px] text-stone-500 dark:bg-stone-900 dark:text-stone-400">
              {a.heroImageAlt} · Photo: {a.heroImageCredit} · Educational image, not medical advice
            </figcaption>
          </figure>

          <div id="takeaways" className="mt-5 scroll-mt-28"><KeyTakeaway points={a.keyTakeaways} /></div>

          {/* Monetization: Top Ad */}
          <div className="mt-5"><AdBanner placement="article_top" page={`/blog/${slug}`} /></div>

          {/* Body sections with inline image at midpoint */}
          <div className="mt-5 space-y-5">
            {a.body.map((sec, i) => (
              <div key={i}>
                <section id={`section-${i}`} className="scroll-mt-28 rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
                  <h2 className="font-display text-xl font-bold md:text-2xl">{sec.heading}</h2>
                  {sec.paragraphs.map((p, j) => <p key={j} className="mt-2.5 text-[15px] leading-[1.85] text-stone-700 dark:text-stone-200">{p}</p>)}
                  {sec.bullets && <ul className="mt-3 space-y-1.5">{sec.bullets.map((b, k) => <li key={k} className="flex gap-2 text-[15px] leading-relaxed text-stone-700 dark:text-stone-200"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />{b}</li>)}</ul>}
                </section>
                {i === midPoint - 1 && (
                  <>
                    <figure className="mt-5 overflow-hidden rounded-3xl border border-stone-200 dark:border-stone-700">
                      <div className="relative aspect-[16/9] w-full bg-stone-100 dark:bg-stone-800">
                        <Image src={a.inlineImage} alt={a.inlineImageAlt} fill loading="lazy" sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover" />
                      </div>
                      <figcaption className="bg-white px-4 py-2 text-[11px] text-stone-500 dark:bg-stone-900 dark:text-stone-400">{a.inlineImageAlt} · Photo: Pexels</figcaption>
                    </figure>
                    <div className="mt-5 space-y-4">
                      <AffiliateProducts limit={2} title="Related Products — Supports Our Work" />
                      <AdInArticle placement="article_middle" page={`/blog/${slug}`} />
                      <div className="rounded-3xl border border-amber-200 bg-white p-5 dark:border-amber-800 dark:bg-stone-900">
                        <h3 className="font-bold">Premium Guide — Deeper Dive</h3>
                        <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">Free: key takeaways, sections, FAQs, references. Premium: detailed checklists, meal plans, monitoring sheets, questions for doctor — educational, not prescription.</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {DIGITAL_PRODUCTS.filter((p) => p.active).slice(0, 2).map((p) => (
                            <div key={p.id} className="rounded-xl border border-stone-200 p-3 dark:border-stone-700">
                              <p className="text-[11px] font-bold uppercase text-amber-600">{p.category} · {p.pages} pages</p>
                              <p className="mt-1 text-sm font-bold">{p.title}</p>
                              <Link href={`/store/${p.slug}`} className="mt-2 inline-block rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-900">{p.ctaText}</Link>
                            </div>
                          ))}
                        </div>
                      </div>
                      <HealthProductRecommendations category={a.category} tags={a.tags.map((t) => t.toLowerCase())} limit={4} page={`/blog/${slug}`} title="Recommended for this topic" />
                      <MonetizationCTA pageType="blog" page={`/blog/${slug}`} />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {a.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5" aria-label="Tags">
              {a.tags.map((t) => <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-100 dark:bg-stone-800">#{t}</Link>)}
            </div>
          )}

          <div className="mt-5 space-y-4">
            <AdSlot slot="In-content" />
            <AdRectangle placement="article_bottom" page={`/blog/${slug}`} />
          </div>

          {/* Related — SEO internal linking */}
          <div className="mt-6"><RelatedArticles currentSlug={slug} category={a.category} tags={a.tags} limit={4} /></div>

          <section id="faqs" className="mt-5 scroll-mt-28 rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-display mb-1 text-xl font-bold md:text-2xl">Frequently asked questions</h2>
            <p className="mb-3 text-[13px] text-stone-500">{a.faqs.length} expert-answered questions on {a.title.toLowerCase().split(":")[0]}.</p>
            <FaqAccordion faqs={a.faqs} />
          </section>

          <section id="references" className="mt-5 scroll-mt-28 rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-display text-xl font-bold">References & guideline sources</h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-stone-600 dark:text-stone-300">
              {a.references.map((r, i) => (
                <li key={i}>
                  {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-700 hover:underline">{r.title}</a> : r.title} — <em>{r.source}</em>{r.year ? ` (${r.year})` : ""}
                </li>
              ))}
            </ol>
            <p className="mt-3 rounded-xl bg-stone-50 p-3 text-xs leading-relaxed text-stone-500 dark:bg-stone-800">We cite guidelines and peer-reviewed reviews — never fabricated studies. Specific trial citations are expanded during medical review.</p>
          </section>

          <div className="mt-5"><HelpfulVote slug={slug} /></div>

          {/* Prev / Next */}
          <nav className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="More guides">
            {prev ? (
              <Link href={`/blog/${prev.slug}`} className="group rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
                <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-stone-400"><ChevronLeft className="h-3 w-3" /> Previous guide</span>
                <span className="mt-1 block text-sm font-bold leading-snug group-hover:text-emerald-700">{prev.title}</span>
              </Link>
            ) : <span />}
            {next && (
              <Link href={`/blog/${next.slug}`} className="group rounded-2xl border border-stone-200 bg-white p-4 text-right dark:border-stone-700 dark:bg-stone-900">
                <span className="flex items-center justify-end gap-1 text-[11px] font-bold uppercase tracking-wider text-stone-400">Next guide <ChevronRight className="h-3 w-3" /></span>
                <span className="mt-1 block text-sm font-bold leading-snug group-hover:text-emerald-700">{next.title}</span>
              </Link>
            )}
          </nav>

          <div className="mt-6 space-y-4">
            <AdBanner placement="article_bottom" page={`/blog/${slug}`} />
            <Newsletter compact />
            <DisclaimerBar />
          </div>
        </article>

        {/* Sidebar — SEO + Earning optimized */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="lg:block"><TableOfContents headings={toc} /></div>
          <BlogCategories activeCategory={a.category} />
          <LatestArticles limit={4} />
          <TrendingArticles limit={4} />
          <PremiumCTA compact />
          <AffiliateProducts limit={2} />
          <AdBanner placement="products_sidebar" page={`/blog/${slug}`} />
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
            <p className="border-b border-stone-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500 dark:border-stone-800">Related guides — SEO</p>
            {relatedFallback.map((r) => (
              <Link key={r.slug} href={`/blog/${r.slug}`} className="flex gap-3 border-b border-stone-100 p-3 last:border-0 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-800/60">
                <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                  <Image src={r.heroImage} alt="" fill sizes="80px" className="object-cover" loading="lazy" />
                </span>
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-600">{r.category}</span>
                  <span className="line-clamp-2 text-[13px] font-bold leading-snug">{r.title}</span>
                </span>
              </Link>
            ))}
          </div>
          <AdSlot slot="Blog sidebar" />
        </aside>
      </div>
    </div>
  );
}
