import { NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { currentCustomer } from "@/lib/shop/server";
import { clientVersion } from "@/lib/growth/client-plans";
import { getFile } from "@/lib/growth/storage";

export const dynamic = "force-dynamic";

// A plan PDF, only for the signed-in client it belongs to and only once it was sent to them.
// Streamed through the site, so the storage location is never exposed.
export async function GET(req: Request) {
  const customer = await currentCustomer();
  if (!customer) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const id = new URL(req.url).searchParams.get("v") ?? "";
  const v = await clientVersion(customer, id);
  if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const pdf = await getFile(v.planPath);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="royal-fitness-plan-${v.version}.pdf"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[account/plan] file failed:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't open the file" }, { status: 500 });
  }
}
