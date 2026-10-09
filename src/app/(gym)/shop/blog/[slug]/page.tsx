import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fitTitle } from "@/lib/shop/format";
import { getCatalog, getPosts } from "@/lib/shop/server";
import { parseMarkdown } from "@/lib/markdown";
import { SITE_URL } from "@/lib/site";
import { Markdown } from "@/components/blog/Markdown";
import { ProductCard } from "@/components/shop/cards";
import { JsonLd } from "@/components/ui/JsonLd";

async function find(slug: string) {
  const posts = await getPosts();
  return { post: posts.find((p) => p.slug === slug), posts };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { post } = await find(slug);
  if (!post) return { title: "Guide not found", robots: { index: false } };
  return {
    title: fitTitle(post.seoTitle || post.title, (await getCatalog()).settings.storeName),
    description: (post.seoDescription || post.excerpt).slice(0, 160),
    alternates: { canonical: `/shop/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.excerpt, url: `${SITE_URL}/shop/blog/${post.slug}`, publishedTime: post.createdAt, modifiedTime: post.updatedAt },
  };
}

export default async function ShopPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ post, posts }, { products, settings }] = await Promise.all([find(slug), getCatalog()]);
  if (!post) notFound();
  const picks = products.filter((p) => post.categorySlug && p.category?.slug === post.categorySlug).slice(0, 4);
  const more = posts.filter((p) => p.id !== post.id).slice(0, 3);
  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          datePublished: post.createdAt,
          dateModified: post.updatedAt,
          author: { "@type": "Organization", name: settings.storeName },
          publisher: { "@type": "Organization", name: settings.storeName },
          mainEntityOfPage: `${SITE_URL}/shop/blog/${post.slug}`,
        }}
      />
      <nav className="mb-4 text-xs text-white/50" aria-label="Breadcrumb">
        <Link href="/shop/blog" className="hover:text-amber-300">
          Supplement guides
        </Link>
      </nav>
      <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl">{post.title}</h1>
      <p className="mt-3 text-lg text-white/65">{post.excerpt}</p>
      <p className="mt-2 text-xs text-white/40">Updated {new Date(post.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · General information, not medical advice.</p>
      <div className="mt-8">
        <Markdown blocks={parseMarkdown(post.body)} cta={{ whatsapp: settings.whatsapp, phone: settings.phone }} />
      </div>
      {picks.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display mb-4 text-2xl text-white">Shop {post.categorySlug?.replace(/-/g, " ")}</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            {picks.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}
      {more.length > 0 && (
        <section className="mt-12 border-t border-white/10 pt-8">
          <h2 className="font-display mb-4 text-2xl text-white">More guides</h2>
          <ul className="space-y-2">
            {more.map((p) => (
              <li key={p.id}>
                <Link href={`/shop/blog/${p.slug}`} className="inline-block py-1 text-amber-300 hover:text-amber-200">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
