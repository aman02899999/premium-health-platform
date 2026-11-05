import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { adminRole } from "@/lib/auth";
import { SITE_URL } from "@/lib/site";
import { authUrl, youtubeConfigured } from "@/lib/youtube/client";

export const dynamic = "force-dynamic";
const STATE_COOKIE = "yt_oauth_state";

// Admin → "Connect YouTube": sends the owner to Google's consent screen for the gym's channel.
// Owner only, because it decides which channel the site uploads to.
export async function GET() {
  if ((await adminRole()) !== "owner") return NextResponse.json({ error: "Only the owner can connect YouTube" }, { status: 403 });
  if (!youtubeConfigured()) return NextResponse.json({ error: "Add YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in Vercel first" }, { status: 503 });
  const state = randomBytes(24).toString("base64url");
  const res = NextResponse.redirect(authUrl(SITE_URL, state));
  res.cookies.set(STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/admin/youtube", maxAge: 600 });
  return res;
}
