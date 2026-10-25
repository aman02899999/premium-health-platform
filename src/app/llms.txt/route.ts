import { getContent } from "@/lib/content/store";
import { applyOffer } from "@/lib/offers";
import { todayIST } from "@/lib/growth/dates";
import { llmsTxt } from "@/lib/content/ai-facts";
import { SITE_URL } from "@/lib/site";

// A plain-text summary for AI assistants and their crawlers (llmstxt.org). Prices follow the plans.
export const revalidate = 3600;

export async function GET() {
  const c = await getContent();
  return new Response(llmsTxt(c, applyOffer(c.plans, todayIST(), c.offers), SITE_URL), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
