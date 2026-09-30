import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { newsItems } from "@/db/schema";
import { NEWS_CATEGORIES, getTodayBriefing, istDateKey } from "@/data/news";
import type { NewsItem } from "@/types";

export const dynamic = "force-dynamic";

/** Optional protection: set NEWS_ADMIN_TOKEN and send "x-news-token" to lock writes. */
function authorised(request: Request) {
  const token = process.env.NEWS_ADMIN_TOKEN;
  if (!token) return true;
  return request.headers.get("x-news-token") === token;
}

function validate(payload: unknown): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  if (!payload || typeof payload !== "object") return { ok: false, error: "Body must be a JSON object" };
  const v = payload as Record<string, unknown>;
  if (typeof v.title !== "string" || v.title.trim().length < 8) return { ok: false, error: "title must be at least 8 characters" };
  if (typeof v.summary !== "string" || v.summary.trim().length < 20) return { ok: false, error: "summary must be at least 20 characters" };
  if (typeof v.category !== "string" || !NEWS_CATEGORIES.includes(v.category as never)) return { ok: false, error: `category must be one of: ${NEWS_CATEGORIES.join(", ")}` };
  if (!Array.isArray(v.body) || v.body.length === 0) return { ok: false, error: "body must be a non-empty array of { heading, paragraphs?, bullets? }" };
  const banned = /cure[sd]?\b|guaranteed|100%|miracle|replaces? (your )?(doctor|medicine)|stop (your )?medicin/i;
  if (banned.test(String(v.title)) || banned.test(String(v.summary))) {
    return { ok: false, error: "Headline and summary must not contain cure, guarantee or medication-stop claims (editorial safety policy)" };
  }
  return { ok: true, value: v };
}

export async function POST(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: "Invalid or missing x-news-token" }, { status: 401 });
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = validate(json);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const v = parsed.value;
  const slug =
    (typeof v.slug === "string" && v.slug.trim()) ||
    String(v.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 180);
  const status = v.status === "draft" ? "draft" : "published";
  try {
    const payload = {
      title: String(v.title).slice(0, 320),
      summary: String(v.summary),
      category: String(v.category),
      kind: (v.kind as NewsItem["kind"]) || "briefing",
      status,
      author: (v.author as string) || "BHG Newsroom",
      reviewer: (v.reviewer as string) || "Medical review pending — placeholder",
      sourceName: (v.sourceName as string) || "BHG Newsroom",
      sourceUrl: (v.sourceUrl as string) || "https://www.mohfw.gov.in/",
      body: v.body,
      publishedAt: new Date(),
      updatedAt: new Date(),
    };
    const existing = await db.select({ id: newsItems.id }).from(newsItems).where(eq(newsItems.slug, slug)).limit(1);
    if (existing.length) {
      await db.update(newsItems).set(payload).where(eq(newsItems.slug, slug));
      return NextResponse.json({ ok: true, slug, action: "updated" });
    }
    await db.insert(newsItems).values({ slug, ...payload });
    return NextResponse.json({ ok: true, slug, action: "created" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Database write failed", detail: String(error) }, { status: 500 });
  }
}

/** Idempotent daily publisher — safe to call from a scheduler/cron each morning. */
export async function PUT(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: "Invalid or missing x-news-token" }, { status: 401 });
  const briefing = getTodayBriefing();
  const todayKey = istDateKey();
  try {
    const existing = await db.select({ id: newsItems.id }).from(newsItems).where(eq(newsItems.slug, briefing.slug)).limit(1);
    if (existing.length) return NextResponse.json({ ok: true, slug: briefing.slug, action: "already-published", edition: todayKey });
    await db.insert(newsItems).values({
      slug: briefing.slug,
      title: briefing.title,
      summary: briefing.summary,
      category: briefing.category,
      kind: briefing.kind,
      status: "published",
      author: briefing.author,
      reviewer: briefing.reviewer,
      sourceName: briefing.sourceName,
      sourceUrl: briefing.sourceUrl,
      body: briefing.body,
      publishedAt: new Date(briefing.publishedAt),
      updatedAt: new Date(),
    });
    return NextResponse.json({ ok: true, slug: briefing.slug, action: "published", edition: todayKey }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Daily publish failed", detail: String(error) }, { status: 500 });
  }
}
