import { describe, expect, it } from "vitest";
import { sniffImage } from "./image-sniff";

const b = (...xs: (number | string)[]) => Buffer.concat(xs.map((x) => (typeof x === "string" ? Buffer.from(x, "latin1") : Buffer.from([x]))));

describe("sniffImage", () => {
  it("recognises the allowed image formats by their first bytes", () => {
    expect(sniffImage(b(0xff, 0xd8, 0xff, 0xe0, "rest"))).toBe("image/jpeg");
    expect(sniffImage(b(0x89, "PNG\r\n", 0x1a, "\n", "rest"))).toBe("image/png");
    expect(sniffImage(b("GIF89a", "rest"))).toBe("image/gif");
    expect(sniffImage(b("GIF87a", "rest"))).toBe("image/gif");
    expect(sniffImage(b("RIFF", 0, 0, 0, 0, "WEBPVP8 "))).toBe("image/webp");
    expect(sniffImage(b(0, 0, 0, 0x1c, "ftypavif", "rest"))).toBe("image/avif");
    expect(sniffImage(b(0, 0, 0, 0x1c, "ftypavis", "rest"))).toBe("image/avif");
  });

  it("rejects anything else, whatever the browser claimed", () => {
    expect(sniffImage(b("<svg xmlns='http://www.w3.org/2000/svg'>"))).toBeNull();
    expect(sniffImage(b("<html><script>alert(1)</script>"))).toBeNull();
    expect(sniffImage(b("%PDF-1.7"))).toBeNull();
    expect(sniffImage(b("RIFF", 0, 0, 0, 0, "WAVEfmt "))).toBeNull();
    expect(sniffImage(b(0, 0, 0, 0x1c, "ftypmp42"))).toBeNull();
    expect(sniffImage(Buffer.alloc(0))).toBeNull();
  });
});
