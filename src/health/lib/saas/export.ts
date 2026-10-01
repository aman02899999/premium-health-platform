/**
 * Bulk dataset export — the capability the Pro and Enterprise plans advertise
 * ("Bulk CSV / JSONL export").
 *
 * Two rules shape this module:
 *  1. Entitlement is checked against the plan's own `bulkExport` flag, so the
 *     pricing page and the API cannot disagree.
 *  2. Nothing is invented. Every export carries the upstream source, licence and
 *     retrieval timestamp, because a CSV of someone else's data without
 *     attribution is a licence violation waiting to happen.
 *
 * Serialisation is deliberately dependency-free: RFC-4180 CSV and JSON Lines.
 */

import type { ApiPlan } from "./plans";

/**
 * Makes a string safe to use as an HTTP header value.
 *
 * Header values must be ByteStrings — every character code ≤ 0xFF — but upstream
 * licence and attribution text is full of em dashes and © symbols. Setting one
 * directly throws "Cannot convert argument to a ByteString", which turned a
 * working export into a 500 (caught by the end-to-end smoke test, now covered
 * by a unit test): ownership labels are prettier than HTTP allows.
 */
export function headerSafe(value: string): string {
  return String(value)
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u2018\u2019\u201B]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u00a9/g, "(c)")
    .replace(/\u00ae/g, "(R)")
    .replace(/\u2122/g, "(TM)")
    // Anything still outside printable ASCII is dropped rather than transliterated:
    // a wrong character in a provenance header is worse than a missing one.
    .replace(/[^\x20-\x7E]/g, "");
}

export type ExportFormat = "csv" | "jsonl";

export type ExportRow = Record<string, unknown>;

export type ExportDataset = {
  id: string;
  label: string;
  /** Upstream provider name, for the provenance header. */
  source: string;
  license: string;
  attribution: string;
  /** Column order for CSV output. JSONL keeps the same keys. */
  columns: string[];
  /** Whether the caller must supply ?q= (some upstreams cannot list everything). */
  requiresQuery: boolean;
  /** Hard cap per request — protects upstreams and this API alike. */
  maxRows: number;
  /** Page size used while paging upstream (most providers cap at 25). */
  pageSize: number;
  /** Maps a provider record onto a flat export row. */
  toRow: (record: Record<string, unknown>) => ExportRow;
};

const asText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.filter(Boolean).join("; ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export const EXPORT_DATASETS: readonly ExportDataset[] = [
  {
    id: "food",
    label: "Packaged foods",
    source: "Open Food Facts",
    license: "ODbL (database), DBCL (contents)",
    attribution: "Open Food Facts — https://world.openfoodfacts.org",
    columns: [
      "id", "name", "brand", "barcode", "category",
      "calories", "protein", "carbohydrates", "fat", "fiber", "sugar", "sodium",
      "nutriscore", "novaGroup",
    ],
    requiresQuery: true,
    maxRows: 500,
    pageSize: 25,
    toRow: (record) => {
      const nutrients = (record.nutrients ?? {}) as Record<string, unknown>;
      return {
        id: asText(record.id),
        name: asText(record.name),
        brand: asText(record.brand),
        barcode: asText(record.barcode),
        category: asText(record.category),
        calories: asText(nutrients.calories),
        protein: asText(nutrients.protein),
        carbohydrates: asText(nutrients.carbohydrates),
        fat: asText(nutrients.fat),
        fiber: asText(nutrients.fiber),
        sugar: asText(nutrients.sugar),
        sodium: asText(nutrients.sodium),
        nutriscore: asText(record.nutriscore),
        novaGroup: asText(record.novaGroup),
      };
    },
  },
  {
    id: "literature",
    label: "Medical literature",
    source: "Europe PMC",
    license: "Europe PMC open access subsets; abstracts remain © their publishers",
    attribution: "Europe PMC — https://europepmc.org",
    columns: [
      "id", "title", "authors", "journal", "pubDate", "doi", "citedByCount", "openAccess", "type", "url",
    ],
    requiresQuery: true,
    maxRows: 500,
    pageSize: 25,
    toRow: (record) => ({
      id: asText(record.id),
      title: asText(record.title),
      authors: asText(record.authors),
      journal: asText(record.journal),
      pubDate: asText(record.pubDate),
      doi: asText(record.doi),
      citedByCount: asText(record.citedByCount),
      openAccess: asText(record.openAccess),
      type: asText(record.type),
      url: asText(record.url),
    }),
  },
  {
    id: "exercises",
    label: "Exercise library",
    source: "wger",
    license: "CC BY-SA 4.0",
    attribution: "wger — https://wger.de",
    columns: ["id", "name", "category", "muscles", "secondaryMuscles", "equipment", "difficulty", "description"],
    requiresQuery: true,
    maxRows: 500,
    pageSize: 25,
    toRow: (record) => ({
      id: asText(record.id),
      name: asText(record.name),
      category: asText(record.category),
      muscles: asText(record.muscles),
      secondaryMuscles: asText(record.secondaryMuscles),
      equipment: asText(record.equipment),
      difficulty: asText(record.difficulty),
      description: asText(record.description),
    }),
  },
];

