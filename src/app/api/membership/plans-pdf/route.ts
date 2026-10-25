import { getContent } from "@/lib/content/store";
import { plansPdf } from "@/lib/content/docs-pdf";
import { applyOffer } from "@/lib/offers";
import { todayIST } from "@/lib/growth/dates";

export const revalidate = 300;

export async function GET() {
  const c = await getContent();
  const today = todayIST();
  const pdf = await plansPdf(c, applyOffer(c.plans, today, c.offers), today);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": 'attachment; filename="royal-fitness-club-plans-and-terms.pdf"',
      "cache-control": "public, max-age=300",
    },
  });
}
