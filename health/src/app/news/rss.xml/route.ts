import { getNewsFeed } from "@/lib/news";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET() {
  const items = await getNewsFeed();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(SITE.name)} — Health News</title>
<link>${SITE.url}/news</link>
<description>${esc(SITE.tagline)}</description>
<language>en-in</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
<ttl>60</ttl>
${items
  .map(
    (n) => `<item>
<title>${esc(n.title)}</title>
<link>${SITE.url}/news/${n.slug}</link>
<guid isPermaLink="true">${SITE.url}/news/${n.slug}</guid>
<category>${esc(n.category)}</category>
<pubDate>${new Date(n.publishedAt).toUTCString()}</pubDate>
<description>${esc(n.summary)}</description>
</item>`
  )
  .join("\n")}
</channel></rss>`;
  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=600",
    },
  });
}
