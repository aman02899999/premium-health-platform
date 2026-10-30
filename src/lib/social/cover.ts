import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

/**
 * A public cover image (e.g. /library/covers/vol-03.webp) as a PNG data URL for Satori, which
 * can't draw WebP. Null when the file is missing, so a card still renders without it.
 */
export async function coverDataUrl(publicPath: string | null, width = 480): Promise<string | null> {
  if (!publicPath || !/^\/library\/covers\/vol-\d{2}\.webp$/.test(publicPath)) return null;
  try {
    const png = await sharp(await readFile(join(process.cwd(), "public", publicPath))).resize({ width }).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * A coach photo from public/gallery, cropped to width × height (attention-based, so the person
 * stays in frame), as a JPEG data URL for Satori. Null when the file is missing or not listed.
 */
export async function galleryDataUrl(file: string, width: number, height: number): Promise<string | null> {
  if (!/^[a-z0-9-]+\.webp$/.test(file)) return null;
  try {
    const jpg = await sharp(await readFile(join(process.cwd(), "public/gallery", file)))
      .resize({ width, height, fit: "cover", position: sharp.strategy.attention })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpg.toString("base64")}`;
  } catch {
    return null;
  }
}
