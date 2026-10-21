import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import { postsIn } from "@/health/lib/posts";
import { PostIndex } from "@/health/components/posts/PostIndex";

export const metadata: Metadata = {
  title: "हिंदी में स्वास्थ्य गाइड: गहराई से, स्रोतों सहित",
  description: "डेंगू, एनीमिया, नींद, दिल, प्रदूषण, पेट की सेहत और तनाव पर भारतीय परिवारों के लिए हिंदी में लंबी, स्रोतों वाली गाइड।",
  alternates: { canonical: "/hi/health/blog", languages: { "hi-IN": absoluteUrl("/hi/health/blog"), "en-IN": absoluteUrl("/health/blog/guides"), "x-default": absoluteUrl("/health/blog/guides") } },
};

export default function HindiBlogIndex() {
  const posts = postsIn("hi");
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">हेल्थ ब्लॉग · हिंदी</p>
      <h1 className="font-display mt-2 text-3xl font-black md:text-4xl">हिंदी में स्वास्थ्य गाइड</h1>
      <p className="mt-3 max-w-2xl text-stone-600">हर गाइड भारतीय हालात को ध्यान में रखकर लिखी गई है, आधिकारिक स्रोतों के साथ। यह सामान्य जानकारी है, डॉक्टर की सलाह नहीं।</p>
      <div className="mt-8">
        <PostIndex posts={posts} lang="hi" otherHref="/health/blog/guides" />
      </div>
    </div>
  );
}
