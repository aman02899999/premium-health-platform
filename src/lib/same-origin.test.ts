import { describe, expect, it } from "vitest";
import { isSameOrigin } from "./same-origin";

const req = (url: string, headers: Record<string, string>) => new Request(url, { method: "POST", headers });

describe("isSameOrigin", () => {
  it("allows requests with no Origin header (server-to-server, same-site GET forms)", () => {
    expect(isSameOrigin(req("https://www.royalfitnesclub.in/api/leads", {}))).toBe(true);
  });

  it("allows the site's own pages when the URL carries the public host", () => {
    expect(isSameOrigin(req("https://www.royalfitnesclub.in/api/leads", { origin: "https://www.royalfitnesclub.in" }))).toBe(true);
  });

  it("allows the site's own pages behind a proxy that hides the public host from the URL", () => {
    // Cloud Run: the container listens on 0.0.0.0:8080, the public host arrives in the Host header.
    expect(isSameOrigin(req("http://0.0.0.0:8080/api/leads", { origin: "https://www.royalfitnesclub.in", host: "www.royalfitnesclub.in" }))).toBe(true);
    expect(isSameOrigin(req("http://localhost:8080/api/leads", { origin: "https://royalfitnesclub.in", "x-forwarded-host": "royalfitnesclub.in", host: "localhost:8080" }))).toBe(true);
  });

  it("allows the public domain, with or without www, even if the proxy passes no usable host", () => {
    expect(isSameOrigin(req("http://0.0.0.0:8080/api/leads", { origin: "https://www.royalfitnesclub.in", host: "0.0.0.0:8080" }))).toBe(true);
    expect(isSameOrigin(req("http://0.0.0.0:8080/api/leads", { origin: "https://royalfitnesclub.in", host: "0.0.0.0:8080" }))).toBe(true);
  });

  it("blocks other sites, whatever host the server thinks it has", () => {
    expect(isSameOrigin(req("https://www.royalfitnesclub.in/api/leads", { origin: "https://evil.example" }))).toBe(false);
    expect(isSameOrigin(req("http://0.0.0.0:8080/api/leads", { origin: "https://evil.example", host: "www.royalfitnesclub.in" }))).toBe(false);
    expect(isSameOrigin(req("http://0.0.0.0:8080/api/leads", { origin: "https://www.royalfitnesclub.in.evil.example", host: "www.royalfitnesclub.in" }))).toBe(false);
  });

  it("blocks an Origin that isn't a URL (for example the literal null of a sandboxed frame)", () => {
    expect(isSameOrigin(req("https://www.royalfitnesclub.in/api/leads", { origin: "null" }))).toBe(false);
  });
});
