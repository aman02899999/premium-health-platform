import { NextResponse } from "next/server";
import { adminIdentity, isAdmin, isManager } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { todayIST } from "@/lib/growth/dates";
import { contactsCsv, normAttr, normTag } from "@/lib/admin/contacts-core";
import { addTag, allContacts, contactFacets, getContact, listContacts, removeTag, setAttribute, type ContactFilter } from "@/lib/admin/contacts";

// Admin contacts: everyone the gym knows, one row per person.
// GET ?q=&kind=&tag=&offset=      a page of contacts (+ sidebar totals on the first page)
// GET ?key=<mobile|email>         one person: tags, attributes, recent messages
// GET ?export=1&q=&kind=&tag=     the filtered list as CSV
// POST { action: "tag" | "untag", tag, keys?: string[], all?: filter }   bulk tag
// POST { action: "attr", key, name, value }                              set / clear an attribute
export const dynamic = "force-dynamic";

const filterOf = (p: URLSearchParams | Record<string, unknown>): ContactFilter => {
  const get = (k: string) => (p instanceof URLSearchParams ? p.get(k) : typeof p[k] === "string" ? (p[k] as string) : null) ?? undefined;
  return { q: get("q"), kind: get("kind"), tag: get("tag") };
};

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const p = new URL(req.url).searchParams;
  const today = todayIST();
  try {
    const key = p.get("key");
    if (key) {
      const d = await getContact(key.trim().toLowerCase(), today);
      return d ? NextResponse.json(d) : NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (p.get("export")) {
      // Everyone's mobile and email in one file: owners and managers only.
      if (!(await isManager())) return NextResponse.json({ error: "Your role doesn't include exports. Ask an owner." }, { status: 403 });
      const rows = await allContacts(filterOf(p), 20000, today);
      return new Response(contactsCsv(rows), {
        headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="royal-fitness-contacts-${today}.csv"`, "cache-control": "no-store" },
      });
    }
    const offset = Math.max(0, Number(p.get("offset")) || 0);
    const [page, facets] = await Promise.all([listContacts(filterOf(p), 50, offset, today), offset ? Promise.resolve(null) : contactFacets(today)]);
    return NextResponse.json({ ...page, facets });
  } catch (err) {
    console.error("[contacts]", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load contacts. Is the latest database migration applied?" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  try {
    if (b.action === "tag" || b.action === "untag") {
      const tag = normTag(b.tag);
      if (!tag) return NextResponse.json({ error: "Tags use letters, numbers, spaces, - and _ (up to 30)." }, { status: 400 });
      // Either the ticked rows, or everyone matching the current filter.
      const keys = Array.isArray(b.keys)
        ? b.keys.filter((k): k is string => typeof k === "string").slice(0, 5000)
        : b.all && typeof b.all === "object"
          ? (await allContacts(filterOf(b.all as Record<string, unknown>), 5000)).map((c) => c.key)
          : [];
      if (!keys.length) return NextResponse.json({ error: "Select at least one contact." }, { status: 400 });
      const n = b.action === "tag" ? await addTag(keys, tag, await adminIdentity()) : await removeTag(keys, tag);
      return NextResponse.json({ ok: true, tag, changed: n, selected: keys.length });
    }
    if (b.action === "attr") {
      if (!normAttr(b.name)) return NextResponse.json({ error: "Attribute names use letters, numbers and spaces (up to 30)." }, { status: 400 });
      const ok = await setAttribute(String(b.key ?? ""), String(b.name), String(b.value ?? ""));
      return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Unknown contact" }, { status: 400 });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[contacts] post:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't save. Is the latest database migration applied?" }, { status: 500 });
  }
}
