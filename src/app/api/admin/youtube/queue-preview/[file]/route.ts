import { isAdmin } from "@/lib/auth";
import { nurtureBusiness } from "@/lib/growth/daily";
import { pool } from "@/health/db";
import { answerShort, QUEUE_INDEX_BASE, type AnswerDraft } from "@/lib/youtube/queue-core";
import { renderShort } from "@/lib/youtube/shorts";

// Admin preview of a queued Short before approving it: GET /api/admin/youtube/queue-preview/<uuid>.mp4
// Rendering uses CPU, so admins only.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const id = (await params).file.replace(/\.mp4$/i, "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const { rows } = await pool.query<{ id: string; seq: string; draft: AnswerDraft | null }>(`select id, seq, draft from public.youtube_queue where id = $1`, [id]).catch(() => ({ rows: [] }));
  const r = rows[0];
  if (!r?.draft) return new Response("Not found (no draft yet)", { status: 404 });
  try {
    const mp4 = await renderShort(answerShort(r.id, r.draft), QUEUE_INDEX_BASE + Number(r.seq), await nurtureBusiness());
    return new Response(new Uint8Array(mp4), { headers: { "content-type": "video/mp4", "content-length": String(mp4.length), "cache-control": "private, no-store", "content-disposition": `inline; filename="queue-${r.id.slice(0, 8)}.mp4"` } });
  } catch (err) {
    console.error("[youtube-queue] preview failed:", (err as Error).message);
    return new Response("Couldn't render the Short", { status: 500 });
  }
}
