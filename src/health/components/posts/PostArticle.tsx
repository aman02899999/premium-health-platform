import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, Clock, Languages, ShieldAlert, Stethoscope, UserRound } from "lucide-react";
import type { Block } from "@/lib/markdown";
import { toc } from "@/lib/markdown";
import { SITE } from "@/health/lib/site";
import { absoluteUrl } from "@/lib/site";
import { HEALTH_ORG_ID, breadcrumbJsonLd, faqJsonLd, healthPublisher } from "@/health/lib/seo";
import { postPath, type PostLang, type PostMeta } from "@/health/lib/post-types";
import { PostBody } from "./PostBody";

const T = {
  en: {
    home: "Health",
    blog: "Blog",
    updated: "Last reviewed",
    min: "min read",
    disclaimer:
      "This guide is general health information, not medical advice, and it doesn't replace your doctor. Don't start, stop or change any medicine on the basis of this page. In an emergency call 112 or go to the nearest hospital.",
    pending: "Medical review pending: this guide is being checked by a doctor. Until then, treat it as general information and confirm anything important with your doctor.",
    reviewedBy: "Medically reviewed by",
    writtenBy: "Written by",
    sources: "Sources",
    sourcesNote: "We cite primary and official sources. Numbers are quoted as the source reports them.",
    contents: "In this guide",
    other: "हिंदी में पढ़ें",
    authorNote: "Written by the health desk at Royal Fitness Club, Sector 93 Noida: coaches who work with members on training, food and habits every day. We are not doctors, so every guide goes to a medical reviewer before it is marked reviewed.",
    cta: "Want help putting this into practice? Royal Fitness Club in Sector 93, Noida offers a free trial session with a trainer.",
    ctaLink: "Book a free trial",
  },
  hi: {
    home: "हेल्थ",
    blog: "ब्लॉग",
    updated: "आख़िरी समीक्षा",
    min: "मिनट पढ़ने का समय",
    disclaimer:
      "यह गाइड सामान्य स्वास्थ्य जानकारी है, डॉक्टर की सलाह नहीं, और यह आपके डॉक्टर की जगह नहीं लेती। इस पेज के आधार पर कोई दवा शुरू, बंद या बदलें नहीं। इमरजेंसी में 112 पर कॉल करें या नज़दीकी अस्पताल जाएँ।",
    pending: "डॉक्टर की समीक्षा बाकी है: यह गाइड अभी एक डॉक्टर जाँच रहे हैं। तब तक इसे सामान्य जानकारी मानें और ज़रूरी बातें अपने डॉक्टर से पक्की करें।",
    reviewedBy: "डॉक्टर द्वारा समीक्षा",
    writtenBy: "लेखक",
    sources: "स्रोत",
    sourcesNote: "हम प्राथमिक और आधिकारिक स्रोतों का हवाला देते हैं। आँकड़े वैसे ही दिए गए हैं जैसे स्रोत में हैं।",
    contents: "इस गाइड में",
    other: "Read in English",
    authorNote: "रॉयल फ़िटनेस क्लब, सेक्टर 93 नोएडा की हेल्थ डेस्क द्वारा लिखा गया: ये कोच रोज़ सदस्यों के साथ ट्रेनिंग, खान-पान और आदतों पर काम करते हैं। हम डॉक्टर नहीं हैं, इसलिए हर गाइड 'समीक्षित' लिखे जाने से पहले डॉक्टर के पास जाती है।",
    cta: "इसे अपनी ज़िंदगी में लागू करने में मदद चाहिए? सेक्टर 93, नोएडा के रॉयल फ़िटनेस क्लब में ट्रेनर के साथ एक फ़्री ट्रायल सेशन लें।",
    ctaLink: "फ़्री ट्रायल बुक करें",
  },
} as const;

