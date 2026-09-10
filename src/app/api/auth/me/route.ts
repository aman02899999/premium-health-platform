import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("bhg_session")?.value;
  if (!cookie) return NextResponse.json({ user: null, isAuthenticated: false }, { status: 401 });
  try {
    const user = JSON.parse(decodeURIComponent(cookie));
    return NextResponse.json({ user, isAuthenticated: true });
  } catch {
    return NextResponse.json({ user: null, isAuthenticated: false }, { status: 401 });
  }
}
