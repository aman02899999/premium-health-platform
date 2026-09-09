import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get("bhg_session")?.value;
    if (!cookie) {
      return NextResponse.json({ user: null, isAuthenticated: false, expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() });
    }
    const user = JSON.parse(decodeURIComponent(cookie));
    return NextResponse.json({ user, isAuthenticated: true, expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() });
  } catch {
    return NextResponse.json({ user: null, isAuthenticated: false });
  }
}
