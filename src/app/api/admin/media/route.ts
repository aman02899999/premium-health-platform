import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { ALLOWED_MEDIA, saveMedia } from "@/lib/content/store";

const MAX_BYTES = 6 * 1024 * 1024;

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (!ALLOWED_MEDIA.includes(file.type)) return NextResponse.json({ error: "Use JPG, PNG, WebP, AVIF or GIF images" }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image must be under 6 MB" }, { status: 413 });
  try {
    const url = await saveMedia(file.type, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[admin] upload failed:", err);
    return NextResponse.json({ error: "Upload failed — on serverless hosting configure DATABASE_URL." }, { status: 500 });
  }
}
