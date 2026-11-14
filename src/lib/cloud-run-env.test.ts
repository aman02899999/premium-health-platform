import { describe, expect, it } from "vitest";
import { parseEnv } from "../../scripts/cloud-run-env.mjs";

describe("parseEnv", () => {
  it("reads NAME=value lines and strips quotes", () => {
    expect(parseEnv("# c\nA=1\nB='x y'\n\nC=\"z=1\"")).toEqual({ A: "1", B: "x y", C: "z=1" });
  });
  it("never puts any part of a bad line into the error (deploy logs are public)", () => {
    const secret = "META_APP_SECRET-- a8b9c0d1e2f3";
    let msg = "";
    try { parseEnv(`A=1\n${secret}`); } catch (e) { msg = String(e); }
    expect(msg).toContain("line 2");
    expect(msg).not.toContain("META");
    expect(msg).not.toContain("a8");
  });
  it("names only the line number for a bad name", () => {
    let msg = "";
    try { parseEnv("lower_case=topsecret"); } catch (e) { msg = String(e); }
    expect(msg).toContain("line 1");
    expect(msg).not.toContain("lower_case");
    expect(msg).not.toContain("topsecret");
  });
});
