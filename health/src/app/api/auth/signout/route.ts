import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST only: a GET sign-out could be triggered by any <img> on another site.
export async function POST() {
  if (supabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  const res = NextResponse.json({ success: true });
  res.cookies.set("bhg_session", "", { path: "/", maxAge: 0, sameSite: "lax" }); // legacy demo cookie
  return res;
}
