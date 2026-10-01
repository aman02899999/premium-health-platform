import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (supabaseConfigured) await (await createClient()).auth.signOut();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
