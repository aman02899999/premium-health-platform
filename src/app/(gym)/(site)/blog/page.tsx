import type { Metadata } from "next";
import { getContent } from "@/lib/content/store";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { SITE_URL, absoluteUrl, publishedPosts } from "@/lib/site";
import { BlogExplorer } from "@/components/blog/BlogExplorer";
import { PageHero } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return {
    ...pageMeta(c, {
      title: "Fitness Blog — Workouts, Indian Diet & Fat Loss Guides",
      description: `Workout plans, vegetarian Indian diet guides, fat-loss tips and interactive fitness tools from the coaches at ${c.business.name}, Noida.`,
      path: "/blog",
    }),
    alternates: { canonical: absoluteUrl("/blog"), types: { "application/rss+xml": absoluteUrl("/blog/rss.xml") } },
  };
}

export default async function BlogPage() {
  const c = await getContent();
  const posts = publishedPosts(c);
  const categories = [...new Set(posts.map((p) => p.category))];
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]),
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: `${c.business.name} Blog`,
            url: absoluteUrl("/blog"),
            publisher: { "@id": `${SITE_URL}/#gym` },
            blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: absoluteUrl(`/blog/${p.slug}`), datePublished: p.published })),
          },
        ]}
      />
      <PageHero eyebrow="The Royal Blog" title="Train smarter," highlight="eat better" intro="Interactive guides with built-in calculators and quizzes — written for Indian gym-goers." />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <BlogExplorer posts={posts} categories={categories} />
      </section>
    </>
  );
}
