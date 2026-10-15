import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { mapHeader, parseDate, parsePhone, toCandidates } from "./member-import";
import { SheetError, readCsv, readSheet } from "./sheet";

const TODAY = "2026-10-15";

describe("readCsv", () => {
  it("handles quotes, commas inside quotes, CRLF, a BOM and semicolon files", () => {
    expect(readCsv('﻿Name,Mobile\r\n"Kumar, Rahul",98765 43210\r\n"Say ""hi""",9123456780')).toEqual([
      ["Name", "Mobile"],
      ["Kumar, Rahul", "98765 43210"],
      ['Say "hi"', "9123456780"],
    ]);
    expect(readCsv("Name;Mobile;End\nAsha;9123456780;01.11.2026\n")).toEqual([
      ["Name", "Mobile", "End"],
      ["Asha", "9123456780", "01.11.2026"],
    ]);
  });
});

/** A minimal .xlsx the way Excel writes it: shared strings, a number cell, a gap, sheet order from workbook.xml. */
function xlsx(): Uint8Array {
  const sheet = `<worksheet><sheetData>
    <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="D1" t="s"><v>2</v></c></row>
    <row r="2"><c r="A2" t="s"><v>3</v></c><c r="B2"><v>9876543210</v></c><c r="D2" s="1"><v>46326</v></c></row>
    <row r="3"><c r="A3" t="inlineStr"><is><t>Asha &amp; Co</t></is></c><c r="B3" t="str"><v>+91 91234 56780</v></c><c r="D3"/></row>
  </sheetData></worksheet>`;
  const shared = `<sst><si><t>Member Name</t></si><si><r><t>Mobile</t></r><r><t xml:space="preserve"> No</t></r></si><si><t>Expiry Date</t></si><si><t>Rahul Kumar</t></si></sst>`;
  return zipSync({
    "[Content_Types].xml": strToU8("<Types/>"),
    "xl/workbook.xml": strToU8(`<workbook><sheets><sheet name="Members" sheetId="2" r:id="rId7"/><sheet name="Old" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId7" Target="worksheets/sheet2.xml"/></Relationships>`),
    "xl/sharedStrings.xml": strToU8(shared),
    "xl/worksheets/sheet1.xml": strToU8(`<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>wrong sheet</t></is></c></row></sheetData></worksheet>`),
    "xl/worksheets/sheet2.xml": strToU8(sheet),
  });
}

describe("readSheet (.xlsx)", () => {
  it("reads the workbook's first sheet with shared strings, rich text, inline strings and gaps", () => {
    expect(readSheet(xlsx(), "members.xlsx")).toEqual([
      ["Member Name", "Mobile No", "", "Expiry Date"],
      ["Rahul Kumar", "9876543210", "", "46326"],
      ["Asha & Co", "+91 91234 56780", "", ""],
    ]);
  });

  it("refuses old .xls and broken files with a clear message", () => {
    expect(() => readSheet(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0]), "old.xls")).toThrow(SheetError);
    expect(() => readSheet(new Uint8Array([0x50, 0x4b, 1, 2, 3]), "bad.xlsx")).toThrow(/couldn't be opened/);
  });
});

describe("column mapping", () => {
  it("recognises the headings gyms actually use", () => {
    const m = mapHeader(["S.No", "Member Name", "Mobile No.", "E-mail ID", "Package", "Fees Paid", "Date of Joining", "Valid Till", "Remarks"]);
    expect(Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v!.header]))).toEqual({
      name: "Member Name",
      phone: "Mobile No.",
      email: "E-mail ID",
      plan: "Package",
      start: "Date of Joining",
      end: "Valid Till",
      notes: "Remarks",
    });
    expect(mapHeader(["Name", "WhatsApp", "Plan Start", "Plan End", "Months"])).toMatchObject({ start: { header: "Plan Start" }, end: { header: "Plan End" }, duration: { header: "Months" } });
  });
});