export function getExportDataset(id: string | null | undefined): ExportDataset | null {
  if (!id) return null;
  return EXPORT_DATASETS.find((d) => d.id === id.toLowerCase()) ?? null;
}

/** Only plans that advertise bulk export may use it — no special cases. */
export function canBulkExport(plan: Pick<ApiPlan, "bulkExport">): boolean {
  return plan.bulkExport === true;
}

/**
 * RFC-4180 CSV: a field is quoted when it contains a delimiter, a quote or a
 * newline, and embedded quotes are doubled. Rows are written with LF endings.
 */
export function toCsv(rows: ExportRow[], columns: string[]): string {
  const escape = (value: unknown): string => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const lines = [columns.map(escape).join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => escape(row[column])).join(","));
  }
  // Trailing newline so `cat file.csv | wc -l` counts data rows correctly.
  return `${lines.join("\n")}\n`;
}

/** JSON Lines: one JSON object per line, no trailing blank line. */
export function toJsonl(rows: ExportRow[]): string {
  return rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : "");
}

export function serializeExport(
  rows: ExportRow[],
  columns: string[],
  format: ExportFormat
): { body: string; contentType: string; extension: string } {
  return format === "jsonl"
    ? { body: toJsonl(rows), contentType: "application/x-ndjson; charset=utf-8", extension: "jsonl" }
    : { body: toCsv(rows, columns), contentType: "text/csv; charset=utf-8", extension: "csv" };
}

export type PageFetcher<T> = (params: { query: string; limit: number; offset: number }) => Promise<{
  data: T[];
  hasMore: boolean;
  live: boolean;
  source: string;
}>;

/**
 * Pages an upstream until `maxRows` is reached, the source runs out, or the
 * source stops claiming more data. Providers here cap a page at 25 records, so
 * a "bulk" export has to walk pages rather than raise `limit`.
 *
 * A non-live page ends the walk: continuing would append empty pages on top of
 * whatever was already collected.
 */
export async function collectRows<T>(
  fetcher: PageFetcher<T>,
  options: { query: string; maxRows: number; pageSize: number }
): Promise<{ rows: T[]; live: boolean; source: string; truncated: boolean }> {
  const rows: T[] = [];
  let offset = 0;
  let live = false;
  let source = "";

  while (rows.length < options.maxRows) {
    const page = await fetcher({
      query: options.query,
      limit: Math.min(options.pageSize, options.maxRows - rows.length),
      offset,
    });
    source = page.source || source;
    if (!page.live) break;
    live = true;
    rows.push(...page.data);
    offset += page.data.length;
    if (!page.hasMore || page.data.length === 0) break;
  }

  return {
    rows: rows.slice(0, options.maxRows),
    live,
    source,
    truncated: rows.length > options.maxRows,
  };
}

/** Filename for the Content-Disposition header: dataset + date, no user input. */
export function exportFilename(datasetId: string, format: ExportFormat, now = new Date()): string {
  const safeId = datasetId.replace(/[^a-z0-9-]/gi, "").slice(0, 32) || "export";
  return `bhg-${safeId}-${now.toISOString().slice(0, 10)}.${format}`;
}
