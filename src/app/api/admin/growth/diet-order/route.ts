import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { getDietOrder, setDietStage } from "@/lib/growth/diet-orders";

export const dynamic = "force-dynamic";

/** One paid diet order, for pre-filling the Diet Calculator. Opening it marks it "Preparing". */
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const order = await getDietOrder(new URL(req.url).searchParams.get("id") ?? "");
  if (!order || order.status !== "paid") return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.stage === "new") await setDietStage(order.id, "in_progress");
  return NextResponse.json({ order: { id: order.id, name: order.name, phone: order.phone, intake: order.intake } });
}
