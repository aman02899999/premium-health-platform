import { NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { isBot } from "@/lib/growth/tracking-core";
import { recordClick } from "@/lib/growth/tracking";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

// Tracked links in campaign messages: /r/<code> counts the click (people only, not link
// previews or mail scanners) and sends the person on to the page the message pointed to.
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const home = `${SITE_URL}/`;
  if (!/^[A-Za-z0-9]{6,16}$/.test(code) || !isDbConfigured) return NextResponse.redirect(home, 302);
  const to = await recordClick(code, !isBot(req.headers.get("user-agent"))).catch((err: Error) => (console.error("[r] click:", err.message), null));
  // Only ever redirect to this site: a stored link pointing elsewhere is treated as unknown.
  const safe = to && (to === SITE_URL || to.startsWith(`${SITE_URL}/`)) ? to : home;
  return NextResponse.redirect(safe, { status: 302, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });
}
