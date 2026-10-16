import { isAdmin } from "@/lib/auth";
import { isIsoDate } from "@/lib/growth/dates";
import { nurtureBusiness } from "@/lib/growth/daily";
import { renderReel } from "@/lib/social/reel";

// Admin preview of a day's Reel: GET /api/admin/social/reel/2026-10-16.mp4
// Rendering takes CPU time, so it is for the admin only; the cron uploads its own copy.

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const date = (await params).file.replace(/\.mp4$/i, "");
  if (!isIsoDate(date)) return new Response("Not found", { status: 404 });
  try {
    const mp4 = await renderReel(date, await nurtureBusiness());
    return new Response(new Uint8Array(mp4), {
      headers: { "content-type": "video/mp4", "content-length": String(mp4.length), "cache-control": "private, max-age=600", "content-disposition": `inline; filename="reel-${date}.mp4"` },
    });
  } catch (err) {
    console.error("[reel] preview failed:", (err as Error).message);
    return new Response("Couldn't render the Reel", { status: 500 });
  }
}
