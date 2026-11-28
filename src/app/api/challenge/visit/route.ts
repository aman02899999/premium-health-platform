import { NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { isSameOrigin } from "@/lib/same-origin";
import { recordShareVisit } from "@/lib/challenge/store";

// Counts one person opening a watch-and-share link. The page calls this only after it has been
// visible for a few seconds, so link previews (WhatsApp, Facebook) and crawlers don't count.
export const dynamic = "force-dynamic";
const BOT = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|curl|wget|python|headless/i;

export async function POST(req: Request) {
  if (!isSameOrigin(req) || !req.headers.get("origin")) return NextResponse.json({ ok: false }, { status: 403 });
  if (!isDbConfigured || BOT.test(req.headers.get("user-agent") ?? "")) return NextResponse.json({ ok: true });
  const b = (await req.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof b?.code === "string" ? b.code : "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!ip) return NextResponse.json({ ok: true });
  await recordShareVisit(code, ip).catch((e: Error) => console.error("[challenge] visit:", e.message));
  return NextResponse.json({ ok: true });
}
