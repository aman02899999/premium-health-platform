import { isAdmin } from "@/lib/auth";
import { whatsappMedia } from "@/lib/social/meta";

// A photo, voice note or document a customer sent on WhatsApp, streamed for the admin chat only.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const file = await whatsappMedia((await params).id);
  if (!file) return new Response("This file is no longer available from WhatsApp.", { status: 404 });
  return new Response(file.data, { headers: { "content-type": file.type, "cache-control": "private, max-age=3600", "x-content-type-options": "nosniff", "content-security-policy": "sandbox" } });
}
