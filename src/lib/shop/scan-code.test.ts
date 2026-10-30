import { describe, expect, it } from "vitest";
import { gs1CheckDigit, parseScan } from "./scan-code";

describe("store scanner codes", () => {
  it("computes the GS1 check digit", () => {
    expect(gs1CheckDigit("890103087502")).toBe(1); // 8901030875021
    expect(gs1CheckDigit("400638133393")).toBe(1); // 4006381333931
    expect(gs1CheckDigit("9638507")).toBe(4); // EAN-8 96385074
  });

  it("keeps an EAN-13 as printed and checks it", () => {
    expect(parseScan("8901030875021")).toEqual({ code: "8901030875021", kind: "ean-13", checksumOk: true });
    expect(parseScan("8901030875020")?.checksumOk).toBe(false);
  });

  it("stores UPC-A and zero-led GTIN-14 as the same 13 digits", () => {
    expect(parseScan("036000291452")).toEqual({ code: "0036000291452", kind: "ean-13", checksumOk: true });
    expect(parseScan("00036000291452")?.code).toBe("0036000291452");
    expect(parseScan("0036000291452")?.code).toBe("0036000291452");
  });

  it("strips spaces and the Enter a handheld scanner sends", () => {
    expect(parseScan(" 8901030875021\r\n")?.code).toBe("8901030875021");
    expect(parseScan("890 1030 875021")?.code).toBe("8901030875021");
  });

  it("reads the GTIN out of a GS1 Digital Link QR", () => {
    expect(parseScan("https://id.gs1.org/01/08901030875021/10/ABC123")).toEqual({ code: "8901030875021", kind: "ean-13", checksumOk: true });
    expect(parseScan("https://brand.example/01/8901030875021?x=1")?.code).toBe("8901030875021");
  });

  it("keeps EAN-8 and other QR text as they are", () => {
    expect(parseScan("96385074")).toEqual({ code: "96385074", kind: "ean-8", checksumOk: true });
    expect(parseScan("https://verify.brand.example/a1b2")).toEqual({ code: "https://verify.brand.example/a1b2", kind: "qr", checksumOk: true });
    expect(parseScan("BKW-ISO-2KG")?.kind).toBe("qr");
  });

  it("refuses nothing-codes", () => {
    expect(parseScan("")).toBeNull();
    expect(parseScan("  12 ")).toBeNull();
    expect(parseScan("x".repeat(201))).toBeNull();
  });
});
