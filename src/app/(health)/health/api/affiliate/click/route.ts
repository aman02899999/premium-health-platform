import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { isAdmin } from "@/health/lib/auth/server";
import { affiliateClickStats, saveAffiliateClick } from "@/health/lib/signups";

export const dynamic = "force-dynamic";

// Counts outbound affiliate clicks (no IP or user agent is stored). Sales and commission
// come from the affiliate networks' own dashboards, not from here.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const productId = typeof body?.productId === "string" ? body.productId.trim() : "";
  if (!productId || productId.length > 100) return NextResponse.json({ ok: false, error: "productId required" }, { status: 400 });
  if (isDbConfigured) {
    try {
      await saveAffiliateClick(productId, body ?? {});
    } catch (err) {
      console.error("[affiliate] click save failed:", (err as Error).message); // never block the visitor's click
    }
  }
  const url = typeof body?.affiliateUrl === "string" && /^https:\/\//.test(body.affiliateUrl) ? body.affiliateUrl : `/health/deals?product=${encodeURIComponent(productId)}`;
  return NextResponse.json({ ok: true, next: url });
}

/** Admin only: clicks per product over the last 30 days. */
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  const productId = new URL(req.url).searchParams.get("productId");
  return NextResponse.json({ ok: true, days: 30, ...(await affiliateClickStats(productId)) });
}