const fmt = (iso: string, lang: PostLang) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Metadata for a post page: canonical, en-IN/hi-IN alternates, Open Graph. */
export function postMetadata(p: PostMeta, other: PostMeta | undefined): Metadata {
  const path = postPath(p.lang, p.slug);
  const languages: Record<string, string> = { [p.lang === "hi" ? "hi-IN" : "en-IN"]: absoluteUrl(path) };
  if (other) languages[other.lang === "hi" ? "hi-IN" : "en-IN"] = absoluteUrl(postPath(other.lang, other.slug));
  languages["x-default"] = absoluteUrl(postPath("en", p.slug));
  const title = p.lang === "hi" ? p.hindiTitle : p.title;
  return {
    title,
    description: p.description,
    keywords: p.tags,
    authors: [{ name: p.author }],
    alternates: { canonical: path, languages },
    openGraph: {
      type: "article",
      title,
      description: p.description,
      url: absoluteUrl(path),
      siteName: SITE.name,
      locale: p.lang === "hi" ? "hi_IN" : "en_IN",
      publishedTime: p.publishedAt,
      modifiedTime: p.lastReviewed,
      authors: [p.author],
      tags: p.tags,
      images: [{ url: absoluteUrl(p.heroImage.replace(/\.svg$/, ".png")), width: 1200, height: 630, alt: p.heroAlt }],
    },
    twitter: { card: "summary_large_image", title, description: p.description },
  };
}

