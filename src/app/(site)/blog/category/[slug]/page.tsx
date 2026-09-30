import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent } from "@/lib/content/store";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { categorySlug, publishedPosts } from "@/lib/site";
import { PostCard } from "@/components/home/Blocks";
import { PageHero } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const c = await getContent();
  const posts = publishedPosts(c).filter((p) => categorySlug(p.category) === slug);
  return { c, posts, name: posts[0]?.category };
}

export async function generateStaticParams() {
  const c = await getContent();
  return [...new Set(publishedPosts(c).map((p) => categorySlug(p.category)))].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { c, name } = await load(slug);
  if (!name) return {};
  return pageMeta(c, { title: `${name} Articles`, description: `All ${name.toLowerCase()} guides from ${c.business.name}, Noida.`, path: `/blog/category/${slug}` });
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const { posts, name } = await load(slug);
  if (!name) notFound();
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name, path: `/blog/category/${slug}` },
        ])}
      />
      <PageHero eyebrow="Category" title={name} />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {posts.map((p, i) => (
          <PostCard key={p.slug} post={p} index={i % 3} />
        ))}
      </section>
    </>
  );
}
