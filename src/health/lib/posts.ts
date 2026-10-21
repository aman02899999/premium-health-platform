import "server-only";
import fs from "node:fs";
import path from "node:path";
import { parseMarkdown, type Block } from "@/lib/markdown";
import { POSTS } from "@/health/data/posts-index.generated";
import type { PostLang, PostMeta } from "./post-types";

// Reads a post's body at build time (every post page is static).
const DIR = path.join(process.cwd(), "content/blog");

export const postsIn = (lang: PostLang): PostMeta[] => POSTS.filter((p) => p.lang === lang).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
export const findPost = (lang: PostLang, slug: string): PostMeta | undefined => POSTS.find((p) => p.lang === lang && p.slug === slug);
export const translation = (p: PostMeta): PostMeta | undefined => findPost(p.lang === "en" ? "hi" : "en", p.slug);

export function postBlocks(lang: PostLang, slug: string): Block[] {
  const src = fs.readFileSync(path.join(DIR, lang, `${slug}.md`), "utf8");
  return parseMarkdown(src.replace(/^---\n[\s\S]*?\n---\n?/, ""));
}
