import { ImageResponse } from "next/og";
import { getContent } from "@/lib/content/store";
import { OgCard, loadLogo } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Blog article";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getContent();
  const post = c.posts.find((p) => p.slug === slug);
  return new ImageResponse(<OgCard logoSrc={await loadLogo()} kicker={`${c.business.name} · ${post?.category ?? "Blog"}`} title={post?.title ?? c.business.name} subtitle="Read the full guide →" />, size);
}
