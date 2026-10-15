import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isFirstSignIn, welcome } from "@/lib/growth/welcome";

export const dynamic = "force-dynamic";

// Sign-in with the 6-digit email code happens in the browser and never reaches /auth/callback,
// so the page calls this right after. The user comes from the session cookie, never the body.
export async function POST() {
  if (!supabaseConfigured) return new NextResponse(null, { status: 204 });
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const user = data.user;
  if (isFirstSignIn(user)) after(() => welcome(user));
  return new NextResponse(null, { status: 204 });
}
