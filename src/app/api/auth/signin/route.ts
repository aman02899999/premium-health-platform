import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, provider } = body;
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    const user = {
      id: `${provider || "email"}_${Date.now()}`,
      email,
      name: name || email.split("@")[0],
      role: "user",
      provider: provider || "email",
      createdAt: new Date().toISOString(),
    };

    const res = NextResponse.json({ user, isAuthenticated: true });
    res.cookies.set("bhg_session", encodeURIComponent(JSON.stringify(user)), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "signin failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST { email, name?, provider? } to signin — SSO optimized" });
}
