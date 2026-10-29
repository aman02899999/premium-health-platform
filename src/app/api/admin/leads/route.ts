import { NextResponse } from "next/server";
import { adminIdentity, isAdmin } from "@/lib/auth";
import { archiveLead } from "@/lib/admin/archive";
import { deleteLocalLead, listLeads } from "@/lib/content/store";
import { supabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ leads: await listLeads() });
}

/** Archives the enquiry (kept with its chat links, can be put back); never erases it. */
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!supabaseConfigured) {
    await deleteLocalLead(id);
    return NextResponse.json({ ok: true });
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await archiveLead(id, await adminIdentity());
  return NextResponse.json({ ok: true });
}
