import { apiSuccess } from "@/health/lib/saas/auth";
import { keyedRoute } from "@/health/lib/saas/handler";
import { fetchWho } from "@/health/lib/live-sources";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/outbreaks?country=congo
 * Requires an API key. Latest WHO Disease Outbreak News reports, newest first,
 * optionally filtered by a country or disease word in the title.
 *
 * Previously this served disease.sh COVID totals, whose upstream (JHU CSSE) stopped
 * in March 2023 and whose "updated" stamp is the aggregator's fetch time — so the
 * numbers looked current but weren't. WHO reports carry their real publication date.
 */
export const GET = keyedRoute(async (_req, { auth, url }) => {
  const q = (url.searchParams.get("country") ?? url.searchParams.get("q") ?? "").trim().toLowerCase();
  let reports: Awaited<ReturnType<typeof fetchWho>> = [];
  let live = true;
  try {
    reports = await fetchWho(30);
  } catch {
    live = false;
  }
  const matches = (q ? reports.filter((r) => r.title.toLowerCase().includes(q)) : reports).slice(0, 10);

  return apiSuccess(
    {
      results: matches.map((r) => ({
        id: r.slug,
        title: r.title.replace(/^WHO outbreak report: /, ""),
        summary: r.summary,
        publishedAt: r.publishedAt,
        updatedAt: r.updatedAt,
        url: r.sourceUrl,
      })),
      total: matches.length,
      provider: "World Health Organization — Disease Outbreak News",
      live,
      scope: q || "Worldwide",
      attribution: "World Health Organization (who.int)",
      notice: "Each report keeps WHO's own publication date. Read the linked report for case counts and advice.",
    },
    auth,
    {},
    900
  );
});
