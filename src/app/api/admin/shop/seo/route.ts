import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export type PageAudit = {
  url: string;
  status: number;
  ms: number;
  kb: number;
  title: string;
  description: string;
  h1: number;
  canonical: string;
  noindex: boolean;
  jsonLd: string[];
  images: number;
  imagesNoAlt: number;
  issues: string[];
};

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
const attr = (tag: string, name: string) => decode(tag.match(new RegExp(`${name}="([^"]*)"`, "i"))?.[1] ?? "");

/** Checks one rendered page the way a search engine reads it. */
function audit(url: string, status: number, ms: number, html: string): PageAudit {
  const head = html.slice(0, html.indexOf("</head>") > 0 ? html.indexOf("</head>") : 50_000);
  const title = decode(head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "");
  const metaDesc = head.match(/<meta[^>]+name="description"[^>]*>/i)?.[0];
  const description = metaDesc ? attr(metaDesc, "content") : "";
  const canonTag = head.match(/<link[^>]+rel="canonical"[^>]*>/i)?.[0];
  const canonical = canonTag ? attr(canonTag, "href") : "";
  const robots = head.match(/<meta[^>]+name="robots"[^>]*>/i)?.[0];
  const noindex = !!robots && /noindex/i.test(attr(robots, "content"));
  const h1 = (html.match(/<h1[\s>]/gi) ?? []).length;
  const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
  const imagesNoAlt = imgs.filter((t) => !/\balt="[^"]+"/i.test(t) && !/aria-hidden="true"/i.test(t) && !/\balt=""/i.test(t)).length;
  const jsonLd = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].flatMap((m) => {
    try {
      const j = JSON.parse(m[1]);
      return (Array.isArray(j) ? j : j["@graph"] ?? [j]).map((x: { "@type"?: string }) => String(x["@type"] ?? "?"));
    } catch {
      return ["invalid JSON-LD"];
    }
  });
  const issues: string[] = [];
  if (status !== 200) issues.push(`HTTP ${status}`);
  if (!title) issues.push("No title");
  else if (title.length < 25) issues.push(`Title short (${title.length} chars)`);
  else if (title.length > 65) issues.push(`Title long (${title.length} chars)`);
  if (!description) issues.push("No meta description");
  else if (description.length < 70) issues.push(`Description short (${description.length})`);
  else if (description.length > 165) issues.push(`Description long (${description.length})`);
  if (h1 === 0) issues.push("No H1");
  if (h1 > 1) issues.push(`${h1} H1 headings`);
  if (!canonical) issues.push("No canonical");
  if (noindex) issues.push("noindex (hidden from Google)");
  if (imagesNoAlt) issues.push(`${imagesNoAlt} image(s) without alt text`);
  if (jsonLd.includes("invalid JSON-LD")) issues.push("Broken structured data");
  if (ms > 2500) issues.push(`Slow response (${(ms / 1000).toFixed(1)}s)`);
  return { url, status, ms, kb: Math.round(html.length / 1024), title, description, h1, canonical, noindex, jsonLd, images: imgs.length, imagesNoAlt, issues };
}

/** Crawls the live sitemap (the store, or the whole site) and reports per-page SEO issues. */
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const params = new URL(req.url).searchParams;
  const scope = params.get("scope") === "all" ? "all" : "shop";
  const origin = new URL(req.url).origin;
  let urls: string[];
  try {
    const xml = await (await fetch(`${origin}/sitemap.xml`, { cache: "no-store" })).text();
    urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
  } catch {
    return NextResponse.json({ error: "Couldn't read the sitemap." }, { status: 502 });
  }
  // The sitemap holds the public domain; crawl this deployment so results match what is live here.
  const local = urls.map((u) => {
    const p = new URL(u);
    return { shown: u, fetch: `${origin}${p.pathname}${p.search}` };
  });
  const pick = (scope === "shop" ? local.filter((u) => new URL(u.fetch).pathname.startsWith("/shop")) : local).slice(0, 80);
  const results: PageAudit[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (i < pick.length) {
        const u = pick[i++];
        const t0 = Date.now();
        try {
          const res = await fetch(u.fetch, { cache: "no-store", headers: { "User-Agent": "RoyalSEOAudit/1.0" }, signal: AbortSignal.timeout(15_000) });
          const html = await res.text();
          results.push(audit(u.shown, res.status, Date.now() - t0, html));
        } catch {
          results.push({ url: u.shown, status: 0, ms: Date.now() - t0, kb: 0, title: "", description: "", h1: 0, canonical: "", noindex: false, jsonLd: [], images: 0, imagesNoAlt: 0, issues: ["Didn't load"] });
        }
      }
    }),
  );
  const titles = new Map<string, number>();
  for (const r of results) if (r.title) titles.set(r.title, (titles.get(r.title) ?? 0) + 1);
  for (const r of results) if (r.title && (titles.get(r.title) ?? 0) > 1) r.issues.push("Title used on another page too");
  results.sort((a, b) => b.issues.length - a.issues.length || a.url.localeCompare(b.url));
  const clean = results.filter((r) => r.issues.length === 0).length;
  return NextResponse.json({
    scope,
    total: urls.length,
    checked: results.length,
    score: results.length ? Math.round((clean / results.length) * 100) : 0,
    pages: results,
  });
}
