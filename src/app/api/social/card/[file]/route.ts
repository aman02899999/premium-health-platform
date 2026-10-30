import { getContent } from "@/lib/content/store";
import { nurtureBusiness } from "@/lib/growth/daily";
import { cardPost } from "@/lib/growth/month-plan";
import { isIsoDate } from "@/lib/growth/dates";
import { renderCard } from "@/lib/social/card-image";

// A month-plan cheat-sheet card as a 1080×1350 JPEG. Public on purpose: Instagram and Facebook
// download it from this URL when the cron publishes. 404 outside the plan's dates.
// GET /api/social/card/2026-11-01-am.jpg

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const m = /^(\d{4}-\d{2}-\d{2})-(am|pm)\.jpe?g$/i.exec((await params).file);
  if (!m || !isIsoDate(m[1])) return new Response("Not found", { status: 404 });
  const [biz, content] = await Promise.all([nurtureBusiness(), getContent()]);
  const post = cardPost(m[1], m[2].toLowerCase() as "am" | "pm", biz, content.offers ?? []);
  if (!post) return new Response("Not found", { status: 404 });
  const jpeg = await renderCard(post, biz);
  return new Response(new Uint8Array(jpeg), { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=3600, s-maxage=86400" } });
}
