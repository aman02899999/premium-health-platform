import { NextResponse } from "next/server";
import { isAdmin, isManager } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { todayIST } from "@/lib/growth/dates";
import { toCandidates } from "@/lib/growth/member-import";
import { importMembers } from "@/lib/growth/members";
import { SheetError, readSheet } from "@/lib/growth/sheet";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 3 * 1024 * 1024;

/**
 * Member list upload (CSV or .xlsx). commit=0 returns a preview and changes nothing;
 * commit=1 with the same file applies it. Stateless, so nothing half-imported is ever stored.
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // A list upload adds people who then get renewal reminders and offers: owners and managers only.
  if (!(await isManager())) return NextResponse.json({ error: "Your role doesn't include uploading lists. Ask an owner." }, { status: 403 });
  if (!isDbConfigured) return NextResponse.json({ error: "The database connection isn't configured." }, { status: 503 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a CSV or Excel file." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "The file is over 3 MB. Keep only the member list in it." }, { status: 413 });
  const commit = form?.get("commit") === "1";
  try {
    const rows = readSheet(new Uint8Array(await file.arrayBuffer()), file.name);
    const today = todayIST();
    const parsed = toCandidates(rows, today);
    if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 422 });
    const plan = await importMembers(parsed.candidates, today, commit);
    const sample = <T,>(a: T[]) => a.slice(0, 15);
    return NextResponse.json({
      committed: commit,
      columns: Object.fromEntries(Object.entries(parsed.mapping).map(([k, v]) => [k, v!.header])),
      counts: { add: plan.add.length, update: plan.update.length, unchanged: plan.unchanged.length, errors: parsed.errors.length, duplicates: plan.duplicates.length, remindSoon: plan.remindSoon },
      add: sample(plan.add),
      update: sample(plan.update),
      errors: [...parsed.errors, ...plan.duplicates].sort((a, b) => a.row - b.row).slice(0, 50),
    });
  } catch (err) {
    if (err instanceof SheetError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("[members] import failed:", (err as Error).message);
    return NextResponse.json({ error: "The import failed and nothing was changed. Try again." }, { status: 500 });
  }
}
