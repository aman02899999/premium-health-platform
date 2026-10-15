// Reads the first sheet of a CSV or Excel (.xlsx) file into rows of text cells. No server-only
// imports so it is unit-tested directly. Old binary .xls files are refused with a clear message.
import { unzipSync, strFromU8 } from "fflate";

export class SheetError extends Error {}

const MAX_UNZIPPED = 40 * 1024 * 1024; // a few thousand members is well under 1 MB of XML

export function readSheet(bytes: Uint8Array, fileName: string): string[][] {
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b; // "PK": .xlsx
  if (isZip) return readXlsx(bytes);
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf) throw new SheetError("This is an old .xls file. In Excel choose File → Save As → Excel Workbook (.xlsx) or CSV, then upload that.");
  if (/\.(xlsx|xlsm)$/i.test(fileName)) throw new SheetError("This Excel file couldn't be opened. Save it again as .xlsx or CSV and retry.");
  return readCsv(new TextDecoder("utf-8").decode(bytes));
}

// ---------- CSV ----------

export function readCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.slice(0, src.search(/\r?\n|$/));
  const counts = [",", ";", "\t"].map((d) => [d, outsideQuotes(firstLine).split(d).length - 1] as const);
  const delim = counts.sort((a, b) => b[1] - a[1])[0][1] > 0 ? counts[0][0] : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.map((r) => r.map((c) => c.trim()));
}

const outsideQuotes = (line: string) => line.replace(/"[^"]*"/g, "");

// ---------- XLSX ----------

const decodeXml = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

/** All the <t> text inside a fragment (rich text splits one cell into several runs). */
const textOf = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decodeXml(m[1])).join("");

const colIndex = (ref: string) => {
  const letters = ref.replace(/\d+$/, "");
  let n = 0;
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

function readXlsx(bytes: Uint8Array): string[][] {
  let total = 0;
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, {
      filter: (f) => {
        const wanted = /^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|worksheets\/[^/]+\.xml)$/.test(f.name);
        if (wanted) total += f.originalSize;
        return wanted;
      },
    });
  } catch {
    throw new SheetError("This Excel file couldn't be opened. Save it again as .xlsx or CSV and retry.");
  }
  if (total > MAX_UNZIPPED) throw new SheetError("This file is too large. Keep it to the member list only (a few thousand rows).");
  const read = (name: string) => (files[name] ? strFromU8(files[name]) : "");

  // First sheet in the workbook's own order (not necessarily sheet1.xml).
  const workbook = read("xl/workbook.xml");
  const rels = read("xl/_rels/workbook.xml.rels");
  const firstId = workbook.match(/<sheet\b[^>]*\br:id="([^"]+)"/)?.[1];
  const target = firstId ? rels.match(new RegExp(`<Relationship\\b[^>]*Id="${firstId}"[^>]*Target="([^"]+)"`))?.[1] ?? rels.match(new RegExp(`<Relationship\\b[^>]*Target="([^"]+)"[^>]*Id="${firstId}"`))?.[1] : undefined;
  const sheetPath = target ? `xl/${target.replace(/^\/?xl\//, "").replace(/^\//, "")}` : Object.keys(files).filter((f) => f.startsWith("xl/worksheets/")).sort()[0];
  const sheet = sheetPath ? read(sheetPath) : "";
  if (!sheet) throw new SheetError("The Excel file has no sheet with data.");

  const shared = [...read("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]));
  const rows: string[][] = [];
  for (const rm of sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: string[] = [];
    let next = 0;
    for (const cm of rm[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[1];
      const body = cm[2] ?? "";
      const ref = attrs.match(/\br="([A-Z]+\d+)"/)?.[1];
      const idx = ref ? colIndex(ref) : next;
      next = idx + 1;
      const type = attrs.match(/\bt="([^"]+)"/)?.[1];
      const v = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      let value = "";
      if (type === "s") value = shared[Number(v)] ?? "";
      else if (type === "inlineStr") value = textOf(body);
      else if (v !== undefined) value = decodeXml(v);
      row[idx] = value.trim();
    }
    rows.push(Array.from(row, (c) => c ?? ""));
  }
  return rows;
}
