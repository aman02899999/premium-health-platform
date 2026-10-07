import { describe, expect, it } from "vitest";
import { clip, fdaDate, parseFda, parsePubmed, parseWho, plainText } from "./live-sources";

// Fixtures mirror real responses captured from each API on 2026-10-02.

describe("live sources", () => {
  it("parses WHO Disease Outbreak News with the real date and a WHO link", () => {
    const [n] = parseWho({
      value: [{ Title: "Ebola disease caused by Bundibugyo virus - Democratic Republic of the Congo", OverrideTitle: "", UseOverrideTitle: false, PublicationDate: "2026-09-25T15:30:18Z", LastModified: "2026-09-25T16:48:20Z", UrlName: "2026-DON618", Summary: "<p>Since the last Disease Outbreak News was published on 11 September 2026, the outbreak has expanded.</p>" }],
    });
    expect(n.slug).toBe("who-2026-don618");
    expect(n.kind).toBe("live");
    expect(n.category).toBe("Outbreak Advisory");
    expect(n.publishedAt).toBe("2026-09-25T15:30:18.000Z");
    expect(n.sourceUrl).toBe("https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON618");
    expect(n.summary).not.toMatch(/<p>/);
    expect(n.reviewer).toMatch(/Not medically reviewed/);
  });

  it("drops WHO rows without a date or url", () => {
    expect(parseWho({ value: [{ Title: "x" }] })).toEqual([]);
    expect(parseWho(null)).toEqual([]);
  });

  it("parses openFDA recalls, de-duplicating strengths of the same recall", () => {
    const rec = { report_date: "20260923", classification: "Class II", recalling_firm: "Inventia Healthcare Limited", product_description: "Chlorthalidone Tablets, USP, 25 mg, 100 Tablets per bottle", reason_for_recall: "Failed Dissolution Specifications", status: "Ongoing" };
    const items = parseFda({ results: [{ ...rec, recall_number: "D-0852-2026" }, { ...rec, recall_number: "D-0853-2026", product_description: "Chlorthalidone Tablets, USP, 50 mg" }] });
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("US FDA recall: Chlorthalidone Tablets made by Inventia Healthcare Limited");
    expect(items[0].publishedAt).toBe("2026-09-23T12:00:00.000Z");
    expect(items[0].category).toBe("Drug Safety");
    expect(items[0].body[1].paragraphs?.[1]).toMatch(/Do not stop a prescribed medicine/);
  });

  it("reads FDA yyyymmdd dates and rejects bad ones", () => {
    expect(fdaDate("20260101")).toBe("2026-01-01T12:00:00.000Z");
    expect(fdaDate("2026-01-01")).toBeNull();
  });

  it("parses PubMed summaries and never shows a future date", () => {
    const now = new Date("2026-10-02T00:00:00Z");
    const [n] = parsePubmed(
      { result: { uids: ["42810793"], "42810793": { uid: "42810793", title: "Sarcopenia in Indian adults with type 2 diabetes: a systematic review and meta-analysis.", source: "BMJ Open", fulljournalname: "BMJ open", sortpubdate: "2027/01/15 00:00", pubtype: ["Journal Article", "Meta-Analysis"], authors: [{ name: "A B" }] } } },
      now,
    );
    expect(n.slug).toBe("pubmed-42810793");
    expect(n.sourceUrl).toBe("https://pubmed.ncbi.nlm.nih.gov/42810793/");
    expect(n.publishedAt).toBe(now.toISOString());
    expect(n.summary).toMatch(/meta-analysis/);
  });

  it("cleans and clips text", () => {
    expect(plainText("<b>A&nbsp;&amp; B</b>")).toBe("A & B");
    expect(clip("One. Two. Three is long.", 12)).toBe("One. Two.");
  });
});
