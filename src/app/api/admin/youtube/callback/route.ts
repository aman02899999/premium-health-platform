import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminRole } from "@/lib/auth";
import { SITE_URL } from "@/lib/site";
import { exchangeCode } from "@/lib/youtube/client";
import { saveYoutubeConnection } from "@/lib/youtube/automation";

export const dynamic = "force-dynamic";
const STATE_COOKIE = "yt_oauth_state";

const back = (result: string) => NextResponse.redirect(`${SITE_URL}/admin/growth?tab=social&youtube=${encodeURIComponent(result)}`);

// Google sends the owner back here after the consent screen. The state must match the cookie set
// by /connect (so nobody can link their own channel by sending the owner a link).
export async function GET(req: Request) {
  if ((await adminRole()) !== "owner") return NextResponse.json({ error: "Only the owner can connect YouTube" }, { status: 403 });
  const url = new URL(req.url);
  const state = url.searchParams.get("state") ?? "";
  const expected = (await cookies()).get(STATE_COOKIE)?.value ?? "";
  if (!expected || state.length !== expected.length || !timingSafeEqual(Buffer.from(state), Buffer.from(expected))) return back("state-mismatch");
  if (url.searchParams.get("error")) return back("cancelled");
  const code = url.searchParams.get("code");
  if (!code) return back("no-code");
  const tokens = await exchangeCode(code, SITE_URL);
  if (!tokens.ok) {
    console.error("[youtube] connect failed:", tokens.error);
    return back("failed");
  }
  await saveYoutubeConnection(tokens.refresh, tokens.access);
  const res = back("connected");
  res.cookies.delete({ name: STATE_COOKIE, path: "/api/admin/youtube" });
  return res;
}
