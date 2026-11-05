import { isAdmin } from "@/lib/auth";
import { nurtureBusiness } from "@/lib/growth/daily";
import { SHORTS } from "@/lib/youtube/shorts-bank";
import { renderShort } from "@/lib/youtube/shorts";

// Admin preview of any Short in the bank: GET /api/admin/youtube/short/12.mp4 (its place, from 0)
// or /api/admin/youtube/short/myth-crunches-belly.mp4. Rendering uses CPU, so admins only.

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const key = (await params).file.replace(/\.mp4$/i, "");
  const index = /^\d+$/.test(key) ? Number(key) : SHORTS.findIndex((s) => s.id === key);
  const short = SHORTS[index];
  if (!short) return new Response("Not found", { status: 404 });
  try {
    const mp4 = await renderShort(short, index, await nurtureBusiness());
    return new Response(new Uint8Array(mp4), {
      headers: { "content-type": "video/mp4", "content-length": String(mp4.length), "cache-control": "private, max-age=600", "content-disposition": `inline; filename="short-${short.id}.mp4"` },
    });
  } catch (err) {
    console.error("[youtube] preview failed:", (err as Error).message);
    return new Response("Couldn't render the Short", { status: 500 });
  }
}
