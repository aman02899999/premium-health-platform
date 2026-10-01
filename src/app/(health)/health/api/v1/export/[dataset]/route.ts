import { NextResponse } from "next/server";
import { apiError } from "@/health/lib/saas/auth";
import { intParam, keyedRoute, requireQuery } from "@/health/lib/saas/handler";
import {
  canBulkExport,
  headerSafe,
  collectRows,
  EXPORT_DATASETS,
  exportFilename,
  getExportDataset,
  serializeExport,
  type ExportFormat,
} from "@/health/lib/saas/export";
import { openFoodFactsProvider } from "@/health/services/health/providers/openfoodfacts/provider";
import { europePmcProvider } from "@/health/services/health/providers/europepmc/provider";
import { wgerProvider } from "@/health/services/health/providers/wger/provider";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/export/{dataset}?q=millet&format=csv|jsonl&limit=500
 *
 * Requires an API key on a plan with bulk export (Pro or Enterprise). Pages the
 * upstream until the requested row count is reached, then serialises RFC-4180
 * CSV or JSON Lines as a file download.
 *
 * The response is a file, not the usual JSON envelope — clients asked for data
 * they can load into a spreadsheet or warehouse, so `Content-Disposition` and a
 * real content type matter more here than envelope consistency. Provenance is
 * carried in `X-Export-*` headers instead of being dropped on the floor.
 */
export const GET = keyedRoute(async (_req, { auth, url }, route) => {
  if (!canBulkExport(auth.plan)) {
    return apiError(
      403,
      "plan_upgrade_required",
      `Bulk export is available on the Pro and Enterprise plans. Your key is on the ${auth.plan.name} plan.`
    );
  }

  const { dataset: datasetId } = (await route.params) ?? {};
  const dataset = getExportDataset(datasetId);
  if (!dataset) {
    return apiError(
      404,
      "not_found",
      `Unknown dataset "${datasetId ?? ""}". Available: ${EXPORT_DATASETS.map((d) => d.id).join(", ")}.`
    );
  }

  const format = (url.searchParams.get("format") ?? "csv").toLowerCase();
  if (format !== "csv" && format !== "jsonl") {
    return apiError(400, "invalid_request", 'format must be "csv" or "jsonl".');
  }

  const query = requireQuery(url) ?? "";
  if (dataset.requiresQuery && !query) {
    return apiError(400, "invalid_request", `Provide ?q=<search terms> for the ${dataset.id} dataset.`);
  }

  const limit = intParam(url, "limit", 100, 1, dataset.maxRows);

  const collected = await collectRows(
    async ({ query: q, limit: pageLimit, offset }) => {
      const result =
        dataset.id === "food"
          ? await openFoodFactsProvider.search({ query: q, limit: pageLimit, offset })
          : dataset.id === "literature"
            ? await europePmcProvider.search({ query: q, limit: pageLimit, offset })
            : await wgerProvider.search({ query: q, limit: pageLimit, offset });
      return {
        data: result.data as unknown as Record<string, unknown>[],
        hasMore: result.hasMore,
        live: result.live,
        source: result.source,
      };
    },
    { query, maxRows: limit, pageSize: dataset.pageSize }
  );

  const rows = collected.rows.map((record) => dataset.toRow(record));
  const { body, contentType, extension } = serializeExport(rows, dataset.columns, format as ExportFormat);

  return new NextResponse(body, {
    status: 200,
    headers: {
      ...auth.headers,
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${exportFilename(dataset.id, format as ExportFormat)}"`,
      "Cache-Control": "no-store",
      // Provenance travels with the file: a CSV of someone else's data without
      // source and licence is a licence breach waiting to happen.
      "X-Export-Dataset": headerSafe(dataset.id),
      "X-Export-Rows": String(rows.length),
      "X-Export-Source": headerSafe(dataset.source),
      "X-Export-License": headerSafe(dataset.license),
      "X-Export-Attribution": headerSafe(dataset.attribution),
      "X-Export-Live": collected.live ? "true" : "false",
      "X-Export-Limit": String(limit),
      ...(collected.live
        ? {}
        : { "X-Export-Notice": headerSafe("Upstream unreachable - the file contains no rows, not zeros.") }),
    },
  });
});
