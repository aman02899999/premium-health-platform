import { NextResponse } from "next/server";
import { adminIdentity, isAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { todayIST } from "@/lib/growth/dates";
import { LINKS, isSegment, metaAudienceCsv, toContacts } from "@/lib/growth/audience";
import { createCampaign, importContacts, importedCount, listCampaigns, recipients, segmentCounts, sendBatch, stopRepeating } from "@/lib/growth/campaigns";
import { SheetError, readSheet } from "@/lib/growth/sheet";
import { toCandidates } from "@/lib/growth/member-import";
import { importMembers } from "@/lib/growth/members";
import { addDays } from "@/lib/growth/dates";

// Admin audience and campaigns.
// GET                      segments with counts, imported lists, campaigns with progress
// GET ?export=<segment>    customer-list CSV for Meta Ads (Custom audience)
// POST multipart file      contacts import (commit=0 preview, commit=1 apply)
// POST { action: "campaign" | "send" | "stop" }
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 3 * 1024 * 1024;

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const today = todayIST();
  const exp = new URL(req.url).searchParams.get("export");
  try {
    if (exp) {
      if (!isSegment(exp)) return NextResponse.json({ error: "Unknown segment" }, { status: 400 });
      return new Response(metaAudienceCsv(await recipients(exp, today)), {
        headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="royal-fitness-${exp}-${today}.csv"`, "cache-control": "no-store" },
      });
    }
    const [segments, campaigns, imported] = await Promise.all([segmentCounts(today), listCampaigns(), importedCount()]);
    return NextResponse.json({ segments, campaigns, imported, links: Object.entries(LINKS).map(([id, l]) => ({ id, label: l.label, whatsapp: l.whatsapp })) });
  } catch (err) {
    console.error("[audience]", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load the audience. Is the latest database migration applied?" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const form = await req.formData().catch(() => null);
      const file = form?.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "Choose a CSV or Excel file." }, { status: 400 });
      if (file.size > MAX_BYTES) return NextResponse.json({ error: "The file is over 3 MB." }, { status: 413 });
      const status = form?.get("status");
      const rows = readSheet(new Uint8Array(await file.arrayBuffer()), file.name);
      const commit = form?.get("commit") === "1";
      const today = todayIST();
      // A sheet with an End/Expiry date (or Start + Duration) is a member list: those rows go on the
      // member list, so active members get renewal reminders and lapsed ones land in the
      // "left 3 months ago / earlier" segments. Rows without dates stay plain contacts.
      const dated = toCandidates(rows, today);
      const candidates = typeof dated === "string" ? [] : dated.candidates;
      const datedPhones = new Set(candidates.map((c) => c.phone));
      const parsed = toContacts(rows);
      if (typeof parsed === "string" && !candidates.length) return NextResponse.json({ error: parsed }, { status: 422 });
      const members = candidates.length ? await importMembers(candidates, today, commit) : null;
      const contacts = typeof parsed === "string" ? [] : parsed.contacts.filter((c) => !(c.phone && datedPhones.has(c.phone)));
      const plan = await importContacts(contacts, { tag: String(form?.get("tag") ?? "").trim(), status: status === "current" || status === "other" ? status : "past" }, commit);
      const soon = addDays(today, 30);
      const ninety = addDays(today, -90);
      const byStatus = {
        active: candidates.filter((c) => c.expiresOn >= today).length,
        expiring: candidates.filter((c) => c.expiresOn >= today && c.expiresOn <= soon).length,
        lapsedRecent: candidates.filter((c) => c.expiresOn < today && c.expiresOn >= ninety).length,
        lapsedOld: candidates.filter((c) => c.expiresOn < ninety).length,
      };
      const contactRows = new Set(contacts.map((c) => c.row));
      // "End date is missing" is expected for rows that are imported as plain contacts.
      const memberErrors = typeof dated === "string" ? [] : dated.errors.filter((e) => !contactRows.has(e.row));
      const errors = [...memberErrors, ...(typeof parsed === "string" ? [] : parsed.errors)];
      const columns = { ...(typeof parsed === "string" ? {} : parsed.columns), ...(typeof dated === "string" ? {} : Object.fromEntries(Object.entries(dated.mapping).map(([k, v]) => [k, v!.header]))) };
      return NextResponse.json({
        committed: commit,
        columns,
        plan,
        members: members && { add: members.add.length, update: members.update.length, unchanged: members.unchanged.length, remindSoon: members.remindSoon, ...byStatus },
        errors: errors.slice(0, 50),
        errorCount: errors.length,
      });
    }
    const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (b?.action === "campaign") {
      const res = await createCampaign(
        { name: String(b.name ?? ""), segment: String(b.segment ?? ""), channel: String(b.channel ?? ""), offer: String(b.offer ?? ""), link: String(b.link ?? ""), subject: String(b.subject ?? ""), repeat: String(b.repeat ?? "none") },
        (await adminIdentity()) || "admin",
        todayIST(),
      );
      return res.ok ? NextResponse.json(res) : NextResponse.json({ error: res.error }, { status: 400 });
    }
    if (b?.action === "stop" && typeof b.id === "string" && /^[0-9a-f-]{36}$/i.test(b.id)) {
      await stopRepeating(b.id);
      return NextResponse.json({ ok: true });
    }
    if (b?.action === "send") return NextResponse.json(await sendBatch(Number(b.max) || 50));
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    if (err instanceof SheetError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("[audience] action:", (err as Error).message);
    return NextResponse.json({ error: "Something went wrong and nothing was sent. Try again." }, { status: 500 });
  }
}
