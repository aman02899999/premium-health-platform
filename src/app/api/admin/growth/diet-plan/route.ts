import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { getDietOrder } from "@/lib/growth/diet-orders";
import { PLAN_ERRORS, sendDietPlan, storeCoachPlan } from "@/lib/growth/plan-delivery";
import { getFile } from "@/lib/growth/storage";
import { versionPath } from "@/lib/growth/client-plans";

export const dynamic = "force-dynamic";

const isUuid = (s: unknown): s is string => typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/** The stored plan PDF, for the coach to review before sending. */
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const q = new URL(req.url).searchParams;
  const id = q.get("id");
  const v = q.get("v");
  // ?v=<version id> opens any earlier plan; ?id=<order id> the current one.
  const path = isUuid(v) ? await versionPath(v) : isUuid(id) ? (await getDietOrder(id))?.planPath : null;
  if (!path) return NextResponse.json({ error: "No plan for this order yet" }, { status: 404 });
  try {
    const pdf = await getFile(path);
    return new NextResponse(new Uint8Array(pdf), {
      headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${path.split("/").pop()}"`, "cache-control": "private, no-store" },
    });
  } catch (err) {
    console.error("[diet-plan] read failed:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't read the plan file" }, { status: 500 });
  }
}

/** Upload the plan the coach finished in Diet Pro: { id, pdf (base64), filename, send }. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const b = (await req.json().catch(() => null)) as { id?: unknown; pdf?: unknown; filename?: unknown; send?: unknown } | null;
  if (!b || !isUuid(b.id) || typeof b.pdf !== "string") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const pdf = Buffer.from(b.pdf, "base64");
  if (pdf.length < 1000 || pdf.length > 8 * 1024 * 1024) return NextResponse.json({ error: "The PDF is empty or too large" }, { status: 400 });
  try {
    const path = await storeCoachPlan(b.id, pdf, typeof b.filename === "string" ? b.filename.slice(0, 80) : "plan.pdf");
    const sent = b.send === true ? await sendDietPlan(b.id) : null;
    return NextResponse.json({ ok: true, path, sent: !!sent });
  } catch (err) {
    // Our own checks ("not a PDF", "order not found") are shown as they are; anything else is logged.
    const msg = (err as Error).message;
    if (PLAN_ERRORS.includes(msg)) return NextResponse.json({ error: msg }, { status: 400 });
    console.error("[diet-plan] upload:", msg);
    return NextResponse.json({ error: "Couldn't save the PDF. Try again." }, { status: 502 });
  }
}
