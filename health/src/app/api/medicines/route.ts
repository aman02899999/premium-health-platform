import { NextResponse } from "next/server";
import { MEDICINES } from "@/data/medicines";

export async function GET() {
  return NextResponse.json({ count: MEDICINES.length, data: MEDICINES.map((m) => ({ slug: m.slug, genericName: m.genericName, drugClass: m.drugClass, short: m.short })) });
}
