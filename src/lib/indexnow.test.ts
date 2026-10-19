import { describe, expect, it } from "vitest";
import { indexNowUrls, CORE_PATHS } from "./indexnow";

const post = (slug: string, published: string, updated = "", draft = false) => ({ slug, published, updated, draft }) as never;

describe("IndexNow URL list", () => {
  const now = new Date("2026-10-21T02:15:00Z");
  it("sends nothing on a quiet day", () => {
    expect(indexNowUrls({ posts: [post("old", "2026-09-01")] }, now, new Date("2026-10-01T00:00:00Z"), false)).toEqual([]);
  });
  it("sends the core pages after a content change or on Mondays, plus new and updated posts", () => {
    const urls = indexNowUrls({ posts: [post("new", "2026-10-20T09:00:00Z"), post("edited", "2026-01-01", "2026-10-20T10:00:00Z"), post("hidden", "2026-10-20", "", true)] }, now, new Date("2026-10-20T12:00:00Z"), false);
    expect(urls).toHaveLength(CORE_PATHS.length + 2);
    expect(urls).toContain("https://www.royalfitnesclub.in/faq");
    expect(urls).toContain("https://www.royalfitnesclub.in/blog/edited");
    expect(urls.some((u) => u.endsWith("/hidden"))).toBe(false);
    expect(indexNowUrls({ posts: [] }, now, null, true)).toHaveLength(CORE_PATHS.length);
  });
});
