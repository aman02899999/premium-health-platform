import { NextResponse } from "next/server";
import { openFDAProvider } from "@/services/health/providers/openfda/provider";
import { rxNormProvider } from "@/services/health/providers/rxnorm/provider";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider") || "openfda";

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    if (provider === "rxnorm") {
      const data = await rxNormProvider.getById(id);
      if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(data);
    }
    const data = await openFDAProvider.getById(id);
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
