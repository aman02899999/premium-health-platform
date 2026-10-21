import { NextResponse } from "next/server";
import { adminIdentity, isAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { AD_PAGES, PLATFORMS } from "@/lib/admin/ads-core";
import { adsSetup, createAd, listAds, updateAd } from "@/lib/admin/ads";
import { SEGMENTS } from "@/lib/growth/audience";
import { SITE_URL } from "@/lib/site";

// Admin Ads Manager.
// GET                                              campaigns with results, setup, platforms, pages
// POST { action: "create", name, platform, landing, startOn?, spend? }
// POST { action: "update", id, spend?, active?, notes? }
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    return NextResponse.json({ ads: await listAds(), setup: adsSetup(), platforms: PLATFORMS, pages: AD_PAGES, segments: SEGMENTS.map((s) => ({ id: s.id, label: s.label })), siteUrl: SITE_URL });
  } catch (err) {
    console.error("[ads]", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load campaigns. Is the latest database migration applied?" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  try {
    if (b.action === "create") {
      const r = await createAd(b, await adminIdentity());
      return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.error }, { status: 400 });
    }
    if (b.action === "update" && typeof b.id === "string") {
      const err = await updateAd(b.id, { spend: b.spend, active: b.active, notes: b.notes });
      return err ? NextResponse.json({ error: err }, { status: 400 }) : NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[ads] post:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't save. Is the latest database migration applied?" }, { status: 500 });
  }
}
