import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { getDietOrder } from "@/lib/growth/diet-orders";
import { sendDietPlan, storeCoachPlan } from "@/lib/growth/plan-delivery";
import { getFile } from "@/lib/growth/storage";

export const dynamic = "force-dynamic";

const isUuid = (s: unknown): s is string => typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/** The stored plan PDF, for the coach to review before sending. */
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const id = new URL(req.url).searchParams.get("id");
  const order = isUuid(id) ? await getDietOrder(id) : null;
  if (!order?.planPath) return NextResponse.json({ error: "No plan for this order yet" }, { status: 404 });
  try {
    const pdf = await getFile(order.planPath);
    return new NextResponse(new Uint8Array(pdf), {
      headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${order.planPath.split("/").pop()}"`, "cache-control": "private, no-store" },
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
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
