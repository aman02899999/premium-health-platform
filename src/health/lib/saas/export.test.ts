import { describe, it, expect } from "vitest";
import {
  canBulkExport,
  headerSafe,
  collectRows,
  EXPORT_DATASETS,
  exportFilename,
  getExportDataset,
  serializeExport,
  toCsv,
  toJsonl,
} from "./export";
import { getPlan } from "./plans";

describe("dataset catalogue", () => {
  it("exposes the three advertised datasets with provenance", () => {
    expect(EXPORT_DATASETS.map((d) => d.id)).toEqual(["food", "literature", "exercises"]);
    for (const dataset of EXPORT_DATASETS) {
      expect(dataset.source.length).toBeGreaterThan(0);
      expect(dataset.license.length).toBeGreaterThan(0);
      expect(dataset.attribution).toContain("http");
      expect(dataset.columns.length).toBeGreaterThan(3);
    }
  });

  it("resolves ids case-insensitively and rejects unknown ones", () => {
    expect(getExportDataset("FOOD")?.id).toBe("food");
    expect(getExportDataset("nope")).toBeNull();
    expect(getExportDataset(null)).toBeNull();
  });

  it("flattens nested nutrients and joins arrays for CSV", () => {
    const food = getExportDataset("food")!;
    const row = food.toRow({
      id: "8901030875020",
      name: "Millet Mix",
      brand: "Org",
      barcode: "8901030875020",
      nutrients: { calories: 372, protein: 12.5, fiber: 8 },
    });
    // Every field is a string: CSV has one type, and JSONL should match it.
    expect(row.calories).toBe("372");
    expect(row.protein).toBe("12.5");
    // Missing values become empty strings, never "undefined".
    expect(row.sugar).toBe("");
    expect(row.nutriscore).toBe("");

    const exercise = getExportDataset("exercises")!;
    const ex = exercise.toRow({ id: "1", name: "Pushup", muscles: ["Chest", "Triceps"], equipment: [] });
    expect(ex.muscles).toBe("Chest; Triceps");
    expect(ex.equipment).toBe("");
  });
});

describe("toCsv", () => {
  it("writes a header row and one line per record", () => {
    const csv = toCsv([{ a: "1", b: "2" }, { a: "3", b: "4" }], ["a", "b"]);
    expect(csv).toBe("a,b\n1,2\n3,4\n");
  });

  it("quotes fields containing commas, quotes or newlines (RFC 4180)", () => {
    const csv = toCsv([{ a: 'He said "hi", loudly', b: "line1\nline2" }], ["a", "b"]);
    expect(csv).toBe('a,b\n"He said ""hi"", loudly","line1\nline2"\n');
  });

  it("renders missing columns as empty and never as undefined", () => {
    const csv = toCsv([{ a: "1" }], ["a", "b"]);
    expect(csv).toBe("a,b\n1,\n");
    expect(csv).not.toContain("undefined");
  });

  it("handles an empty result set with just the header", () => {
    expect(toCsv([], ["a", "b"])).toBe("a,b\n");
  });
});

describe("toJsonl and serializeExport", () => {
  it("writes one JSON object per line", () => {
    expect(toJsonl([{ a: 1 }, { a: 2 }])).toBe('{"a":1}\n{"a":2}\n');
    expect(toJsonl([])).toBe("");
  });

  it("selects content type and extension per format", () => {
    const csv = serializeExport([{ a: "1" }], ["a"], "csv");
    expect(csv.contentType).toContain("text/csv");
    expect(csv.extension).toBe("csv");
    expect(csv.body).toBe("a\n1\n");

    const jsonl = serializeExport([{ a: "1" }], ["a"], "jsonl");
    expect(jsonl.contentType).toContain("ndjson");
    expect(jsonl.extension).toBe("jsonl");
    expect(jsonl.body).toBe('{"a":"1"}\n');
  });
});

