import { NextResponse } from "next/server";
import { adminIdentity, adminRole } from "@/lib/auth";

// Who is signed in to the admin and what their role allows (for hiding tools they can't open).
export const dynamic = "force-dynamic";

export async function GET() {
  const role = await adminRole();
  if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ email: (await adminIdentity()).toLowerCase(), role });
}
