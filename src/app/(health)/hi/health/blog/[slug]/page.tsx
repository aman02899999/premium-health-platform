import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostArticle, postMetadata } from "@/health/components/posts/PostArticle";
import { findPost, postBlocks, postsIn, translation } from "@/health/lib/posts";

// Hindi versions of the long-form posts: content/blog/hi/<slug>.md
export function generateStaticParams() {
  return postsIn("hi").map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost("hi", slug);
  if (!post) return { title: "लेख नहीं मिला", robots: { index: false, follow: true } };
  return postMetadata(post, translation(post));
}

export default async function HindiPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = findPost("hi", slug);
  if (!post) notFound();
  // Related links point at English guides (the tools and most guides are English-only for now).
  return <PostArticle post={post} blocks={postBlocks("hi", slug)} other={translation(post)} related={post.related} />;
}
