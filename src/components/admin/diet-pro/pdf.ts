"use client";

// Diet Pro's "Branded PDF" button: loads the images in the browser and hands them to the shared
// builder (src/lib/diet-pro/pdf-core.ts), which the server also uses for automatic plans.
import { buildPlanPdf, type PlanPdfInput } from "@/lib/diet-pro/pdf-core";

export type { PdfBusiness, PdfCoach, PdfExtras, PlanPdfInput } from "@/lib/diet-pro/pdf-core";

async function toDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Square photo → circular PNG (works for WebP/JPEG sources jsPDF can't embed directly). */
async function roundPhoto(src: string): Promise<string | null> {
  if (!src) return null;
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    await img.decode();
    const size = 320;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Trainer photos are full-length gym shots: zoom to head and shoulders, a little above centre.
    const side = Math.min(img.naturalWidth, img.naturalHeight) * 0.55;
    const sx = (img.naturalWidth - side) / 2;
    const sy = Math.min(img.naturalHeight - side, Math.max(0, img.naturalHeight * 0.42 - side / 2));
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

const assets = async (photo: string) => {
  const [logo, mark, face] = await Promise.all([toDataUrl("/brand/logo-full.png"), toDataUrl("/brand/logo-mark.png"), roundPhoto(photo)]);
  return { logo, mark, photo: face };
};

export async function downloadPlanPdf(input: PlanPdfInput) {
  const { doc, filename } = await buildPlanPdf(input, await assets(input.coach.photo));
  doc.save(filename);
}

/** The same PDF as a Blob (for uploading a coach-edited plan to send to the client). */
export async function planPdfBlob(input: PlanPdfInput): Promise<{ blob: Blob; filename: string }> {
  const { doc, filename } = await buildPlanPdf(input, await assets(input.coach.photo));
  return { blob: doc.output("blob"), filename };
}
