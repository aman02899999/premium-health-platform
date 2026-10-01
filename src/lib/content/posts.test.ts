import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "./defaults";
import { mergeContent } from "./merge";
import { calculatorByKey } from "../calculators";
import { EXERCISES } from "../fitness/exercises";
import { DIET_PLANS } from "../fitness/diet-plans";
import { BOOKS } from "../library/catalog";
import { parseMarkdown } from "../markdown";
import { HINGLISH_POSTS } from "./hinglish-posts";

const posts = DEFAULT_CONTENT.posts;
const slugs = new Set(posts.map((p) => p.slug));

// Static gym pages a post may link to (see src/app/(gym)/(site)).
const PAGES = new Set(["/", "/library", "/membership", "/programs", "/contact", "/gallery", "/about", "/tools", "/health-hub", "/blog", "/exercises", "/diet-plans", "/nutrition", "/workout-planner", "/timers", "/progress"]);

function linkResolves(href: string) {
  const path = href.split("#")[0];
  const [, section, slug] = path.split("/");
  if (PAGES.has(path)) return true;
  if (section === "blog") return slugs.has(slug);
  if (section === "exercises") return EXERCISES.some((e) => e.slug === slug);
  if (section === "diet-plans") return DIET_PLANS.some((d) => d.slug === slug);
  if (section === "library") return BOOKS.some((b) => b.slug === slug);
  return false;
}

describe("built-in blog posts", () => {
  it("have unique slugs", () => {
    expect(slugs.size).toBe(posts.length);
  });

  it.each(posts.map((p) => [p.slug, p] as const))("%s is complete and its links resolve", (_slug, post) => {
    expect(post.title.length).toBeGreaterThan(10);
    expect(post.seoTitle.length).toBeLessThanOrEqual(70);
    expect(post.seoDescription.length).toBeLessThanOrEqual(170);
    expect(post.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const [, key] of post.body.matchAll(/\[\[calculator:([a-z-]+)\]\]/g)) expect(calculatorByKey(key), key).toBeTruthy();
    for (const [, href] of post.body.matchAll(/\]\((\/[^)\s]*)\)/g)) expect(linkResolves(href), href).toBe(true);
  });
});

describe("mergeContent posts", () => {
  it("keeps built-in posts that a saved list doesn't mention", () => {
    const saved = [{ ...posts[0], title: "Edited title" }];
    const merged = mergeContent({ posts: saved });
    expect(merged.posts[0].title).toBe("Edited title");
    expect(merged.posts).toHaveLength(posts.length);
  });

  it("keeps a built-in post hidden when saved as a draft", () => {
    const merged = mergeContent({ posts: [{ ...posts[1], draft: true }] });
    expect(merged.posts.filter((p) => p.slug === posts[1].slug)).toEqual([expect.objectContaining({ draft: true })]);
  });
});

describe("Hinglish series", () => {
  it("ships at least 10 posts, each with a quiz and a call to action", () => {
    expect(HINGLISH_POSTS.length).toBeGreaterThanOrEqual(10);
    for (const p of HINGLISH_POSTS) {
      expect(slugs.has(p.slug)).toBe(true);
      expect(p.category).toBe("Hinglish");
      expect(p.seoDescription.length).toBeGreaterThan(80);
      const blocks = parseMarkdown(p.body);
      expect(blocks.some((b) => b.t === "quiz"), p.slug).toBe(true);
      expect(blocks.some((b) => b.t === "cta"), p.slug).toBe(true);
    }
  });
});
