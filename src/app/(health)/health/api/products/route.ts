import { NextResponse } from "next/server";
import { PRODUCTS } from "@/health/data/editorial";

export async function GET() {
  return NextResponse.json({ count: PRODUCTS.length, data: PRODUCTS });
}
