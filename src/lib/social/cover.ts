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
