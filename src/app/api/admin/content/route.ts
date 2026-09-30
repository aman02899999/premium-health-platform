import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { getContent, saveContent } from "@/lib/content/store";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { validateContent } from "@/lib/content/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ content: await getContent(), defaults: DEFAULT_CONTENT });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const result = validateContent(body?.content);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  try {
    await saveContent(result.content);
  } catch (err) {
    console.error("[admin] save failed:", err);
    return NextResponse.json(
      { error: "Could not save. On serverless hosting set DATABASE_URL so content can be stored in PostgreSQL." },
      { status: 500 },
    );
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
