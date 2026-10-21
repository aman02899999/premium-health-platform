import { NextResponse } from "next/server";
import { adminIdentity, isAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { QR_KINDS, QR_PAGES } from "@/lib/admin/qr-core";
import { createQr, listQr, optinStats, qrBiz, setQrActive } from "@/lib/admin/qr";

// Admin QR codes and opt-ins.
// GET                                   QR codes with scans and leads, opt-in totals and recent changes
// POST { action: "create", kind, label, page?, text? }
// POST { action: "pause" | "resume", code }
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const [codes, optins, biz] = await Promise.all([listQr(), optinStats(), qrBiz()]);
    return NextResponse.json({ codes, optins, kinds: QR_KINDS, pages: QR_PAGES, siteUrl: biz.siteUrl, hasReview: !!biz.reviewUrl });
  } catch (err) {
    console.error("[qr]", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load QR codes. Is the latest database migration applied?" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  try {
    if (b.action === "create") {
      const r = await createQr({ kind: b.kind, label: b.label, page: b.page, text: b.text }, await adminIdentity());
      return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.error }, { status: 400 });
    }
    if ((b.action === "pause" || b.action === "resume") && typeof b.code === "string") {
      await setQrActive(b.code, b.action === "resume");
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[qr] post:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't save. Is the latest database migration applied?" }, { status: 500 });
  }
}