export function PostArticle({ post, blocks, other, related }: { post: PostMeta; blocks: Block[]; other?: PostMeta; related: { href: string; label: string }[] }) {
  const t = T[post.lang];
  const lang = post.lang;
  const path = postPath(lang, post.slug);
  const blogPath = lang === "hi" ? "/hi/health/blog" : "/health/blog";
  const title = lang === "hi" ? post.hindiTitle : post.title;
  const headings = toc(blocks).filter((h) => h.level === 2);
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: post.description,
    inLanguage: lang === "hi" ? "hi-IN" : "en-IN",
    image: [absoluteUrl(post.heroImage.replace(/\.svg$/, ".png"))],
    datePublished: post.publishedAt,
    dateModified: post.lastReviewed,
    author: { "@type": "Organization", name: post.author, url: absoluteUrl("/health/blog/author"), parentOrganization: { "@id": HEALTH_ORG_ID } },
    publisher: healthPublisher(),
    mainEntityOfPage: absoluteUrl(path),
    articleSection: post.category,
    keywords: post.tags.join(", "),
    wordCount: post.words,
    citation: post.sources.map((s) => ({ "@type": "CreativeWork", name: s.title, publisher: s.publisher, url: s.url || undefined })),
    ...(post.reviewStatus === "medically-reviewed" ? { reviewedBy: { "@type": "Person", name: post.reviewedBy }, lastReviewed: post.lastReviewed } : {}),
  };
  const jsonld = [
    article,
    faqJsonLd(post.faqs),
    breadcrumbJsonLd([
      { name: t.home, path: lang === "hi" ? "/hi/health/blog" : "/health" },
      { name: t.blog, path: blogPath },
      { name: title, path },
    ]),
  ];

  return (
    <article lang={lang === "hi" ? "hi" : "en"} className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-stone-500">
        <Link href={lang === "hi" ? "/hi/health/blog" : "/health"} className="hover:text-emerald-700">{t.home}</Link>
        <span>/</span>
        <Link href={blogPath} className="hover:text-emerald-700">{t.blog}</Link>
        <span>/</span>
        <span className="text-stone-700 dark:text-stone-300">{post.category}</span>
      </nav>

      <header className="mt-4 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">{post.category}</p>
        <h1 className="font-display mt-2 text-3xl font-black leading-tight text-stone-900 dark:text-white md:text-5xl">{title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-stone-600 dark:text-stone-300">{post.description}</p>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone-600 dark:text-stone-400">
          <span className="flex items-center gap-1.5"><UserRound className="h-4 w-4 text-emerald-700" /> {post.author}</span>
          <span className="flex items-center gap-1.5"><Stethoscope className="h-4 w-4 text-emerald-700" /> {t.reviewedBy}: {post.reviewedBy}</span>
          <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-emerald-700" /> {t.updated} <time dateTime={post.lastReviewed}>{fmt(post.lastReviewed, lang)}</time></span>
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-emerald-700" /> {post.readingTime} {t.min}</span>
          {other && (
            <Link href={postPath(other.lang, other.slug)} hrefLang={other.lang === "hi" ? "hi-IN" : "en-IN"} className="flex items-center gap-1.5 rounded-full bg-emerald-700 px-3 py-1 font-bold text-white hover:bg-emerald-800">
              <Languages className="h-4 w-4" /> {t.other}
            </Link>
          )}
        </div>
      </header>

      <div role="note" className="mt-6 max-w-3xl rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="flex gap-2"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden /> <span>{t.disclaimer}</span></p>
        {post.reviewStatus !== "medically-reviewed" && <p className="mt-2 pl-7 font-semibold">{t.pending}</p>}
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-stone-200 bg-white dark:border-stone-800">
        <Image src={post.heroImage} alt={post.heroAlt} width={1200} height={630} priority unoptimized={post.heroImage.endsWith(".svg")} sizes="(max-width: 1152px) 100vw, 1152px" className="h-auto w-full" />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 max-w-3xl">
          <PostBody blocks={blocks} lang={lang} />

          <section aria-labelledby="sources" className="mt-12 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h2 id="sources" className="font-display text-xl font-black text-stone-900 dark:text-white">{t.sources}</h2>
            <p className="mt-1 text-sm text-stone-500">{t.sourcesNote}</p>
            <ol className="mt-3 list-decimal space-y-2 pl-6 text-sm leading-6 text-stone-700 dark:text-stone-300">
              {post.sources.map((s) => (
                <li key={s.title}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 underline dark:text-emerald-400">{s.title}</a>
                  ) : (
                    <span className="font-semibold">{s.title}</span>
                  )}
                  {s.publisher && <> · {s.publisher}</>}
                  {s.year && <> · {s.year}</>}
                </li>
              ))}
            </ol>
          </section>

          <section aria-label={t.writtenBy} className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-5 dark:border-stone-700 dark:bg-stone-900">
            <p className="text-sm font-bold text-stone-900 dark:text-white">{t.writtenBy}: {post.author}</p>
            <p className="mt-1 text-sm font-semibold text-stone-700 dark:text-stone-300">{t.reviewedBy}: {post.reviewedBy}</p>
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">{t.authorNote}</p>
          </section>

          <aside className="mt-8 rounded-2xl bg-gradient-to-br from-emerald-900 to-teal-800 p-6 text-white">
            <p className="leading-7">{t.cta}</p>
            <Link href="/contact#trial" className="mt-4 inline-block rounded-full bg-amber-400 px-5 py-2.5 font-bold text-stone-900 hover:bg-amber-300">{t.ctaLink} →</Link>
          </aside>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            {headings.length > 0 && (
              <nav aria-label={t.contents} className="rounded-2xl border border-stone-200 bg-white p-4 text-sm dark:border-stone-700 dark:bg-stone-900">
                <p className="font-bold text-stone-900 dark:text-white">{t.contents}</p>
                <ol className="mt-2 space-y-1.5">
                  {headings.map((h) => (
                    <li key={h.id}>
                      <a href={`#${h.id}`} className="text-stone-600 hover:text-emerald-700 dark:text-stone-400">{h.text}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            {related.length > 0 && (
              <nav aria-label="Related" className="rounded-2xl border border-stone-200 bg-white p-4 text-sm dark:border-stone-700 dark:bg-stone-900">
                <ul className="space-y-1.5">
                  {related.map((r) => (
                    <li key={r.href}>
                      <Link href={r.href} className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">{r.label} →</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
