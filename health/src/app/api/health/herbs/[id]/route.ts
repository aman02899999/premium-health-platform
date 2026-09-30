import { NextResponse } from "next/server";
import { ayurvedaProvider } from "@/services/health/providers/ayurveda/provider";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const data = await ayurvedaProvider.getById(id);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}
