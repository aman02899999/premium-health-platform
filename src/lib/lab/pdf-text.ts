// Pulls the positioned text out of a lab report PDF, in the browser. Loaded only when a member
// picks a file, so the PDF library never slows the page down. The file is never uploaded.
import type { TextItem } from "./pdf-read";

export const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_PAGES = 30;

export class PdfProblem extends Error {}

export async function pdfItems(file: File): Promise<TextItem[][]> {
  if (file.size > MAX_PDF_BYTES) throw new PdfProblem("This PDF is bigger than 10 MB. Please use the report your lab sent by email or WhatsApp.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (String.fromCharCode(...bytes.slice(0, 5)) !== "%PDF-") throw new PdfProblem("This file isn't a PDF. Please pick the PDF report from your lab.");

  const { getDocumentProxy } = await import("unpdf");
  let pdf;
  try {
    pdf = await getDocumentProxy(bytes);
  } catch (e) {
    if ((e as { name?: string })?.name === "PasswordException") throw new PdfProblem("This PDF is password protected. Open it, save a copy without the password, and try again, or type the values in below.");
    throw new PdfProblem("We couldn't open this PDF. Try downloading it again from your lab, or type the values in below.");
  }
  try {
    const pages: TextItem[][] = [];
    for (let p = 1; p <= Math.min(pdf.numPages, MAX_PAGES); p++) {
      const content = await (await pdf.getPage(p)).getTextContent();
      pages.push(
        content.items.flatMap((it) =>
          "str" in it && it.str.trim() ? [{ str: it.str, x: it.transform[4], y: it.transform[5], w: it.width, h: it.height || Math.abs(it.transform[3]) }] : [],
        ),
      );
    }
    return pages;
  } finally {
    void pdf.loadingTask.destroy();
  }
}
