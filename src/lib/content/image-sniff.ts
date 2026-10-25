// What an uploaded file really is, from its first bytes. The browser's declared type is only a
// claim, so uploads are kept only when the bytes agree with it.

const starts = (buf: Buffer, sig: string, at = 0) => buf.length >= at + sig.length && buf.toString("latin1", at, at + sig.length) === sig;

export function sniffImage(buf: Buffer): "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "image/avif" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (starts(buf, "\x89PNG\r\n\x1a\n")) return "image/png";
  if (starts(buf, "GIF87a") || starts(buf, "GIF89a")) return "image/gif";
  if (starts(buf, "RIFF") && starts(buf, "WEBP", 8)) return "image/webp";
  if (starts(buf, "ftyp", 4) && (starts(buf, "avif", 8) || starts(buf, "avis", 8))) return "image/avif";
  return null;
}
