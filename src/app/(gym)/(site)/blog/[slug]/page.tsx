import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight, Clock } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { parseMarkdown, readingMinutes, toc } from "@/lib/markdown";
import { articleJsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { absoluteUrl, categorySlug, publishedPosts, telHref, whatsappHref } from "@/lib/site";
import { Markdown } from "@/components/blog/Markdown";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { Toc } from "@/components/blog/Toc";
import { PostCard } from "@/components/home/Blocks";
import { JsonLd } from "@/components/ui/JsonLd";
import { SmartImage } from "@/components/ui/SmartImage";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const c = await getContent();
  return publishedPosts(c).map((p) => ({ slug: p.slug }));
}

async function load(slug: string) {
  const c = await getContent();
  return { c, post: publishedPosts(c).find((p) => p.slug === slug) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { c, post } = await load(slug);
  if (!post) return {};
  const meta = pageMeta(c, {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.cover || null,
    type: "article",
  });
  return {
    ...meta,
    keywords: post.tags,
    openGraph: { ...meta.openGraph, url: absoluteUrl(`/blog/${post.slug}`), type: "article", publishedTime: post.published, modifiedTime: post.updated || post.published, section: post.category, tags: post.tags },
  };
}

const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const { c, post } = await load(slug);
  if (!post) notFound();

  const blocks = parseMarkdown(post.body);
  const headings = toc(blocks);
  const all = publishedPosts(c).filter((p) => p.slug !== post.slug);
  const related = [...all.filter((p) => p.category === post.category), ...all.filter((p) => p.category !== post.category)].slice(0, 3);
  const url = absoluteUrl(`/blog/${post.slug}`);

  return (
    <>
      <ReadingProgress />
      <JsonLd
        data={[
          articleJsonLd(c, post),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.category, path: `/blog/category/${categorySlug(post.category)}` },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <article>
        <header className="relative overflow-hidden pb-10 pt-36 sm:pt-44">
          <div className="grid-floor pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-white/50">
              <Link href="/" className="hover:text-brand">Home</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href="/blog" className="hover:text-brand">Blog</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href={`/blog/category/${categorySlug(post.category)}`} className="text-brand hover:underline">{post.category}</Link>
            </nav>
            <h1 className="font-display max-w-4xl text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">{post.title}</h1>
            <p className="mt-5 max-w-3xl text-lg text-white/70">{post.excerpt}</p>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-y border-white/10 py-4">
              <div className="flex flex-wrap items-center gap-5 text-sm text-white/60">
                <span className="font-semibold text-white">{post.author}</span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-brand" />
                  <time dateTime={post.updated || post.published}>Updated {fmt(post.updated || post.published)}</time>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-brand" /> {readingMinutes(post.body)} min read
                </span>
              </div>
              <ShareButtons url={url} title={post.title} />
            </div>
          </div>
        </header>

        {post.cover && (
          <div className="mx-auto mb-10 max-w-5xl px-4 sm:px-6">
            <div className="aspect-[16/8] overflow-hidden rounded-3xl ring-1 ring-white/10">
              <SmartImage src={post.cover} alt={post.title} priority fit="contain" />
            </div>
          </div>
        )}

        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_260px]">
          <div className="min-w-0">
            <Markdown blocks={blocks} cta={{ whatsapp: whatsappHref(c.business), phone: telHref(c.business.phone) }} />
            {post.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <Link key={t} href={`/blog?q=${encodeURIComponent(t)}`} className="rounded-full border border-white/15 px-3 py-1 text-sm text-white/65 hover:border-brand hover:text-brand">
                    #{t}
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-8 border-t border-white/10 pt-6">
              <ShareButtons url={url} title={post.title} />
            </div>
          </div>
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-6">
              <Toc items={headings} />
            </div>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 className="font-display mb-8 text-3xl text-white">Keep reading</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((p, i) => (
              <PostCard key={p.slug} post={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
