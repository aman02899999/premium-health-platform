import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// The proxy guards every admin page and API by role. Supabase is faked: a signed-in email and
// that person's admins row (or an error, as before the migration).
let email: string | null = "desk@x.in";
let row: { data: { role: string } | null; error: { message: string } | null } = { data: { role: "agent" }, error: null };

vi.mock("@/lib/supabase/config", () => ({ SUPABASE_URL: "https://x.supabase.co", SUPABASE_KEY: "k", cookieOptions: {}, supabaseConfigured: true }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getClaims: async () => ({ data: email ? { claims: { email } } : null }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => row }) }) }),
  }),
}));

const { proxy } = await import("./proxy");
const go = (path: string, method = "GET") => proxy(new NextRequest(`https://www.royalfitnesclub.in${path}`, { method }));

describe("role gate in the proxy", () => {
  beforeEach(() => {
    email = "desk@x.in";
    row = { data: { role: "agent" }, error: null };
  });

  it("lets an agent into the desk's areas", async () => {
    for (const p of ["/admin", "/admin/chats", "/api/admin/chats", "/admin/contacts", "/admin/growth"]) expect((await go(p)).status).toBe(200);
  });

  it("turns an agent away from other pages (redirect) and APIs (403)", async () => {
    const page = await go("/admin/shop");
    expect(page.status).toBe(307);
    expect(page.headers.get("location")).toBe("https://www.royalfitnesclub.in/admin?denied=1");
    const api = await go("/api/admin/audience", "POST");
    expect(api.status).toBe(403);
    expect(await api.json()).toEqual({ error: "Your role doesn't include this. Ask an owner." });
  });

  it("only owners reach the team page", async () => {
    row = { data: { role: "manager" }, error: null };
    expect((await go("/admin/team")).status).toBe(307);
    expect((await go("/admin/shop")).status).toBe(200);
    row = { data: { role: "owner" }, error: null };
    expect((await go("/admin/team")).status).toBe(200);
  });

  it("leaves non-admins and pre-migration errors to the route's own check", async () => {
    row = { data: null, error: null };
    expect((await go("/admin/shop")).status).toBe(200);
    row = { data: null, error: { message: 'column "role" does not exist' } };
    expect((await go("/admin/shop")).status).toBe(200);
    email = null;
    expect((await go("/admin/shop")).status).toBe(200);
  });

  it("still blocks cross-site writes to admin APIs", async () => {
    const r = await proxy(new NextRequest("https://www.royalfitnesclub.in/api/admin/chats", { method: "POST", headers: { origin: "https://evil.example" } }));
    expect(r.status).toBe(403);
  });
});
