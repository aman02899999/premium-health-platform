import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { localGet } from "./local-get";

let server: http.Server;
let base = "";
beforeAll(async () => {
  server = http.createServer((req, res) => {
    const wait = Number(new URL(req.url ?? "/", "http://x").searchParams.get("wait") ?? 0);
    setTimeout(() => {
      res.statusCode = req.headers.authorization === "Bearer ok" ? 200 : 401;
      res.end("x".repeat(100_000));
    }, wait);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

describe("localGet (cron tick)", () => {
  it("passes the auth header and returns the status after the whole body arrives", async () => {
    expect(await localGet(`${base}/job?wait=200`, { authorization: "Bearer ok" })).toBe(200);
    expect(await localGet(`${base}/job`, { authorization: "Bearer no" })).toBe(401);
  });

  it("sets no client timeout of its own (Cloud Run's 15-minute limit is the only cap)", async () => {
    let timeoutSet = false;
    const orig = http.ClientRequest.prototype.setTimeout;
    http.ClientRequest.prototype.setTimeout = function (...args: Parameters<typeof orig>) {
      timeoutSet = true;
      return orig.apply(this, args);
    };
    try {
      await localGet(`${base}/job?wait=50`, { authorization: "Bearer ok" });
    } finally {
      http.ClientRequest.prototype.setTimeout = orig;
    }
    expect(timeoutSet).toBe(false);
  });

  it("rejects when the server can't be reached", async () => {
    await expect(localGet("http://127.0.0.1:1/job", {})).rejects.toThrow();
  });
});
