import type { SiteContent } from "./types";

// Structural check for content posted by the admin panel. It does not try to
// be a full schema — it rejects payloads that would crash rendering.

const ARRAY_KEYS = ["stats", "programs", "plans", "trainers", "gallery", "testimonials", "faqs", "posts"] as const;
const OBJECT_KEYS = ["business", "hero", "seo", "theme"] as const;

export function validateContent(input: unknown): { ok: true; content: SiteContent } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "Content must be an object" };
  const c = input as Record<string, unknown>;
  for (const key of OBJECT_KEYS) {
    if (!c[key] || typeof c[key] !== "object" || Array.isArray(c[key])) return { ok: false, error: `"${key}" must be an object` };
  }
  for (const key of ARRAY_KEYS) {
    if (!Array.isArray(c[key])) return { ok: false, error: `"${key}" must be a list` };
  }
  const posts = c.posts as { slug?: unknown; title?: unknown }[];
  const slugs = new Set<string>();
  for (const post of posts) {
    if (typeof post.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) {
      return { ok: false, error: `Blog slug "${String(post.slug)}" must be lowercase letters, numbers and hyphens` };
    }
    if (slugs.has(post.slug)) return { ok: false, error: `Duplicate blog slug "${post.slug}"` };
    slugs.add(post.slug);
    if (typeof post.title !== "string" || !post.title.trim()) return { ok: false, error: `Blog post "${post.slug}" needs a title` };
  }
  const size = JSON.stringify(input).length;
  if (size > 4_000_000) return { ok: false, error: "Content is too large — upload images instead of pasting them inline" };
  return { ok: true, content: input as SiteContent };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