describe("parseDate", () => {
  it.each([
    ["15/10/2026", "2026-10-15"],
    ["5-1-26", "2026-01-05"],
    ["15.10.2026", "2026-10-15"],
    ["2026-10-15", "2026-10-15"],
    ["2026-10-15T00:00:00", "2026-10-15"],
    ["15 Oct 2026", "2026-10-15"],
    ["15-Oct-26", "2026-10-15"],
    ["1st November 2026", "2026-11-01"],
    ["Oct 15, 2026", "2026-10-15"],
    ["10/25/2026", "2026-10-25"], // impossible day-first, so month-first
    ["46326", "2026-10-31"], // Excel serial
    ["31/02/2026", null],
    ["soon", null],
    ["", null],
  ])("%s → %s", (raw, want) => expect(parseDate(raw)).toBe(want));
});

describe("parsePhone", () => {
  it.each([
    ["98765 43210", "9876543210"],
    ["+91-98765-43210", "9876543210"],
    ["09876543210", "9876543210"],
    ["9876543210.0", "9876543210"],
    ["9.88E+09", null],
    ["12345", null],
    ["5876543210", null],
  ])("%s → %s", (raw, want) => expect(parsePhone(raw)).toBe(want));
});

describe("toCandidates", () => {
  it("skips title rows, fills end dates from durations, and explains every skipped row", () => {
    const rows = [
      ["Royal Fitness Club member list"],
      [],
      ["Name", "Mobile", "Plan", "Start date", "End date", "Notes"],
      ["Rahul Kumar", "98765 43210", "Quarterly", "01/09/2026", "30/11/2026", "Morning"],
      ["Asha Rao", "9123456780", "3 Months", "01/10/2026", "", ""],
      ["", "", "", "", "", ""],
      ["X", "9000000001", "Monthly", "", "01/11/2026", ""],
      ["No Phone", "", "Monthly", "", "01/11/2026", ""],
      ["Bad Date", "9000000002", "Monthly", "", "someday", ""],
      ["Old Member", "9000000003", "Monthly", "", "01/09/2026", ""],
      ["Sci Phone", "9.12E+09", "Monthly", "", "01/11/2026", ""],
    ];
    const out = toCandidates(rows, TODAY);
    if (typeof out === "string") throw new Error(out);
    expect(out.candidates).toEqual([
      { row: 4, name: "Rahul Kumar", phone: "9876543210", email: null, planName: "Quarterly", startOn: "2026-09-01", expiresOn: "2026-11-30", notes: "Morning" },
      { row: 5, name: "Asha Rao", phone: "9123456780", email: null, planName: "3 Months", startOn: "2026-10-01", expiresOn: "2026-12-31", notes: "" },
      // No start date: today for a running membership, the end date for one that already ended.
      { row: 10, name: "Old Member", phone: "9000000003", email: null, planName: "Monthly", startOn: "2026-09-01", expiresOn: "2026-09-01", notes: "" },
    ]);
    expect(out.errors).toEqual([
      { row: 7, message: "Name is missing." },
      { row: 8, message: '"blank" isn\'t a 10-digit mobile number.' },
      { row: 9, message: 'Couldn\'t read the end date "someday". Use a format like 15/10/2026.' },
      { row: 11, message: "Mobile shows as 9.12E+09: format that column as Text in Excel and export again." },
    ]);
  });

  it("asks for the columns it can't do without", () => {
    expect(toCandidates([["Plan", "Amount"]], TODAY)).toMatch(/header row/);
    expect(toCandidates([["Name", "Mobile", "Plan"]], TODAY)).toMatch(/End date/);
  });

  it("works end to end on an Excel file with a serial expiry date", () => {
    const out = toCandidates(readSheet(xlsx(), "m.xlsx"), TODAY);
    if (typeof out === "string") throw new Error(out);
    expect(out.candidates.map((c) => [c.name, c.phone, c.expiresOn])).toEqual([["Rahul Kumar", "9876543210", "2026-10-31"]]);
    expect(out.errors).toEqual([{ row: 3, message: "End date is missing." }]);
  });
});
