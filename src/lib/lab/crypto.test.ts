import { randomBytes } from "crypto";
import { describe, expect, it } from "vitest";
import { labKey, open, seal } from "./crypto";

describe("saved report encryption", () => {
  const key = randomBytes(32);

  it("round-trips and never stores the values in plain text", () => {
    const sealed = seal(key, { results: [{ name: "Haemoglobin", value: 11.2 }] });
    expect(sealed).not.toMatch(/Haemoglobin|11\.2/);
    expect(open(key, sealed)).toEqual({ results: [{ name: "Haemoglobin", value: 11.2 }] });
  });

  it("refuses a tampered value or the wrong key", () => {
    const sealed = seal(key, { a: 1 });
    const bytes = Buffer.from(sealed, "base64");
    bytes[bytes.length - 1] ^= 1;
    expect(open(key, bytes.toString("base64"))).toBeNull();
    expect(open(randomBytes(32), sealed)).toBeNull();
  });

  it("needs a 32-byte key", () => {
    expect(labKey({})).toBeNull();
    expect(labKey({ LAB_DATA_KEY: "short" })).toBeNull();
    expect(labKey({ LAB_DATA_KEY: key.toString("base64") })?.equals(key)).toBe(true);
  });
});
