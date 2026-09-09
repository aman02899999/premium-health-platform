import { NextResponse } from "next/server";
import { HERBS } from "@/data/herbs";

export async function GET() {
  return NextResponse.json({ count: HERBS.length, data: HERBS.map((h) => ({ slug: h.slug, name: h.name, hindiName: h.hindiName, short: h.short, evidenceLevel: h.evidenceLevel })) });
}