describe("plan gating", () => {
  it("allows bulk export only on the plans that advertise it", () => {
    expect(canBulkExport(getPlan("free"))).toBe(false);
    expect(canBulkExport(getPlan("starter"))).toBe(false);
    expect(canBulkExport(getPlan("pro"))).toBe(true);
    expect(canBulkExport(getPlan("enterprise"))).toBe(true);
  });

  it("cannot be satisfied by an object that merely looks like a plan", () => {
    // Defensive: a caller passing arbitrary data must not unlock export.
    expect(canBulkExport({ bulkExport: "yes" } as never)).toBe(false);
    expect(canBulkExport({} as never)).toBe(false);
  });
});

describe("collectRows", () => {
  const page =
    (rowsPerPage: number, total: number, live = true) =>
    async ({ offset, limit }: { query: string; limit: number; offset: number }) => {
      const start = offset;
      const end = Math.min(start + Math.min(limit, rowsPerPage), total);
      return {
        data: Array.from({ length: Math.max(end - start, 0) }, (_, i) => ({ n: start + i })),
        hasMore: end < total,
        live,
        source: "Fixture",
      };
    };

  it("pages until the requested row count is reached", async () => {
    const result = await collectRows(page(25, 1000), { query: "x", maxRows: 60, pageSize: 25 });
    expect(result.rows).toHaveLength(60);
    expect(result.live).toBe(true);
    expect(result.rows[0]).toEqual({ n: 0 });
    expect(result.rows[59]).toEqual({ n: 59 });
  });

  it("stops when the upstream runs out of data", async () => {
    const result = await collectRows(page(25, 30), { query: "x", maxRows: 500, pageSize: 25 });
    expect(result.rows).toHaveLength(30);
  });

  it("stops at the first non-live page instead of appending empties", async () => {
    const result = await collectRows(page(25, 1000, false), { query: "x", maxRows: 500, pageSize: 25 });
    expect(result.rows).toEqual([]);
    expect(result.live).toBe(false);
    expect(result.source).toBe("Fixture");
  });

  it("does not loop forever when the upstream keeps claiming more but returns nothing", async () => {
    let calls = 0;
    const stuck = async () => {
      calls += 1;
      return { data: [], hasMore: true, live: true, source: "Stuck" };
    };
    const result = await collectRows(stuck, { query: "x", maxRows: 500, pageSize: 25 });
    expect(result.rows).toEqual([]);
    expect(calls).toBe(1);
  });
});

describe("headerSafe", () => {
  it("transliterates the characters that break HTTP headers", () => {
    expect(headerSafe("Open Food Facts — https://x.test")).toBe("Open Food Facts - https://x.test");
    expect(headerSafe("© 2026 Publisher")).toBe("(c) 2026 Publisher");
    expect(headerSafe("“quoted” and ‘single’")).toBe('"quoted" and \'single\'');
  });

  it("drops anything still outside printable ASCII", () => {
    // Devanagari has no ASCII equivalent here, so it is removed; the ASCII space survives.
    expect(headerSafe("कोईनाम")).toBe("");
    expect(headerSafe("abc — कोई")).toBe("abc - ");
    expect(headerSafe("ok")).toBe("ok");
  });

  it("keeps every dataset's provenance safe to send as a header", () => {
    // Regression guard: an em dash in a licence string once turned every export
    // into a 500 ("Cannot convert argument to a ByteString").
    for (const dataset of EXPORT_DATASETS) {
      for (const value of [dataset.id, dataset.source, dataset.license, dataset.attribution]) {
        for (const char of headerSafe(value)) {
          expect(char.charCodeAt(0), `${dataset.id}: ${JSON.stringify(value)}`).toBeLessThanOrEqual(0xff);
        }
      }
    }
  });
});

describe("exportFilename", () => {
  it("is stable, dated and stripped of path characters", () => {
    const name = exportFilename("food", "csv", new Date("2026-09-14T10:00:00.000Z"));
    expect(name).toBe("bhg-food-2026-09-14.csv");
    expect(exportFilename("../../etc/passwd", "jsonl", new Date("2026-09-14T10:00:00.000Z"))).toBe(
      "bhg-etcpasswd-2026-09-14.jsonl"
    );
  });
});
