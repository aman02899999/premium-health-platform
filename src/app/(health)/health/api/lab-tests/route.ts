import { NextResponse } from "next/server";
import { LAB_TESTS } from "@/health/data/clinical";

export async function GET() {
  return NextResponse.json({ count: LAB_TESTS.length, data: LAB_TESTS.map((l) => ({ slug: l.slug, name: l.name, short: l.short })) });
}
