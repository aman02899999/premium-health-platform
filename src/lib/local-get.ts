import http from "node:http";

/**
 * GET a path on this same server and resolve with the status code once the whole answer has arrived.
 *
 * The cron tick uses this instead of fetch(): Node's fetch gives up after 5 minutes without response
 * headers (undici's headersTimeout), and a Reel render plus the Instagram upload can take longer. When
 * that happened the tick answered early, Cloud Run saw no open request, slowed the CPU to almost
 * nothing, and the job froze half way with its post stuck on "pending". node:http has no such limit;
 * Cloud Run's own 15-minute request timeout still caps the whole tick.
 */
export function localGet(url: string, headers: Record<string, string>): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers }, (res) => {
      res.resume();
      res.on("end", () => resolve(res.statusCode ?? 0));
      res.on("error", reject);
    });
    req.on("error", reject);
  });
}
