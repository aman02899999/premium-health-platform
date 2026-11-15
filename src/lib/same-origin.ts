/**
 * True when a write request comes from this site's own pages (or carries no Origin at all, as
 * server-to-server calls do). Behind a proxy such as Cloud Run the request URL holds the
 * container's address (0.0.0.0:8080), not the public domain, so the Origin is compared with the
 * hosts the browser asked for (Host, X-Forwarded-Host) as well as the URL's own host. A page on
 * another site can't change those headers on a visitor's request, so this still blocks cross-site
 * writes. The configured public domain (with and without www) is always accepted too.
 */
const SITE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.royalfitnesclub.in").host.toLowerCase();
  } catch {
    return "www.royalfitnesclub.in";
  }
})();
const SITE_HOSTS = [SITE_HOST, SITE_HOST.startsWith("www.") ? SITE_HOST.slice(4) : `www.${SITE_HOST}`];

export function isSameOrigin(req: { url: string; headers: Headers }): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  let host: string;
  try {
    host = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  if (!host) return false;
  const own = [new URL(req.url).host, req.headers.get("host"), ...(req.headers.get("x-forwarded-host") ?? "").split(","), ...SITE_HOSTS];
  return own.some((h) => h?.trim().toLowerCase() === host);
}
