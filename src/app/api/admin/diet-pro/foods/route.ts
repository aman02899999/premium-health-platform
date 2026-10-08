import { NextResponse } from "next/server";
import { adminIdentity, isAdmin } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/config";
import { deleteFood, listFoods, saveFood, validFood } from "@/lib/diet-pro/store";

export const dynamic = "force-dynamic";

const OFFLINE = () => NextResponse.json({ error: "Cloud storage needs Supabase; foods stay in this browser." }, { status: 503 });

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseConfigured) return OFFLINE();
  try {
    return NextResponse.json({ foods: await listFoods() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseConfigured) return OFFLINE();
  const body = await req.json().catch(() => null);
  if (!validFood(body)) return NextResponse.json({ error: "Not a valid USDA food" }, { status: 400 });
  try {
    await saveFood(body, await adminIdentity());
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseConfigured) return OFFLINE();
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^usda-\d{1,10}$/.test(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  try {
    await deleteFood(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
