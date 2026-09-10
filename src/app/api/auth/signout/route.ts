import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ success: true, message: "Signed out — SSO session cleared" });
  res.cookies.set("bhg_session", "", { path: "/", maxAge: 0, sameSite: "lax" });
  return res;
}

export async function GET() {
  const res = NextResponse.json({ success: true, message: "Signed out via GET" });
  res.cookies.set("bhg_session", "", { path: "/", maxAge: 0, sameSite: "lax" });
  return res;
}
