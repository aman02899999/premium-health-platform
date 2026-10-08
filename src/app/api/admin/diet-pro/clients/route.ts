import { NextResponse } from "next/server";
import { adminIdentity, isAdmin } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/config";
import { deleteClient, isUuid, listClients, saveClient } from "@/lib/diet-pro/store";

export const dynamic = "force-dynamic";

const OFFLINE = () => NextResponse.json({ error: "Cloud storage needs Supabase; clients stay in this browser." }, { status: 503 });

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseConfigured) return OFFLINE();
  try {
    return NextResponse.json({ clients: await listClients() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseConfigured) return OFFLINE();
  const raw = await req.text();
  if (raw.length > 300_000) return NextResponse.json({ error: "Record too large" }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const consentAt = typeof body.consentAt === "string" && !Number.isNaN(Date.parse(body.consentAt)) ? body.consentAt : null;
  if (!name) return NextResponse.json({ error: "Client name is required" }, { status: 400 });
  if (!consentAt) return NextResponse.json({ error: "Record the client's consent before saving their health data." }, { status: 400 });
  if (!body.profile || typeof body.profile !== "object") return NextResponse.json({ error: "Missing profile" }, { status: 400 });
  try {
    const by = await adminIdentity();
    const saved = await saveClient(
      {
        id: isUuid(body.id) ? body.id : undefined,
        name,
        profile: body.profile,
        swaps: (body.swaps as Record<string, number>) ?? {},
        extras: (body.extras as Record<string, { id: string; grams: number }[]>) ?? {},
        note: typeof body.note === "string" ? body.note : "",
        log: Array.isArray(body.log) ? (body.log as never[]) : [],
        consentAt,
        consentBy: typeof body.consentBy === "string" && body.consentBy ? body.consentBy : by,
      },
      by,
    );
    return NextResponse.json({ client: saved });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseConfigured) return OFFLINE();
  const id = new URL(req.url).searchParams.get("id");
  if (!isUuid(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  try {
    await deleteClient(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
