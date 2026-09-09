import { NextResponse } from "next/server";
import { PRODUCTS } from "@/data/editorial";

export async function GET() {
  return NextResponse.json({ count: PRODUCTS.length, data: PRODUCTS });
}
