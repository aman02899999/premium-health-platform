import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL, cookieOptions, supabaseConfigured } from "@/lib/supabase/config";
import { allowed, isRole } from "@/lib/admin/team-core";

// Refreshes the Supabase auth cookie before server code reads it. Only runs on
// routes that use the session, so public pages stay fully static/cacheable.
export async function proxy(request: NextRequest) {
  // Admin and account writes only from this site's own pages (defence in depth on top of SameSite cookies).
  if (request.method !== "GET" && request.method !== "HEAD" && /^\/(api\/admin|api\/account)\//.test(request.nextUrl.pathname)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }
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
  const { data } = await supabase.auth.getClaims();

  // Team roles: an agent or manager who opens an area their role doesn't cover is turned away
  // here, for every admin page and API at once. The admin's own row is readable under RLS.
  const path = request.nextUrl.pathname;
  const email = typeof data?.claims?.email === "string" ? data.claims.email.toLowerCase() : null;
  if (email && /^\/(admin|api\/admin)(\/|$)/.test(path)) {
    const { data: me, error } = await supabase.from("admins").select("role").eq("email", email).maybeSingle<{ role: string }>();
    // No row: not an admin (the route itself refuses). An error (e.g. before the migration): let the route decide.
    if (!error && me && isRole(me.role) && !allowed(me.role, path)) {
      const home = request.nextUrl.clone();
      home.pathname = "/admin";
      home.search = "?denied=1";
      const denied = path.startsWith("/api/") ? NextResponse.json({ error: "Your role doesn't include this. Ask an owner." }, { status: 403 }) : NextResponse.redirect(home);
      // Keep any session cookie refreshed above.
      response.cookies.getAll().forEach((c) => denied.cookies.set(c));
      return denied;
    }
  }
  return response;
}

export const config = {
  matcher: [
    // Royal Fitness Club
    "/admin/:path*", "/api/admin/:path*", "/account", "/account/:path*", "/api/account/:path*",
    // Royal Supplements store: customer sign-in for orders and checkout prefill
    "/shop/account", "/shop/checkout", "/api/shop/order", "/api/shop/my-orders",
    // Premium Health Platform (/health)
    "/health/admin/:path*", "/health/profile", "/health/earn",
    "/health/api/auth/:path*", "/health/api/premium/:path*", "/health/api/v1/keys/:path*", "/health/api/v1/billing/:path*",
  ],
};
