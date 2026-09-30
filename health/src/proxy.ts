import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL, cookieOptions, supabaseConfigured } from "@/lib/supabase/config";

// Refreshes the Supabase auth cookie before server code reads it. Only runs on
// routes that use the session, so public pages stay fully static/cacheable.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!supabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // Do not put code between client creation and getClaims(): it refreshes the token.
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/profile", "/api/auth/:path*", "/api/premium/:path*", "/api/v1/keys/:path*", "/api/v1/billing/:path*"],
};
