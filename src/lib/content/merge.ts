import { DEFAULT_CONTENT } from "./defaults";
import type { SiteContent } from "./types";

/**
 * Built-in posts the saved list doesn't mention are appended, so articles that
 * ship with a code update still appear after an admin has saved content once.
 * (To hide a built-in post, keep it in the saved list marked as a draft.)
 */
function mergePosts(saved: SiteContent["posts"]): SiteContent["posts"] {
  const slugs = new Set(saved.map((p) => p.slug));
  return [...saved, ...DEFAULT_CONTENT.posts.filter((p) => !slugs.has(p.slug))];
}

/**
 * Same for gallery photos, matched by id: photos that ship with a code update show up after an
 * admin has saved the gallery once. (To hide a built-in photo, keep it and tick "Hidden".)
 */
function mergeGallery(saved: SiteContent["gallery"]): SiteContent["gallery"] {
  const ids = new Set(saved.map((g) => g.id));
  return [...saved, ...DEFAULT_CONTENT.gallery.filter((g) => !ids.has(g.id))];
}

/** Saved values win; any section missing from storage falls back to the default. */
export function mergeContent(saved: Partial<SiteContent> | null | undefined): SiteContent {
  if (!saved || typeof saved !== "object") return DEFAULT_CONTENT;
  const merged = { ...DEFAULT_CONTENT } as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_CONTENT) as (keyof SiteContent)[]) {
    const value = saved[key];
    if (value === undefined || value === null) continue;
    const def = DEFAULT_CONTENT[key];
    if (key === "posts" && Array.isArray(value)) {
      merged.posts = mergePosts(value as SiteContent["posts"]);
      continue;
    }
    if (key === "gallery" && Array.isArray(value)) {
      merged.gallery = mergeGallery(value as SiteContent["gallery"]);
      continue;
    }
    merged[key] =
      def && typeof def === "object" && !Array.isArray(def) && typeof value === "object" && !Array.isArray(value)
        ? { ...def, ...value }
        : value;
  }
  return merged as SiteContent;
}
