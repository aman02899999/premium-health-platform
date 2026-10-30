// Barcodes and QR codes read by the store scanner. Pure functions, used in the browser and on the server,
// so a code saved from the camera, a handheld scanner or typed by hand always ends up the same.

export type ScanKind = "ean-13" | "ean-8" | "gtin-14" | "qr";
export type Scan = { code: string; kind: ScanKind; /** False when the check digit is wrong: likely a misread. */ checksumOk: boolean };

/** GS1 check digit (EAN-8, UPC-A, EAN-13, GTIN-14) for the digits before it. */
export function gs1CheckDigit(body: string): number {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const d = Number(body[body.length - 1 - i]);
    sum += i % 2 === 0 ? d * 3 : d;
  }
  return (10 - (sum % 10)) % 10;
}

const checksumOk = (digits: string) => gs1CheckDigit(digits.slice(0, -1)) === Number(digits.at(-1));

/**
 * Turns what a scanner read into the code we store. UPC-A (12 digits) and GTIN-14 with a leading zero
 * become the same 13 digits as the EAN-13 on the pack; a GS1 Digital Link QR (…/01/<GTIN>…) gives its
 * GTIN. Any other QR is kept as its text. Returns null for something too short to be a code.
 */
export function parseScan(raw: string): Scan | null {
  const text = raw.replace(/[\s\u0000-\u001f]+/g, "");
  if (text.length < 4 || text.length > 200) return null;
  const link = /^https?:\/\//i.test(text) ? text.match(/\/01\/(\d{8,14})(?:[/?#]|$)/) : null;
  const digits = link ? link[1] : /^\d+$/.test(text) ? text : null;
  if (digits && [8, 12, 13, 14].includes(digits.length)) {
    if (digits.length === 8) return { code: digits, kind: "ean-8", checksumOk: checksumOk(digits) };
    const gtin14 = digits.padStart(14, "0");
    const ok = checksumOk(gtin14);
    return gtin14.startsWith("0") ? { code: gtin14.slice(1), kind: "ean-13", checksumOk: ok } : { code: gtin14, kind: "gtin-14", checksumOk: ok };
  }
  return { code: text, kind: "qr", checksumOk: true };
}
