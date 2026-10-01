import { NextResponse } from "next/server";
import { currentUser } from "@/health/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ user: null, isAuthenticated: false }, { status: 401 });
  return NextResponse.json({ user, isAuthenticated: true }, { headers: { "Cache-Control": "private, no-store" } });
}
