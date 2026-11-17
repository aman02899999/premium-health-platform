import "server-only";
import { join } from "node:path";
import sharp from "sharp";

// A long video's ready-made thumbnail with a big Devanagari headline on the empty lower-left
// (hindi.ts): Hindi first for people scrolling YouTube in Hindi. Returns a 1280×720 JPEG.
// The text is drawn by sharp (Pango), because Satori doesn't shape Devanagari: it put the
// "ि" matra after its letter (दलि for दिल) when tried on 17 Nov 2026.
const FONT = join(process.cwd(), "src/lib/social/fonts/noto-sans-devanagari-700.woff");

const markup = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function hindiThumbnail(jpeg: Buffer, headline: string): Promise<Buffer> {
  const size = [...headline].length > 22 ? 34 : 42;
  const text = await sharp({ text: { text: `<span foreground="#0b0b0b">${markup(headline)}</span>`, font: `Noto Sans Devanagari Bold ${size}`, fontfile: FONT, rgba: true, dpi: 110, width: 1400 } })
    .png()
    .toBuffer();
  const meta = await sharp(text).metadata();
  const w = Math.min(700, (meta.width ?? 600) + 44);
  const h = (meta.height ?? 60) + 26;
  const left = 40;
  const top = 720 - 34 - h;
  const box = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="14" fill="#ffcf5a"/></svg>`);
  const fitted = (meta.width ?? 0) > w - 44 ? await sharp(text).resize({ width: w - 44 }).png().toBuffer() : text;
  return sharp(jpeg)
    .resize(1280, 720, { fit: "cover" })
    .composite([
      { input: box, left, top },
      { input: fitted, left: left + 22, top: top + 11 },
    ])
    .jpeg({ quality: 88 })
    .toBuffer();
}
