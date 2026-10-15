import { NextResponse, after } from "next/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { claimWelcome, trackSignup } from "@/lib/growth/resend-events";

export const dynamic = "force-dynamic";

// Sign-in with the 6-digit email code happens in the browser, so it never reaches /auth/callback;
// the client calls this straight after. The user comes from the session, and claimWelcome only
// acts on an account confirmed in the last hour that hasn't been welcomed yet.
export async function POST() {
  if (!supabaseConfigured) return new NextResponse(null, { status: 204 });
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const welcome = await claimWelcome(supabase, data.user);
  if (welcome) after(() => trackSignup(welcome.email, welcome.firstName));
  return new NextResponse(null, { status: 204 });
}
