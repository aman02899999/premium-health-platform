import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminPassword, allowLoginAttempt, checkPassword, createSessionToken, sessionCookieOptions } from "@/lib/auth";

export async function POST(req: Request) {
  if (!adminPassword()) {
    return NextResponse.json({ error: "Admin is disabled: set the ADMIN_PASSWORD environment variable." }, { status: 503 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowLoginAttempt(ip)) return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  if (typeof body.password !== "string" || !checkPassword(body.password)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createSessionToken(), sessionCookieOptions);
  return res;
}
