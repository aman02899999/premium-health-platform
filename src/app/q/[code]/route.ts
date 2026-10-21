import { NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { isBot } from "@/lib/growth/tracking-core";
import { scanQr } from "@/lib/admin/qr";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

// Printed QR codes: /q/<code> counts the scan (people only, not link scanners) and sends the
// person on to its WhatsApp chat, page or review link. Unknown or paused codes go home.
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const home = `${SITE_URL}/`;
  if (!/^[A-Za-z0-9]{6,12}$/.test(code) || !isDbConfigured) return NextResponse.redirect(home, 302);
  const to = await scanQr(code, !isBot(req.headers.get("user-agent"))).catch((err: Error) => (console.error("[q] scan:", err.message), null));
  return NextResponse.redirect(to ?? home, { status: 302, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });
}
