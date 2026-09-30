import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminIdentity, isAdmin } from "@/lib/auth";
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
    await saveContent(result.content, await adminIdentity());
  } catch (err) {
    console.error("[admin] save failed:", err);
    return NextResponse.json(
      { error: `Could not save: ${(err as Error).message}` },
      { status: 500 },
    );
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
