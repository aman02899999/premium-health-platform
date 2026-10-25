import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL, cookieOptions, supabaseConfigured } from "@/lib/supabase/config";
import { roleGate } from "@/lib/admin/team-core";

// The APIs that read the signed-in session (the rest only get the origin check below).
const SESSION_API = /^\/(api\/(admin|account|shop\/order|shop\/my-orders)|health\/api\/(auth|premium|v1\/keys|v1\/billing))(\/|$)/;
// Every API, gym and /health, takes the origin check; webhooks and the scheduler are exempt.
const API = /^\/(health\/)?api\//;
const SERVER_TO_SERVER = /^\/(health\/)?api\/(webhooks|cron)\//;

// Refreshes the Supabase auth cookie before server code reads it. Only runs on
// routes that use the session, so public pages stay fully static/cacheable.
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // Writes only from this site's own pages: admin and account (defence in depth on top of SameSite
  // cookies), and every public form and payment step, so another site can't post into them from a
  // visitor's browser. Webhooks and the scheduler are server-to-server and send no Origin.
  if (request.method !== "GET" && request.method !== "HEAD" && API.test(path) && !SERVER_TO_SERVER.test(path)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }
  // Public APIs don't use the session: nothing more to do here.
  if (API.test(path) && !SESSION_API.test(path)) return NextResponse.next();
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
  const email = typeof data?.claims?.email === "string" ? data.claims.email.toLowerCase() : null;
  if (email && /^\/(admin|api\/admin)(\/|$)/.test(path)) {
    const { data: me, error } = await supabase.from("admins").select("role").eq("email", email).maybeSingle<{ role: string }>();
    // No row: not an admin (the route itself refuses). An error: admin APIs refuse until it's readable.
    const gate = roleGate(path, me ?? null, Boolean(error));
    if (gate === "unavailable") {
      const busy = NextResponse.json({ error: "Couldn't check your access just now. Please try again in a minute." }, { status: 503 });
      response.cookies.getAll().forEach((c) => busy.cookies.set(c));
      return busy;
    }
    if (gate === "deny") {
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
    "/admin/:path*", "/account", "/account/:path*",
    // Every API: the origin check for writes; the session refresh only where it's used (SESSION_API).
    "/api/:path*",
    // Royal Supplements store: customer sign-in for orders and checkout prefill
    "/shop/account", "/shop/checkout",
    // Premium Health Platform (/health)
    "/health/admin/:path*", "/health/profile", "/health/earn",
    // Every /health API: the origin check for writes; the session refresh only for auth, premium,
    // API keys and billing (SESSION_API).
    "/health/api/:path*",
  ],
};
