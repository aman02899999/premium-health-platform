import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { deleteLead, listLeads } from "@/lib/content/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ leads: await listLeads() });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteLead(id);
  return NextResponse.json({ ok: true });
}
