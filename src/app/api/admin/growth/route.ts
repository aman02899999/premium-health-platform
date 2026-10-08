import { NextResponse } from "next/server";
import { adminIdentity, isAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { runDaily } from "@/lib/growth/daily";
import { listDietOrders, setDietStage } from "@/lib/growth/diet-orders";
import { LEAD_STATUSES, listPipeline, updateLead, type LeadStatus } from "@/lib/growth/leads";
import { applyPaidOrder, deleteMember, listMembers, listRewards, parseDeskInput, saveDeskMember, unappliedPaidOrders } from "@/lib/growth/members";
import { listOutbox, markOutbox } from "@/lib/growth/outbox";
import { emailConfigured, whatsappConfigured } from "@/lib/growth/providers";
import { todayIST } from "@/lib/growth/dates";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const OFFLINE = () => NextResponse.json({ error: "The database connection isn't configured, so growth tools are offline." }, { status: 503 });
const isUuid = (s: unknown): s is string => typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/** Everything the Growth dashboard shows, in one round trip. */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return OFFLINE();
  try {
    const [members, leads, outbox, dietOrders, rewards, unapplied] = await Promise.all([listMembers(), listPipeline(), listOutbox("all", 400), listDietOrders(), listRewards(), unappliedPaidOrders()]);
    return NextResponse.json({
      today: todayIST(),
      siteUrl: SITE_URL,
      channels: { whatsappApi: whatsappConfigured(), email: emailConfigured(), cronSecret: Boolean(process.env.CRON_SECRET) },
      members,
      leads,
      outbox,
      dietOrders,
      rewards,
      unapplied,
    });
  } catch (err) {
    console.error("[growth] load failed:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load the growth data. Check that the latest database migration is applied." }, { status: 500 });
  }
}

/** Admin actions: { action, ...fields }. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return OFFLINE();
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b || typeof b.action !== "string") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const by = await adminIdentity();
  try {
    switch (b.action) {
      case "save-member": {
        const input = parseDeskInput(b);
        if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });
        const member = await saveDeskMember(input, isUuid(b.id) ? b.id : undefined);
        return NextResponse.json({ ok: true, member });
      }
      case "delete-member":
        if (!isUuid(b.id)) break;
        await deleteMember(b.id);
        return NextResponse.json({ ok: true });
      case "lead":
        if (!isUuid(b.id)) break;
        if (b.status !== undefined && !LEAD_STATUSES.includes(b.status as LeadStatus)) break;
        await updateLead(b.id, {
          status: b.status as LeadStatus | undefined,
          notes: typeof b.notes === "string" ? b.notes : undefined,
          followUps: typeof b.followUps === "boolean" ? b.followUps : undefined,
        });
        return NextResponse.json({ ok: true });
      case "message":
        if (!isUuid(b.id) || !["sent", "cancelled", "pending"].includes(b.status as string)) break;
        await markOutbox(b.id, b.status as "sent" | "cancelled" | "pending", by);
        return NextResponse.json({ ok: true });
      case "diet-stage":
        if (!isUuid(b.id) || !["new", "in_progress", "sent", "refunded"].includes(b.stage as string)) break;
        await setDietStage(b.id, b.stage as "new" | "in_progress" | "sent" | "refunded");
        return NextResponse.json({ ok: true });
      case "apply-order": {
        if (typeof b.razorpayOrderId !== "string") break;
        const applied = await applyPaidOrder(b.razorpayOrderId);
        return NextResponse.json({ ok: true, applied: Boolean(applied) });
      }
      case "run-daily":
        return NextResponse.json({ ok: true, result: await runDaily() });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (err) {
    const e = err as { code?: string; message: string };
    if (e.code === "23505") return NextResponse.json({ error: "A member with this mobile number already exists." }, { status: 409 });
    console.error("[growth] action failed:", e.message);
    return NextResponse.json({ error: e.message.includes("can't be read") ? e.message : "That didn't work. Please try again." }, { status: 500 });
  }
}
