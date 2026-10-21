import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import { postsIn } from "@/health/lib/posts";
import { PostIndex } from "@/health/components/posts/PostIndex";

export const metadata: Metadata = {
  title: "In-Depth Health Guides for Indian Families",
  description: "Long, fully referenced guides on dengue, anaemia, sleep, heart risk, air pollution, gut health, ultra-processed food and stress, in English and Hindi.",
  alternates: { canonical: "/health/blog/guides", languages: { "en-IN": absoluteUrl("/health/blog/guides"), "hi-IN": absoluteUrl("/hi/health/blog"), "x-default": absoluteUrl("/health/blog/guides") } },
};

export default function GuidesIndex() {
  const posts = postsIn("en");
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Health blog · In-depth guides</p>
      <h1 className="font-display mt-2 text-3xl font-black md:text-4xl">In-depth guides for Indian families</h1>
      <p className="mt-3 max-w-2xl text-stone-600">Each guide is written for Indian conditions and cites official and peer-reviewed sources. General information, not medical advice.</p>
      <div className="mt-8">
        <PostIndex posts={posts} lang="en" otherHref="/hi/health/blog" />
      </div>
    </div>
  );
}
