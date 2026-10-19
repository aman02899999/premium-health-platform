// IndexNow: tells Bing (and through it ChatGPT search) which pages changed, instead of waiting for
// a crawl. The key is public by design; the same value is served at /<key>.txt to prove ownership.
import type { SiteContent } from "@/lib/content/types";
import { absoluteUrl } from "@/lib/site";

export const INDEXNOW_KEY = "48e64067cdfaef90b4650d095febaf6e";

/** The pages that carry prices, hours and offers: what AI answers about the gym are built from. */
export const CORE_PATHS = ["/", "/membership", "/faq", "/programs", "/why-royal-fitness", "/contact", "/reviews", "/llms.txt"];

/**
 * What to submit today: the core pages when the site's content changed in the last day or on
 * Mondays (prices also change on their own when an offer starts or ends), plus every blog post
 * published or updated in the last day. IndexNow asks not to resubmit unchanged pages daily.
 */
export function indexNowUrls(c: Pick<SiteContent, "posts">, now: Date, contentUpdatedAt: Date | null, monday: boolean): string[] {
  const dayAgo = now.getTime() - 26 * 3_600_000;
  const core = monday || (contentUpdatedAt !== null && contentUpdatedAt.getTime() >= dayAgo) ? CORE_PATHS : [];
  const posts = c.posts
    .filter((p) => !p.draft && Math.max(Date.parse(p.updated || "") || 0, Date.parse(p.published || "") || 0) >= dayAgo)
    .map((p) => `/blog/${p.slug}`);
  return [...new Set([...core, ...posts])].map((p) => absoluteUrl(p));
}

export async function submitIndexNow(urls: string[]): Promise<number | string> {
  if (!urls.length) return 0;
  const host = new URL(urls[0]).host;
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`, urlList: urls }),
  });
  // 200 and 202 both mean accepted.
  return res.ok ? urls.length : `error ${res.status}`;
}
